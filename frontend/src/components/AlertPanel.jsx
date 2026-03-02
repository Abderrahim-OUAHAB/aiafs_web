import React from "react";

function getStatus(level) {
  if (level == null || isNaN(level)) {
    return { label: "Données indisponibles", color: "bg-gray-500" };
  }

  if (level < 3.0) {
    return { label: "Situation normale", color: "bg-aiafs-safe" };
  }

  if (level < 3.8) {
    return { label: "Vigilance (Orange)", color: "bg-aiafs-warning" };
  }

  return { label: "Alerte (Rouge)", color: "bg-aiafs-danger" };
}

export default function AlertPanel({ currentLevel, maxPredicted }) {
  const currentStatus = getStatus(currentLevel);
  const futureStatus = getStatus(maxPredicted);
  const worstStatusLevel = Math.max(
    currentLevel ?? -Infinity,
    maxPredicted ?? -Infinity
  );

  const overallStatus = getStatus(worstStatusLevel);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-sky-300">
          Statut Hydrologique
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <p className="text-slate-400 mb-1">Niveau actuel</p>
            <p className="text-2xl font-bold text-sky-300">
              {currentLevel != null ? `${currentLevel.toFixed(2)} m` : "N/A"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <p className="text-slate-400 mb-1">
              Max. prévu (5 prochaines heures)
            </p>
            <p className="text-2xl font-bold text-amber-300">
              {maxPredicted != null ? `${maxPredicted.toFixed(2)} m` : "N/A"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between">
            <p className="text-slate-400 mb-1">Statut global</p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-3 w-3 rounded-full ${overallStatus.color}`}
              ></span>
              <span className="font-semibold text-sm">
                {overallStatus.label}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          <p>
            Seuils :{" "}
            <span className="text-aiafs-warning font-semibold">3.0 m</span>{" "}
            (Vigilance) &middot;{" "}
            <span className="text-aiafs-danger font-semibold">3.8 m</span>{" "}
            (Alerte).
          </p>
        </div>
      </div>
    </div>
  );
}

