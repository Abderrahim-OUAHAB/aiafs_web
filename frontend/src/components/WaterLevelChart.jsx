import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

function formatTimeLabel(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const date = new Date(label);
  const dateStr = date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const real = payload.find((p) => p.dataKey === "historicalLevel");
  const pred = payload.find((p) => p.dataKey === "predictedLevel");

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-100 shadow-xl">
      <p className="font-semibold text-sky-300 mb-1">{dateStr}</p>
      {real && real.value != null && (
        <p className="text-sky-200">
          Niveau observé :{" "}
          <span className="font-semibold">{real.value.toFixed(2)} m</span>
        </p>
      )}
      {pred && pred.value != null && (
        <p className="text-red-300">
          Niveau prédit :{" "}
          <span className="font-semibold">{pred.value.toFixed(2)} m</span>
        </p>
      )}
    </div>
  );
};

export default function WaterLevelChart({ observations, predictions }) {
  const historicalData = (observations || []).map((obs) => ({
    timestamp: obs.date_mesure,
    historicalLevel: obs.niveau_cours_eau_m,
    predictedLevel: null,
  }));

  const predictionData = (predictions || []).map((pred) => ({
    timestamp: pred.timestamp,
    historicalLevel: null,
    predictedLevel: pred.predicted_niveau_cours_eau_m,
  }));

  // On ne garde que les derniers points d'historique pour que la prédiction reste lisible
  const MAX_HISTORY_POINTS = 80;
  const visibleHistorical =
    historicalData.length > MAX_HISTORY_POINTS
      ? historicalData.slice(-MAX_HISTORY_POINTS)
      : historicalData;

  const chartData = [...visibleHistorical, ...predictionData];

  // Mise à l'échelle dynamique pour mettre en valeur la prédiction
  const allValues = chartData
    .flatMap((d) => [d.historicalLevel, d.predictedLevel])
    .filter((v) => typeof v === "number" && !Number.isNaN(v));

  const minValue = allValues.length ? Math.min(...allValues) : 0;
  const maxValue = allValues.length ? Math.max(...allValues) : 1;

  // On ajoute une petite marge autour des valeurs min / max pour mieux voir les variations
  const margin = (maxValue - minValue) * 0.15 || 0.02;
  const yDomain = [minValue - margin, maxValue + margin];

  return (
    <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3 text-sky-300">
        Niveau de la Liane (Historique & Prévisions)
      </h2>

      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimeLabel}
              stroke="#9ca3af"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fontSize: 10 }}
              domain={yDomain}
              label={{
                value: "Niveau (m)",
                angle: -90,
                position: "insideLeft",
                fill: "#9ca3af",
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) =>
                value === "historicalLevel"
                  ? "Niveau observé"
                  : "Niveau prédit"
              }
            />

            <Line
              type="monotone"
              dataKey="predictedLevel"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 3 }}
              strokeDasharray="5 5"
              name="Niveau prédit"
            />

            <Line
              type="monotone"
              dataKey="historicalLevel"
              stroke="#38bdf8"
              strokeWidth={1.5}
              dot={false}
              name="Niveau observé"
            />

            <ReferenceLine
              y={3.0}
              stroke="#f97316"
              strokeDasharray="3 3"
              label={{
                value: "3.0 m (Vigilance)",
                position: "right",
                fill: "#f97316",
                fontSize: 10,
              }}
            />
            <ReferenceLine
              y={3.8}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: "3.8 m (Alerte)",
                position: "right",
                fill: "#ef4444",
                fontSize: 10,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

