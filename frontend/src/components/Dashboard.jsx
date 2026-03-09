import React from "react";
import WaterLevelChart from "./WaterLevelChart.jsx";
import AlertPanel from "./AlertPanel.jsx";
import { Link } from "react-router-dom";
import { Activity, Gauge, TrendingUp, Droplets } from "lucide-react";

export default function Dashboard({
  observations,
  predictions,
  lastUpdate,
  isLoading,
  error,
  timeRange,
  setTimeRange,
}) {
  const currentLevel =
    observations && observations.length > 0
      ? observations[observations.length - 1].niveau_cours_eau_m
      : null;

  const maxPredicted =
    predictions && predictions.length > 0
      ? Math.max(
          ...predictions
            .map((p) => p.predicted_niveau_cours_eau_m)
            .filter((v) => v != null)
        )
      : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 text-base text-gray-700">
        {isLoading && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Mise à jour…
          </span>
        )}
        {lastUpdate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Mise à jour : {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          icon={<Droplets className="w-4 h-4 text-blue-500" />}
          label="Niveau Actuel"
          value={currentLevel != null ? `${currentLevel.toFixed(4)} m` : "N/A"}
          bg="bg-blue-50"
        />
        <QuickStat
          icon={<TrendingUp className="w-4 h-4 text-amber-500" />}
          label="Max Prévu (5h)"
          value={maxPredicted != null ? `${maxPredicted.toFixed(4)} m` : "N/A"}
          bg="bg-amber-50"
        />
        <QuickStat
          icon={<Activity className="w-4 h-4 text-green-500" />}
          label="Observations"
          value={observations.length}
          bg="bg-green-50"
        />
        <QuickStat
          icon={<Gauge className="w-4 h-4 text-purple-500" />}
          label="Prédictions"
          value={predictions.length}
          bg="bg-purple-50"
        />
      </div>

      {/* Main chart + alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WaterLevelChart
            observations={observations}
            predictions={predictions}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
          />
        </div>
        <div className="lg:col-span-1">
          <AlertPanel
            currentLevel={currentLevel}
            maxPredicted={maxPredicted}
          />
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <NavCard to="/forecasts" title="Prévisions Horaires" desc="Détail des prédictions T+1h à T+5h" color="text-blue-600 bg-blue-50" />
        <NavCard to="/valves" title="Pilotage des Vannes" desc="Contrôle automatique et manuel" color="text-amber-600 bg-amber-50" />
        <NavCard to="/simulation" title="Simulation de Crues" desc="Tester des scénarios d'inondation" color="text-purple-600 bg-purple-50" />
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
        <span className="text-base font-medium text-gray-700">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function NavCard({ to, title, desc, color }) {
  return (
    <Link
      to={to}
      className="block p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <p className={`text-base font-semibold ${color.split(" ")[0]} mb-1`}>{title}</p>
      <p className="text-base text-gray-700">{desc}</p>
    </Link>
  );
}

