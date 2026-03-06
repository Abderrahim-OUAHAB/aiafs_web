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
        level: parseFloat(p.predicted_niveau_cours_eau_m.toFixed(3)),
      }));
      setTrendData(data);
    }
  }, [predictions]);

  // Initialiser la carte Leaflet
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Coordonnées de La Liane, Nouvelle-Aquitaine (Arcachon)
    const mapCenter = [44.6634, -1.1754];

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
            ${currentLevel != null ? currentLevel.toFixed(2) : "N/A"}
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25],
      });
    };

    // Station principale - La Liane
    const mainMarker = L.marker(mapCenter, {
      icon: stationIcon(stationStatus),
    })
      .addTo(map)
      .bindPopup(
        `<div style="text-align: center; padding: 10px;">
          <strong>Station La Liane</strong><br/>
          Niveau: ${currentLevel != null ? currentLevel.toFixed(2) : "N/A"} m<br/>
          Status: ${stationStatus.toUpperCase()}<br/>
          <small>Station Principale</small>
        </div>`
      );

    // Ajouter une deuxième station (amont)
    const amontMarker = L.marker([44.7234, -1.1854], {
      icon: stationIcon("normal"),
    })
      .addTo(map)
      .bindPopup(
        `<div style="text-align: center; padding: 10px;">
          <strong>Station Amont</strong><br/>
          Niveau: 2.8 m<br/>
          Status: NORMAL<br/>
          <small>Amont</small>
        </div>`
      );

    // Ajouter une troisième station (aval)
    const avalMarker = L.marker([44.6034, -1.1654], {
      icon: stationIcon("normal"),
    })
      .addTo(map)
      .bindPopup(
        `<div style="text-align: center; padding: 10px;">
          <strong>Station Aval</strong><br/>
          Niveau: 3.1 m<br/>
          Status: NORMAL<br/>
          <small>Aval</small>
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
          bg: "bg-red-950/30",
          border: "border-red-600",
          dot: "bg-red-500",
          text: "text-red-400",
        };
      case "vigilance":
        return {
          bg: "bg-amber-950/30",
          border: "border-amber-600",
          dot: "bg-amber-500",
          text: "text-amber-400",
        };
      default:
        return {
          bg: "bg-emerald-950/30",
          border: "border-emerald-600",
          dot: "bg-emerald-500",
          text: "text-emerald-400",
        };
    }
  };

  const getStatusLabel = () => {
    switch (stationStatus) {
      case "alerte":
        return { text: "🔴 ALERTE CRUE", color: "text-red-400", icon: "🚨" };
      case "vigilance":
        return { text: "🟠 VIGILANCE", color: "text-amber-400", icon: "⚠️" };
      default:
        return { text: "✅ SITUATION NORMALE", color: "text-emerald-400", icon: "✓" };
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
      <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-sky-300 mb-4">🗺️ Carte Hydrologique - La Liane</h3>
        
        {/* Carte Leaflet */}
        <div
          ref={mapRef}
          className="w-full rounded-lg overflow-hidden border border-slate-700 shadow-lg"
          style={{ height: "500px", minHeight: "500px" }}
        />

        {/* Stats détaillées sous la carte */}
        <div className="grid grid-cols-4 gap-3 text-xs mt-6">
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60">
            <p className="text-slate-400 mb-1">📊 Niveau Actuel</p>
            <p className="text-lg font-bold text-sky-300">{currentLevel?.toFixed(2)}m</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60">
            <p className="text-slate-400 mb-1">📈 Pic 5h</p>
            <p className="text-lg font-bold text-amber-300">{maxPredicted?.toFixed(2)}m</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60">
            <p className="text-slate-400 mb-1">🔺 Min 5h</p>
            <p className="text-lg font-bold text-sky-300">
              {trendData.length > 0 ? Math.min(...trendData.map((d) => d.level)).toFixed(2) : "N/A"}m
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60">
            <p className="text-slate-400 mb-1">📊 Moy 5h</p>
            <p className="text-lg font-bold text-slate-300">
              {trendData.length > 0
                ? (trendData.reduce((sum, d) => sum + d.level, 0) / trendData.length).toFixed(2)
                : "N/A"}m
            </p>
          </div>
        </div>
      </div>

      {/* TENDANCE 5H AVEC GRAPHIQUE */}
      {trendData.length > 0 && (
        <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-sky-300 mb-4">📊 Tendance 5 Heures</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[2.8, 4]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e0f2fe" }}
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
          <div className="flex gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-slate-300">Prédictions RF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-[2px] bg-orange-500"></div>
              <span className="text-slate-300">Seuil Vigilance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-[2px] bg-red-500"></div>
              <span className="text-slate-300">Seuil Alerte</span>
            </div>
          </div>
        </div>
      )}

      {/* INFOS ET RECOMMANDATIONS */}
      <div className="grid grid-cols-2 gap-6">
        {/* Infos techniques */}
        <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-sky-300 mb-4">🔧 Informations Techniques</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-2 rounded bg-slate-900/40">
              <span className="text-slate-400">Cours d'eau</span>
              <span className="font-semibold text-sky-300">La Liane</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/40">
              <span className="text-slate-400">Région</span>
              <span className="font-semibold text-sky-300">Nouvelle-Aquitaine</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/40">
              <span className="text-slate-400">Modèle</span>
              <span className="font-semibold text-sky-300">Random Forest</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/40">
              <span className="text-slate-400">Horizon</span>
              <span className="font-semibold text-sky-300">5 heures</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/40">
              <span className="text-slate-400">Mise à jour</span>
              <span className="font-semibold text-emerald-300">
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
          <div className="space-y-2 text-sm text-slate-300">
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
