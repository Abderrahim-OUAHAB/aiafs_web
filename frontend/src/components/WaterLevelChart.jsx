import React, { useMemo } from "react";
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

/* ─── Boutons de plage temporelle ─── */

const TIME_RANGES = [
  { key: "1h", label: "1 Heure" },
  { key: "6h", label: "6 Heures" },
  { key: "1d", label: "1 Jour" },
  { key: "1w", label: "1 Semaine" },
  { key: "all", label: "Tout" },
];

/* ─── Formatage des axes selon la plage ─── */

function formatAxisLabel(isoString, range) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (range === "1h" || range === "6h") {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (range === "1d") {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  // 1w or all: show date + hour
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
    + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatLevelTick(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toFixed(3);
}

/* ─── Tooltip ─── */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const date = new Date(label);
  const dateStr = date.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const real = payload.find((p) => p.dataKey === "historicalLevel");
  const pred = payload.find((p) => p.dataKey === "predictedLevel");
  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-100 shadow-xl">
      <p className="font-semibold text-sky-300 mb-1">{dateStr}</p>
      {real && real.value != null && (
        <p className="text-sky-200">
          Niveau observé : <span className="font-semibold">{real.value.toFixed(3)} m</span>
        </p>
      )}
      {pred && pred.value != null && (
        <p className="text-red-300">
          Niveau prédit : <span className="font-semibold">{pred.value.toFixed(3)} m</span>
        </p>
      )}
    </div>
  );
};

/* ─── Durées en ms pour filtrage client-side ─── */

const RANGE_MS = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

/* ─── Composant principal ─── */

export default function WaterLevelChart({ observations, predictions, timeRange, setTimeRange }) {
  const { chartData, yDomain, tickInterval } = useMemo(() => {
    let filteredObs = observations || [];

    // Filtrage client-side : on garde les observations dans la fenêtre choisie
    if (timeRange !== "all" && RANGE_MS[timeRange] && filteredObs.length > 0) {
      const maxTs = filteredObs.reduce((mx, o) => {
        const t = new Date(o.date_mesure).getTime();
        return t > mx ? t : mx;
      }, 0);
      const cutoff = maxTs - RANGE_MS[timeRange];
      filteredObs = filteredObs.filter((o) => new Date(o.date_mesure).getTime() >= cutoff);
    }

    const historicalData = filteredObs.map((obs) => ({
      timestamp: obs.date_mesure,
      historicalLevel: obs.niveau_cours_eau_m,
      predictedLevel: null,
    }));

    const predictionData = (predictions || []).map((pred) => ({
      timestamp: pred.timestamp,
      historicalLevel: null,
      predictedLevel: pred.predicted_niveau_cours_eau_m,
    }));

    const combined = [...historicalData, ...predictionData];

    const allValues = combined
      .flatMap((d) => [d.historicalLevel, d.predictedLevel])
      .filter((v) => typeof v === "number" && !Number.isNaN(v));

    const minValue = allValues.length ? Math.min(...allValues) : 0;
    const maxValue = allValues.length ? Math.max(...allValues) : 1;
    const roundedMin = Math.floor(minValue * 1000) / 1000;
    const roundedMax = Math.ceil(maxValue * 1000) / 1000;
    const margin = (roundedMax - roundedMin) * 0.15 || 0.002;

    // Tick interval adapté à la plage
    let interval = 0;
    const len = combined.length;
    if (timeRange === "1h") interval = Math.max(1, Math.floor(len / 8));
    else if (timeRange === "6h") interval = Math.max(1, Math.floor(len / 10));
    else if (timeRange === "1d") interval = Math.max(1, Math.floor(len / 12));
    else if (timeRange === "1w") interval = Math.max(1, Math.floor(len / 14));
    else interval = Math.max(1, Math.floor(len / 15));

    return {
      chartData: combined,
      yDomain: [roundedMin - margin, roundedMax + margin],
      tickInterval: interval,
    };
  }, [observations, predictions, timeRange]);

  return (
    <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-4 shadow-lg">
      {/* En-tête + sélecteur de plage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-sky-300">
          Niveau de la Liane (Historique & Prévisions)
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setTimeRange(r.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                timeRange === r.key
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/50"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
          Aucune donnée disponible pour cette période.
        </div>
      ) : (
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) => formatAxisLabel(v, timeRange)}
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                interval={tickInterval}
                angle={timeRange === "1w" || timeRange === "all" ? -30 : 0}
                textAnchor={timeRange === "1w" || timeRange === "all" ? "end" : "middle"}
                height={timeRange === "1w" || timeRange === "all" ? 55 : 30}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                domain={yDomain}
                tickFormatter={formatLevelTick}
                allowDecimals
                width={60}
                label={{
                  value: "Niveau (m)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#9ca3af",
                  fontSize: 11,
                  offset: 5,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) =>
                  value === "historicalLevel" ? "Niveau observé" : "Niveau prédit"
                }
              />

              <Line
                type="monotone"
                dataKey="historicalLevel"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                name="Niveau observé"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="predictedLevel"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                strokeDasharray="4 4"
                name="Niveau prédit"
                connectNulls={false}
              />

              <ReferenceLine
                y={3.0}
                stroke="#f97316"
                strokeDasharray="3 3"
                label={{ value: "3.0 m (Vigilance)", position: "right", fill: "#f97316", fontSize: 10 }}
              />
              <ReferenceLine
                y={3.8}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: "3.8 m (Alerte)", position: "right", fill: "#ef4444", fontSize: 10 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

