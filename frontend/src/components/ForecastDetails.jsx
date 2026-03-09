import React from "react";

export default function ForecastDetails({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">
          Prévisions Horaires (+5h)
        </h2>
        <p className="text-gray-600 text-base">Aucune prédiction disponible</p>
      </div>
    );
  }

  const hourlyForecasts = predictions.slice(0, 5).map((pred, index) => {
    const timestamp = new Date(pred.timestamp);
    const hour = index + 1;
    const level = pred.predicted_niveau_cours_eau_m;

    let status = "Normal";
    let badgeCls = "bg-green-100 text-green-700";

    if (level >= 3.8) {
      status = "Alerte";
      badgeCls = "bg-red-100 text-red-700";
    } else if (level >= 3.0) {
      status = "Vigilance";
      badgeCls = "bg-amber-100 text-amber-700";
    }

    let trend = "→";
    let trendColor = "text-gray-500";
    if (index > 0) {
      const prevLevel = predictions[index - 1].predicted_niveau_cours_eau_m;
      if (level > prevLevel) {
        trend = "↑";
        trendColor = "text-red-500 font-bold";
      } else if (level < prevLevel) {
        trend = "↓";
        trendColor = "text-green-500 font-bold";
      }
    }

    return { hour, timestamp, level, status, badgeCls, trend, trendColor };
  });

  const levels = hourlyForecasts.map((f) => f.level);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  const maxTimeIndex = levels.indexOf(Math.max(...levels));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prévisions Horaires</h1>
        <p className="text-base text-gray-700 mt-1">
          Prédictions Random Forest pour les 5 prochaines heures.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-base text-gray-700 mb-1">Minimum</p>
          <p className="text-3xl font-bold text-blue-600">{minLevel.toFixed(4)} m</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-base text-gray-700 mb-1">Moyenne</p>
          <p className="text-3xl font-bold text-gray-900">{avgLevel.toFixed(4)} m</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-base text-gray-700 mb-1">Maximum</p>
          <p className="text-3xl font-bold text-amber-600">{maxLevel.toFixed(4)} m</p>
        </div>
      </div>

      {/* Hourly Cards */}
      <div className="space-y-3">
        {hourlyForecasts.map((forecast, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${
              forecast.status === "Alerte"
                ? "border-red-200"
                : forecast.status === "Vigilance"
                  ? "border-amber-200"
                  : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="min-w-[60px]">
                <p className="text-base font-bold text-blue-600">T+{forecast.hour}h</p>
                <p className="text-base text-gray-600">
                  {forecast.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-xl font-bold text-gray-900">
                    {forecast.level.toFixed(4)} m
                  </p>
                  <p className={`text-sm ${forecast.trendColor}`}>{forecast.trend}</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      forecast.status === "Alerte"
                        ? "bg-red-500"
                        : forecast.status === "Vigilance"
                          ? "bg-amber-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.max(5, Math.min(100, (forecast.level / 5) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${forecast.badgeCls}`}>
                {forecast.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Info */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <p className="text-base text-blue-700 font-semibold mb-2">
          À propos de cette prévision
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-base">
          <div>
            <span className="text-gray-700">Modèle</span>
            <p className="font-semibold text-gray-900">Random Forest</p>
          </div>
          <div>
            <span className="text-gray-700">Horizon</span>
            <p className="font-semibold text-gray-900">5 heures</p>
          </div>
          <div>
            <span className="text-gray-700">Intervalle</span>
            <p className="font-semibold text-gray-900">1 heure</p>
          </div>
          <div>
            <span className="text-gray-700">Pic attendu</span>
            <p className="font-semibold text-amber-600">T+{maxTimeIndex + 1}h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
