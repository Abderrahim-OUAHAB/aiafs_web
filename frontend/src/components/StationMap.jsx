import React, { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function StationMap({
  currentLevel,
  maxPredicted,
  lastUpdate,
  predictions,
}) {
  const [stationStatus, setStationStatus] = useState("normal");
  const [trendData, setTrendData] = useState([]);
  const [animateGauge, setAnimateGauge] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Déterminer le statut global
  useEffect(() => {
    const worstLevel = Math.max(
      currentLevel ?? -Infinity,
      maxPredicted ?? -Infinity
    );

    if (worstLevel >= 3.8) {
      setStationStatus("alerte");
    } else if (worstLevel >= 3.0) {
      setStationStatus("vigilance");
    } else {
      setStationStatus("normal");
    }

    setAnimateGauge(true);
  }, [currentLevel, maxPredicted]);

  // Préparer données pour mini graphique de tendance
  useEffect(() => {
    if (predictions && predictions.length > 0) {
      const data = predictions.map((p, idx) => ({
        time: `T+${idx + 1}h`,
        level: parseFloat(p.predicted_niveau_cours_eau_m.toFixed(4)),
      }));
      setTrendData(data);
    }
  }, [predictions]);

  // Initialiser la carte Leaflet
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Coordonnées de la station La Selle, La Liane – Boulogne-sur-Mer
    const mapCenter = [50.6753, 1.6394];

    // Créer la carte
    const map = L.map(mapRef.current).setView(mapCenter, 12);

    // Ajouter le tile layer OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Styles personnalisés pour les marqueurs
    const stationIcon = (status) => {
      const colors = {
        normal: "#10b981",
        vigilance: "#f59e0b",
        alerte: "#ef4444",
      };
      return L.divIcon({
        html: `
          <div style="
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: ${colors[status]};
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 16px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${currentLevel != null ? currentLevel.toFixed(4) : "N/A"}
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25],
      });
    };

    // Station principale – La Selle (La Liane)
    const mainMarker = L.marker(mapCenter, {
      icon: stationIcon(stationStatus),
    })
      .addTo(map)
      .bindPopup(
        `<div style="text-align: center; padding: 10px;">
          <strong>Station La Selle</strong><br/>
          Cours d'eau : La Liane<br/>
          Niveau: ${currentLevel != null ? currentLevel.toFixed(4) : "N/A"} m<br/>
          Status: ${stationStatus.toUpperCase()}<br/>
          <small>Station Principale</small>
        </div>`
      );

    // Station amont – Pont-de-Briques
    const amontMarker = L.marker([50.6930, 1.6220], {
      icon: stationIcon("normal"),
    })
      .addTo(map)
      .bindPopup(
        `<div style="text-align: center; padding: 10px;">
          <strong>Station Amont</strong><br/>
          Pont-de-Briques<br/>
          <small>Amont – La Liane</small>
        </div>`
      );

    // Station aval – Boulogne-sur-Mer (embouchure)
    const avalMarker = L.marker([50.7260, 1.6130], {
      icon: stationIcon("normal"),
    })
      .addTo(map)
      .bindPopup(
        `<div style="text-align: center; padding: 10px;">
          <strong>Station Aval</strong><br/>
          Boulogne-sur-Mer<br/>
          <small>Aval – Embouchure La Liane</small>
        </div>`
      );

    // Ajouter une couche pour la zone de risque si vigilance/alerte
    if (stationStatus === "alerte" || stationStatus === "vigilance") {
      const riskColor = stationStatus === "alerte" ? "#ef4444" : "#f59e0b";
      const circle = L.circle(mapCenter, {
        color: riskColor,
        fillColor: riskColor,
        fillOpacity: 0.1,
        weight: 2,
        radius: 3000,
      }).addTo(map);

      circle.bindPopup("Zone de surveillance");
    }

    leafletMapRef.current = map;

    // Cleanup
    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [stationStatus, currentLevel]);

  // Couleurs basées sur le statut
  const getStatusColor = () => {
    switch (stationStatus) {
      case "alerte":
        return {
          bg: "bg-red-50",
          border: "border-red-400",
          dot: "bg-red-500",
          text: "text-red-600",
        };
      case "vigilance":
        return {
          bg: "bg-amber-50",
          border: "border-amber-400",
          dot: "bg-amber-500",
          text: "text-amber-600",
        };
      default:
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-400",
          dot: "bg-emerald-500",
          text: "text-emerald-600",
        };
    }
  };

  const getStatusLabel = () => {
    switch (stationStatus) {
      case "alerte":
        return { text: "🔴 ALERTE CRUE", color: "text-red-600", icon: "🚨" };
      case "vigilance":
        return { text: "🟠 VIGILANCE", color: "text-amber-600", icon: "⚠️" };
      default:
        return { text: "✅ SITUATION NORMALE", color: "text-emerald-600", icon: "✓" };
    }
  };

  const getGaugeWidth = () => {
    if (currentLevel === null) return 0;
    return Math.min(100, (currentLevel / 4.5) * 100);
  };

  const colors = getStatusColor();
  const status = getStatusLabel();
  const gaugeWidth = getGaugeWidth();

  return (
    <div className="space-y-6">
      {/* CARTE HYDROLOGIQUE PROFESSIONNELLE */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-blue-600 mb-4">🗺️ Carte Hydrologique – Station La Selle (La Liane)</h3>
        
        {/* Carte Leaflet */}
        <div
          ref={mapRef}
          className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm"
          style={{ height: "500px", minHeight: "500px" }}
        />

        {/* Stats détaillées sous la carte */}
        <div className="grid grid-cols-4 gap-3 text-base mt-6">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-gray-700 mb-1">📊 Niveau Actuel</p>
            <p className="text-xl font-bold text-blue-600">{currentLevel?.toFixed(4)}m</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-gray-700 mb-1">📈 Pic 5h</p>
            <p className="text-xl font-bold text-amber-600">{maxPredicted?.toFixed(4)}m</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-gray-700 mb-1">🔺 Min 5h</p>
            <p className="text-xl font-bold text-blue-600">
              {trendData.length > 0 ? Math.min(...trendData.map((d) => d.level)).toFixed(4) : "N/A"}m
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-gray-700 mb-1">📊 Moy 5h</p>
            <p className="text-xl font-bold text-gray-700">
              {trendData.length > 0
                ? (trendData.reduce((sum, d) => sum + d.level, 0) / trendData.length).toFixed(4)
                : "N/A"}m
            </p>
          </div>
        </div>
      </div>

      {/* TENDANCE 5H AVEC GRAPHIQUE */}
      {trendData.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">📊 Tendance 5 Heures</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[2.8, 4]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#1f2937" }}
                />
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ fill: "#fbbf24", r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
                {/* Référence seuils */}
                <Line
                  type="linear"
                  dataKey={() => 3.0}
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  dot={false}
                  name="Vigilance"
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey={() => 3.8}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  dot={false}
                  name="Alerte"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-gray-600">Prédictions RF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-[2px] bg-orange-500"></div>
              <span className="text-gray-600">Seuil Vigilance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-[2px] bg-red-500"></div>
              <span className="text-gray-600">Seuil Alerte</span>
            </div>
          </div>
        </div>
      )}

      {/* INFOS ET RECOMMANDATIONS */}
      <div className="grid grid-cols-2 gap-6">
        {/* Infos techniques */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">🔧 Informations Techniques</h3>
          <div className="space-y-3 text-base">
            <div className="flex justify-between p-2 rounded bg-gray-50">
              <span className="text-gray-700">Station</span>
              <span className="font-semibold text-blue-600">La Selle</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-gray-50">
              <span className="text-gray-700">Cours d'eau</span>
              <span className="font-semibold text-blue-600">La Liane</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-gray-50">
              <span className="text-gray-700">Région</span>
              <span className="font-semibold text-blue-600">Hauts-de-France (Boulogne-sur-Mer)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-gray-50">
              <span className="text-gray-700">Modèle</span>
              <span className="font-semibold text-blue-600">Random Forest</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-gray-50">
              <span className="text-gray-700">Horizon</span>
              <span className="font-semibold text-blue-600">5 heures</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-gray-50">
              <span className="text-gray-700">Mise à jour</span>
              <span className="font-semibold text-emerald-600">
                {lastUpdate ? lastUpdate.toLocaleTimeString("fr-FR") : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className={`rounded-xl border-2 p-6 shadow-lg backdrop-blur-sm ${colors.border} ${colors.bg}`}>
          <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
            {stationStatus === "alerte" ? "🚨 Actions Recommandées" : "💡 Informations"}
          </h3>
          <div className="space-y-2 text-base text-gray-700">
            {stationStatus === "alerte" && (
              <>
                <p>✓ Activez les plans de prévention</p>
                <p>✓ Alertez les autorités locales</p>
                <p>✓ Évacuez si nécessaire</p>
                <p>✓ Consultez les services d'urgence</p>
              </>
            )}
            {stationStatus === "vigilance" && (
              <>
                <p>✓ Restez informé des mises à jour</p>
                <p>✓ Préparez les mesures de prévention</p>
                <p>✓ Surveillez les zones à risque</p>
              </>
            )}
            {stationStatus === "normal" && (
              <>
                <p>✓ Situation hydrologique normale</p>
                <p>✓ Continuez la surveillance régulière</p>
                <p>✓ Consultez les prévisions à 5h</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
