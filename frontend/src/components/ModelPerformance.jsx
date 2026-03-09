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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600 text-base">Chargement des infos du modèle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <p className="text-red-600 text-base">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Modèle IA – Random Forest</h1>
        <p className="text-base text-gray-700 mt-1">
          Performance, features et comparaisons du modèle de prédiction.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: "performance", label: "Performance" },
          { key: "features", label: "Features" },
          { key: "comparisons", label: "Comparaisons" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-base font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Performance Tab */}
      {activeTab === "performance" && performance && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-base text-gray-700 mb-1">Modèle</p>
              <p className="text-xl font-semibold text-gray-900">{performance.model}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-base text-gray-700 mb-1">Horizon</p>
              <p className="text-xl font-semibold text-blue-600">{performance.horizon}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Métriques</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-base text-gray-700">R² Score</p>
                <p className="text-3xl font-bold text-green-600">{performance.metrics.r2_score}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-base text-gray-700">Confiance</p>
                <p className="text-3xl font-bold text-green-600">{performance.metrics.confidence}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Avantages</h3>
            <ul className="space-y-2">
              {performance.model_characteristics.advantages.map((adv, i) => (
                <li key={i} className="text-base text-gray-700 flex gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Contribution des Features</h3>
            <div className="space-y-2 text-base">
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Primaire</span>
                <span className="font-medium text-gray-900">{performance.feature_contribution.most_important}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Secondaire</span>
                <span className="font-medium text-gray-900">{performance.feature_contribution.secondary}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Tertiaire</span>
                <span className="font-medium text-gray-900">{performance.feature_contribution.tertiary}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === "features" && modelInfo?.feature_importance && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Top 5 Features</h3>
            <div className="space-y-3">
              {modelInfo.top_5_features.map((feat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-800 font-medium">{i + 1}. {feat.feature}</span>
                    <span className="text-blue-600 font-semibold">{feat.importance_percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${feat.importance_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-base text-gray-600 px-1">
            Variables qui influencent le plus les prédictions Random Forest sur l'horizon 5h.
          </p>
        </div>
      )}

      {/* Comparisons Tab */}
      {activeTab === "comparisons" && comparisons && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-xl border border-green-200 p-5">
            <p className="text-base font-semibold text-green-800 mb-2">
              Modèle sélectionné : {comparisons.selected_model}
            </p>
            <ul className="space-y-1">
              {comparisons.selection_criteria.map((c, i) => (
                <li key={i} className="text-base text-green-700 flex gap-2">
                  <span>&#8226;</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {comparisons.comparison.map((comp, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border p-4 ${
                  comp.model === "Random Forest" ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900 text-base">{comp.model}</p>
                  <span className="text-base text-gray-600">{comp.status}</span>
                </div>
                <p className="text-base text-gray-700 mb-2">{comp.reason}</p>
                <span className="text-base font-medium text-blue-600">R² {comp.r2_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
