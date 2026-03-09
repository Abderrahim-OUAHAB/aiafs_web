import React, { useState, useEffect } from "react";
import {
  FileBarChart,
  Download,
  Calendar,
  TrendingUp,
  Droplets,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

export default function ReportsPage() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("1d");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/observations?limit=5000&range=${timeRange}`);
        if (!res.ok) throw new Error("Erreur");
        const data = await res.json();
        setObservations(data || []);
      } catch {
        setObservations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const levels = observations.map((o) => o.niveau_cours_eau_m).filter((v) => v != null);
  const stats = levels.length > 0
    ? {
        min: Math.min(...levels),
        max: Math.max(...levels),
        avg: levels.reduce((a, b) => a + b, 0) / levels.length,
        count: levels.length,
        alertCount: levels.filter((l) => l >= 3.8).length,
        vigilanceCount: levels.filter((l) => l >= 3.0 && l < 3.8).length,
      }
    : null;

  const RANGES = [
    { key: "1h", label: "1H" },
    { key: "6h", label: "6H" },
    { key: "1d", label: "1J" },
    { key: "1w", label: "1S" },
    { key: "all", label: "Tout" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-base text-gray-700 mt-1">
            Analyses et synthèses des données hydrologiques.
          </p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setTimeRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                timeRange === r.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-base text-gray-600">Chargement des données…</p>
        </div>
      ) : !stats ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-base text-gray-600">Aucune donnée disponible.</p>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Droplets className="w-4 h-4 text-blue-500" />}
              label="Niveau Moyen"
              value={`${stats.avg.toFixed(4)} m`}
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-red-500" />}
              label="Niveau Maximum"
              value={`${stats.max.toFixed(4)} m`}
            />
            <StatCard
              icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
              label="Épisodes de Vigilance"
              value={stats.vigilanceCount}
              subtitle={`sur ${stats.count} mesures`}
            />
            <StatCard
              icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
              label="Épisodes d'Alerte"
              value={stats.alertCount}
              subtitle={`sur ${stats.count} mesures`}
            />
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileBarChart className="w-4 h-4 text-blue-600" />
              Synthèse de la Période
            </h3>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow label="Nombre total de mesures" value={stats.count} />
                <InfoRow label="Niveau minimum" value={`${stats.min.toFixed(4)} m`} />
                <InfoRow label="Niveau maximum" value={`${stats.max.toFixed(4)} m`} />
                <InfoRow label="Niveau moyen" value={`${stats.avg.toFixed(4)} m`} />
                <InfoRow
                  label="Amplitude"
                  value={`${(stats.max - stats.min).toFixed(4)} m`}
                />
                <InfoRow
                  label="État actuel"
                  value={
                    stats.max >= 3.8
                      ? "Alerte"
                      : stats.max >= 3.0
                        ? "Vigilance"
                        : "Normal"
                  }
                  valueColor={
                    stats.max >= 3.8
                      ? "text-red-600"
                      : stats.max >= 3.0
                        ? "text-amber-600"
                        : "text-green-600"
                  }
                />
              </div>
            </div>
          </div>

          {/* Recent observations table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Dernières Observations
              </h3>
              <span className="text-base text-gray-600">{observations.length} enregistrements</span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700 text-base uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Date</th>
                    <th className="px-4 py-2.5 text-left font-medium">Niveau (m)</th>
                    <th className="px-4 py-2.5 text-left font-medium">Débit (m³/s)</th>
                    <th className="px-4 py-2.5 text-left font-medium">Précipitation</th>
                    <th className="px-4 py-2.5 text-left font-medium">Marée</th>
                    <th className="px-4 py-2.5 text-left font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {observations.slice(-50).reverse().map((obs, i) => {
                    const level = obs.niveau_cours_eau_m;
                    const isAlert = level >= 3.8;
                    const isVigilance = level >= 3.0 && level < 3.8;
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700">
                          {new Date(obs.date_mesure).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {level?.toFixed(4)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {obs.debit_cours_eau_m3s?.toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {obs.precipitation?.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {obs.maree?.toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAlert ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                              Alerte
                            </span>
                          ) : isVigilance ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              Vigilance
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-base font-medium text-gray-700">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-base text-gray-600 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function InfoRow({ label, value, valueColor = "text-gray-900" }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <span className="text-base text-gray-700">{label}</span>
      <span className={`text-base font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}
