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
    <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm h-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Statut Hydrologique
      </h2>

      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-base text-gray-700 mb-1">Niveau actuel</p>
          <p className="text-3xl font-bold text-gray-900">
            {currentLevel != null ? `${currentLevel.toFixed(4)} m` : "N/A"}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-base text-gray-700 mb-1">
            Max. prévu (5h)
          </p>
          <p className="text-3xl font-bold text-amber-600">
            {maxPredicted != null ? `${maxPredicted.toFixed(4)} m` : "N/A"}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-base text-gray-700 mb-1">Statut global</p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${overallStatus.color}`}
            ></span>
            <span className="font-semibold text-base text-gray-900">
              {overallStatus.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-base text-gray-700">
        <p>
          Seuils :{" "}
          <span className="text-amber-600 font-semibold">3.0 m</span>{" "}
          (Vigilance) &middot;{" "}
          <span className="text-red-600 font-semibold">3.8 m</span>{" "}
          (Alerte).
        </p>
      </div>
    </div>
  );
}

