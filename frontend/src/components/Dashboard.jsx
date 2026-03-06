import React from "react";
import WaterLevelChart from "./WaterLevelChart.jsx";
import AlertPanel from "./AlertPanel.jsx";
import ForecastDetails from "./ForecastDetails.jsx";
import ValvePiloting from "./ValvePiloting.jsx";

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AIAFS Dashboard
            </h1>
            <p className="text-sm text-slate-400">
              Artificial Intelligence Anti-Flood System – La Liane
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {isLoading && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Mise à jour des données…</span>
              </span>
            )}
            {lastUpdate && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>
                  Dernière mise à jour :{" "}
                  {lastUpdate.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-950/40 text-red-200 text-sm px-4 py-3 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Main chart and alert panel */}
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

          {/* Forecast Details */}
          <div>
            <ForecastDetails predictions={predictions} />
          </div>

          {/* Pilotage des Vannes */}
          <div>
            <ValvePiloting />
          </div>
        </div>
      </main>
    </div>
  );
}

