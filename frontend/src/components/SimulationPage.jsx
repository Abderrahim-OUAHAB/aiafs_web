import React, { useState, useCallback } from "react";
import {
  FlaskConical,
  Play,
  RotateCcw,
  TrendingUp,
  Droplets,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_BASE_URL = "http://localhost:8000";

const SCENARIOS = [
  {
    id: "moderate",
    label: "Crue Modérée",
    desc: "Montée progressive de 0.5m sur 5h",
    params: { initial_level: 2.8, peak_level: 3.3, duration_hours: 5 },
    color: "border-amber-200 bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "severe",
    label: "Crue Sévère",
    desc: "Montée rapide de 1.2m sur 3h",
    params: { initial_level: 2.8, peak_level: 4.0, duration_hours: 3 },
    color: "border-red-200 bg-red-50",
    iconColor: "text-red-600",
  },
  {
    id: "flash",
    label: "Crue Éclair",
    desc: "Montée brutale dépassant le seuil d'alerte en 1h",
    params: { initial_level: 3.0, peak_level: 4.5, duration_hours: 1 },
    color: "border-red-300 bg-red-100",
    iconColor: "text-red-700",
  },
  {
    id: "normal",
    label: "Situation Normale",
    desc: "Niveau stable autour de 2.5m",
    params: { initial_level: 2.5, peak_level: 2.6, duration_hours: 5 },
    color: "border-green-200 bg-green-50",
    iconColor: "text-green-600",
  },
];

function generateSimulationData(params) {
  const { initial_level, peak_level, duration_hours } = params;
  const points = [];
  const steps = duration_hours * 10;
  const midPoint = steps / 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / 10;
    let level;
    if (i <= midPoint) {
      const progress = i / midPoint;
      level = initial_level + (peak_level - initial_level) * Math.pow(progress, 1.5);
    } else {
      const decline = (i - midPoint) / (steps - midPoint);
      level = peak_level - (peak_level - initial_level) * 0.4 * decline;
    }
    level += (Math.random() - 0.5) * 0.02;

    let valveOpening = 0;
    if (level >= 3.8) valveOpening = 0.85;
    else if (level >= 3.0) valveOpening = 0.45;
    else if (level >= 2.5) valveOpening = 0.15;

    points.push({
      time: `T+${t.toFixed(1)}h`,
      niveau: parseFloat(level.toFixed(4)),
      ouverture_vanne: parseFloat((valveOpening * 100).toFixed(1)),
    });
  }
  return points;
}

export default function SimulationPage() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simData, setSimData] = useState([]);
  const [running, setRunning] = useState(false);
  const [customParams, setCustomParams] = useState({
    initial_level: 2.8,
    peak_level: 3.5,
    duration_hours: 5,
  });
  const [mode, setMode] = useState("presets");

  const runSimulation = useCallback(
    (params) => {
      setRunning(true);
      setTimeout(() => {
        const data = generateSimulationData(params);
        setSimData(data);
        setRunning(false);
      }, 800);
    },
    []
  );

  const handlePresetRun = (scenario) => {
    setSelectedScenario(scenario.id);
    runSimulation(scenario.params);
  };

  const handleCustomRun = () => {
    setSelectedScenario("custom");
    runSimulation(customParams);
  };

  const maxLevel = simData.length > 0 ? Math.max(...simData.map((d) => d.niveau)) : 0;
  const maxValve = simData.length > 0 ? Math.max(...simData.map((d) => d.ouverture_vanne)) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Simulation de Crues</h1>
        <p className="text-base text-gray-700 mt-1">
          Testez différents scénarios d'inondation et analysez la réponse du système.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("presets")}
          className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
            mode === "presets"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Scénarios Prédéfinis
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
            mode === "custom"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Scénario Personnalisé
        </button>
      </div>

      {mode === "presets" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => handlePresetRun(s)}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                selectedScenario === s.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : s.color
              }`}
            >
              <AlertTriangle className={`w-5 h-5 mb-2 ${s.iconColor}`} />
              <p className="font-semibold text-gray-900 text-base">{s.label}</p>
              <p className="text-base text-gray-700 mt-1">{s.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Paramètres Personnalisés</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Niveau initial (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={customParams.initial_level}
                onChange={(e) =>
                  setCustomParams((p) => ({ ...p, initial_level: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Niveau pic (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="6"
                value={customParams.peak_level}
                onChange={(e) =>
                  setCustomParams((p) => ({ ...p, peak_level: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Durée (heures)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="24"
                value={customParams.duration_hours}
                onChange={(e) =>
                  setCustomParams((p) => ({
                    ...p,
                    duration_hours: parseInt(e.target.value, 10) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleCustomRun}
            disabled={running}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base font-medium disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Lancer la Simulation
          </button>
        </div>
      )}

      {/* Results */}
      {running && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Simulation en cours…</p>
        </div>
      )}

      {!running && simData.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-base font-medium text-gray-700">Niveau Max</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{maxLevel.toFixed(2)} m</p>
              <p className="text-base text-gray-600 mt-1">
                {maxLevel >= 3.8 ? "Seuil ALERTE dépassé" : maxLevel >= 3.0 ? "Seuil VIGILANCE dépassé" : "Sous les seuils"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="w-4 h-4 text-amber-500" />
                <span className="text-base font-medium text-gray-700">Ouverture Max Vanne</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{maxValve.toFixed(0)}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-base font-medium text-gray-700">Points simulés</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{simData.length}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Résultat de la Simulation</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 10 }} interval={Math.floor(simData.length / 10)} />
                  <YAxis yAxisId="level" stroke="#9ca3af" tick={{ fontSize: 10 }} domain={["auto", "auto"]} label={{ value: "Niveau (m)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis yAxisId="valve" orientation="right" stroke="#9ca3af" tick={{ fontSize: 10 }} domain={[0, 100]} label={{ value: "Vanne (%)", angle: 90, position: "insideRight", fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine yAxisId="level" y={3.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Vigilance", position: "right", fill: "#f59e0b", fontSize: 10 }} />
                  <ReferenceLine yAxisId="level" y={3.8} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "Alerte", position: "right", fill: "#dc2626", fontSize: 10 }} />
                  <Line yAxisId="level" type="monotone" dataKey="niveau" stroke="#2563eb" strokeWidth={2} dot={false} name="Niveau d'eau" />
                  <Line yAxisId="valve" type="stepAfter" dataKey="ouverture_vanne" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Ouverture vanne" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
