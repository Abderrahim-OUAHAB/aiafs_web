import React from "react";

export default function ForecastDetails({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-sky-300">
          🕐 Prévisions Horaires (+5h)
        </h2>
        <p className="text-slate-400 text-sm">
          Aucune prédiction disponible
        </p>
      </div>
    );
  }

  // Grouper les prédictions par heure (en supposant qu'on a 5 points pour les 5 heures)
  const hourlyForecasts = predictions.slice(0, 5).map((pred, index) => {
    const timestamp = new Date(pred.timestamp);
    const hour = index + 1;
    const level = pred.predicted_niveau_cours_eau_m;

    // Déterminer le statut basé sur les seuils
    let status = "Normal";
    let statusColor = "bg-emerald-500";
    let statusLabel = "✓ Normal";

    if (level >= 3.8) {
      status = "Alerte";
      statusColor = "bg-red-500";
      statusLabel = "🔴 ALERTE";
    } else if (level >= 3.0) {
      status = "Vigilance";
      statusColor = "bg-amber-500";
      statusLabel = "🟠 Vigilance";
    }

    // Trend (augmentation/diminution)
    let trend = "→";
    let trendColor = "text-slate-400";
    if (index > 0) {
      const prevLevel = predictions[index - 1].predicted_niveau_cours_eau_m;
      if (level > prevLevel) {
        trend = "↑";
        trendColor = "text-red-400 font-bold";
      } else if (level < prevLevel) {
        trend = "↓";
        trendColor = "text-emerald-400 font-bold";
      }
    }

    return {
      hour,
      timestamp,
      level,
      status,
      statusColor,
      statusLabel,
      trend,
      trendColor,
    };
  });

  // Calculer les statistiques
  const levels = hourlyForecasts.map((f) => f.level);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  const maxTime = Math.max(...levels);
  const maxTimeIndex = levels.indexOf(maxTime);

  return (
    <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-sky-300">
        🕐 Prévisions Horaires (Random Forest +5h)
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded bg-slate-900/60 border border-slate-700/60">
          <p className="text-slate-400 text-xs mb-1">Min</p>
          <p className="text-sm font-bold text-sky-300">
            {minLevel.toFixed(3)} m
          </p>
        </div>
        <div className="p-2 rounded bg-slate-900/60 border border-slate-700/60">
          <p className="text-slate-400 text-xs mb-1">Moyenne</p>
          <p className="text-sm font-bold text-slate-300">
            {avgLevel.toFixed(3)} m
          </p>
        </div>
        <div className="p-2 rounded bg-slate-900/60 border border-slate-700/60">
          <p className="text-slate-400 text-xs mb-1">Max</p>
          <p className="text-sm font-bold text-amber-300">
            {maxLevel.toFixed(3)} m
          </p>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="space-y-2">
        {hourlyForecasts.map((forecast, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border transition-all ${
              forecast.status === "Alerte"
                ? "bg-red-950/20 border-red-500/40"
                : forecast.status === "Vigilance"
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-slate-900/40 border-slate-700/40"
            } hover:border-opacity-100`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Time and Hour */}
              <div className="min-w-max">
                <p className="text-sm font-bold text-sky-300">
                  T+{forecast.hour}h
                </p>
                <p className="text-xs text-slate-400">
                  {forecast.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Level Display */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <p className="text-lg font-bold text-slate-100">
                    {forecast.level.toFixed(3)} m
                  </p>
                  <p className={`text-sm font-bold ${forecast.trendColor}`}>
                    {forecast.trend}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700/40 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      forecast.status === "Alerte"
                        ? "bg-red-500"
                        : forecast.status === "Vigilance"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    } transition-all`}
                    style={{
                      width: `${Math.max(5, Math.min(100, (forecast.level / 5) * 100))}%`,
                    }}
                  />
                </div>

                {/* Threshold Markers */}
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0m</span>
                  <span>3.0m</span>
                  <span>3.8m</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="min-w-max text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${forecast.statusColor} bg-opacity-20`}
                >
                  {forecast.statusLabel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Information */}
      <div className="mt-4 p-3 rounded-lg bg-blue-950/20 border border-blue-700/30">
        <p className="text-xs text-blue-300 font-semibold mb-1">
          💡 À propos de cette prévision
        </p>
        <ul className="text-xs text-slate-400 space-y-0.5">
          <li>
            • Modèle : <span className="text-sky-300">Random Forest</span>
          </li>
          <li>
            • Horizon : <span className="text-sky-300">5 heures</span>
          </li>
          <li>
            • Intervalle : <span className="text-sky-300">1 heure</span>
          </li>
          <li>
            • Pic attendu : <span className="text-amber-300">T+{maxTimeIndex + 1}h</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
