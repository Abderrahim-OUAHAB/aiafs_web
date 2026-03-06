import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000";

export default function ModelPerformance() {
  const [modelInfo, setModelInfo] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [comparisons, setComparisons] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("performance");

  useEffect(() => {
    const loadModelData = async () => {
      setLoading(true);
      setError("");
      try {
        const [modelRes, perfRes, compRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/model/info`),
          fetch(`${API_BASE_URL}/api/model/performance`),
          fetch(`${API_BASE_URL}/api/model/comparisons`),
        ]);

        if (!modelRes.ok || !perfRes.ok || !compRes.ok) {
          throw new Error("Erreur lors du chargement des données du modèle");
        }

        const modelData = await modelRes.json();
        const perfData = await perfRes.json();
        const compData = await compRes.json();

        setModelInfo(modelData);
        setPerformance(perfData);
        setComparisons(compData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    loadModelData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-4 shadow-lg">
        <p className="text-slate-400 text-sm">Chargement des infos du modèle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-950/40 border border-red-500/60 p-4 shadow-lg">
        <p className="text-red-200 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-sky-300">
        📊 Modèle AI - Random Forest
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("performance")}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "performance"
              ? "text-sky-300 border-b-2 border-sky-300"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab("features")}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "features"
              ? "text-sky-300 border-b-2 border-sky-300"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Features Importance
        </button>
        <button
          onClick={() => setActiveTab("comparisons")}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "comparisons"
              ? "text-sky-300 border-b-2 border-sky-300"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Comparaisons
        </button>
      </div>

      {/* Performance Tab */}
      {activeTab === "performance" && performance && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-1">Modèle</p>
            <p className="text-sm font-semibold text-sky-300">
              {performance.model}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-1">Horizon de prédiction</p>
            <p className="text-sm font-semibold text-amber-300">
              {performance.horizon}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-slate-400 text-xs font-semibold">
              Métriques de performance
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-slate-900/40 border border-slate-700/40">
                <p className="text-slate-500 text-xs">R² Score</p>
                <p className="text-lg font-bold text-emerald-400">
                  {performance.metrics.r2_score}
                </p>
              </div>
              <div className="p-2 rounded bg-slate-900/40 border border-slate-700/40">
                <p className="text-slate-500 text-xs">Confiance</p>
                <p className="text-lg font-bold text-emerald-400">
                  {performance.metrics.confidence}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-slate-400 text-xs font-semibold">
              Avantages du Random Forest
            </p>
            <ul className="space-y-1">
              {performance.model_characteristics.advantages.map((adv, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2 font-semibold">
              Contribution des Features
            </p>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-amber-400 font-semibold">
                  Primaire :
                </span>{" "}
                <span className="text-slate-300">
                  {
                    performance.feature_contribution.most_important
                  }
                </span>
              </div>
              <div>
                <span className="text-orange-400 font-semibold">
                  Secondaire :
                </span>{" "}
                <span className="text-slate-300">
                  {performance.feature_contribution.secondary}
                </span>
              </div>
              <div>
                <span className="text-red-400 font-semibold">Tertiaire :</span>{" "}
                <span className="text-slate-300">
                  {performance.feature_contribution.tertiary}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Importance Tab */}
      {activeTab === "features" && modelInfo?.feature_importance && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-700/30">
            <p className="text-blue-300 text-xs font-semibold mb-2">
              🔥 Top 5 Features les Plus Importantes
            </p>
            <div className="space-y-2">
              {modelInfo.top_5_features.map((feat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">
                      {i + 1}. {feat.feature}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {feat.importance_percent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full"
                      style={{ width: `${feat.importance_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-400 text-xs">
            Ces features représentent les variables qui influencent le plus les
            prédictions du modèle Random Forest pour l'horizon 5 heures.
          </p>
        </div>
      )}

      {/* Comparisons Tab */}
      {activeTab === "comparisons" && comparisons && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/30">
            <p className="text-emerald-300 text-xs font-semibold mb-3">
              ✓ Modèle Sélectionné : {comparisons.selected_model}
            </p>
            <div className="space-y-2">
              {comparisons.selection_criteria.map((criteria, i) => (
                <div key={i} className="text-xs text-emerald-200 flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>{criteria}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-slate-400 text-xs font-semibold">
              Comparaison avec d'autres modèles
            </p>
            {comparisons.comparison.map((comp, i) => (
              <div
                key={i}
                className={`p-2 rounded border text-xs ${
                  comp.model === "Random Forest"
                    ? "bg-emerald-950/30 border-emerald-700/30"
                    : "bg-slate-900/40 border-slate-700/40"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-semibold text-slate-200">
                      {comp.model}
                    </p>
                    <p className="text-slate-400">{comp.reason}</p>
                  </div>
                  <span className="text-slate-400">{comp.status}</span>
                </div>
                <div className="flex gap-3 text-slate-300">
                  <span>R² {comp.r2_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
