import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const API_BASE_URL = "http://localhost:8000";

/* ─── Utilitaires visuels ─── */

function valveColor(ouverture) {
  if (ouverture <= 0) return "text-emerald-400";
  if (ouverture < 0.3) return "text-sky-400";
  if (ouverture < 0.6) return "text-amber-400";
  return "text-red-400";
}

function valveBgColor(ouverture) {
  if (ouverture <= 0) return "bg-emerald-500";
  if (ouverture < 0.3) return "bg-sky-500";
  if (ouverture < 0.6) return "bg-amber-500";
  return "bg-red-500";
}

function modeColor(mode) {
  return mode === "auto" ? "text-sky-400" : "text-amber-400";
}

function modeBgColor(mode) {
  return mode === "auto"
    ? "bg-sky-500/20 border-sky-500/40"
    : "bg-amber-500/20 border-amber-500/40";
}

/* ─── Jauge SVG circulaire ─── */

function CircularGauge({ value, size = 180 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value));
  const offset = circumference * (1 - pct);

  let strokeColor = "#22c55e";
  if (pct > 0 && pct < 0.3) strokeColor = "#38bdf8";
  else if (pct >= 0.3 && pct < 0.6) strokeColor = "#f59e0b";
  else if (pct >= 0.6) strokeColor = "#ef4444";

  return (
    <svg width={size} height={size} className="mx-auto">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1e293b"
        strokeWidth="12"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        className="fill-white text-3xl font-bold"
        style={{ fontSize: "2rem" }}
      >
        {Math.round(pct * 100)}%
      </text>
      <text
        x={size / 2}
        y={size / 2 + 18}
        textAnchor="middle"
        className="fill-slate-400 text-xs"
        style={{ fontSize: "0.75rem" }}
      >
        ouverture
      </text>
    </svg>
  );
}

/* ─── Icône de vanne animée ─── */

function ValveIcon({ ouverture }) {
  const deg = ouverture * 90; // 0° = fermé, 90° = ouvert
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        {/* Corps de la vanne */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-500 bg-slate-800/50 flex items-center justify-center">
          <div
            className="w-8 h-1 bg-slate-300 rounded"
            style={{
              transform: `rotate(${deg}deg)`,
              transition: "transform 0.6s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Spinner inline ─── */

function Spinner({ className = "" }) {
  return <span className={`inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} />;
}

/* ─── Composant principal ─── */

export default function ValvePiloting() {
  const [valveData, setValveData] = useState(null);
  const [simulation, setSimulation] = useState([]);
  const [customSim, setCustomSim] = useState(null);
  const [error, setError] = useState("");
  const [manualValue, setManualValue] = useState(0);

  // Loading states per-action
  const [statusLoading, setStatusLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [customSimLoading, setCustomSimLoading] = useState(false);

  // UI toggles
  const [showSimulation, setShowSimulation] = useState(false);
  const [simTab, setSimTab] = useState("csv"); // "csv" | "custom"

  // Custom simulation parameters
  const [simParams, setSimParams] = useState({
    niveau_initial: 0.20,
    niveau_pic: 0.50,
    duree_montee: 30,
    duree_pic: 10,
    duree_descente: 40,
  });

  /* ─── Auto-dismiss error ─── */
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  /* ─── Fetch état de la vanne ─── */
  const fetchValveStatus = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setStatusLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/valve/status`);
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setValveData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  /* ─── Fetch simulation CSV ─── */
  const fetchSimulation = useCallback(async () => {
    try {
      setSimLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/valve/simulation`);
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSimLoading(false);
    }
  }, []);

  /* ─── Fetch simulation personnalisée ─── */
  const fetchCustomSimulation = useCallback(async () => {
    try {
      setCustomSimLoading(true);
      const params = new URLSearchParams({
        niveau_initial: simParams.niveau_initial,
        niveau_pic: simParams.niveau_pic,
        duree_montee: simParams.duree_montee,
        duree_pic: simParams.duree_pic,
        duree_descente: simParams.duree_descente,
      });
      const res = await fetch(`${API_BASE_URL}/api/valve/simulate-custom?${params}`, { method: "POST" });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setCustomSim(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCustomSimLoading(false);
    }
  }, [simParams]);

  /* ─── Mode manuel (optimistic) ─── */
  const setManualMode = useCallback(async () => {
    setValveData((prev) =>
      prev
        ? { ...prev, ouverture: manualValue / 100, mode: "manuel", status_label: "Mode manuel", decision_reason: `Ouverture manuelle à ${manualValue}%` }
        : prev
    );
    try {
      setManualLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/valve/manual?ouverture=${manualValue / 100}`, { method: "POST" });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setValveData(data);
    } catch (err) {
      setError(err.message);
      fetchValveStatus(false);
    } finally {
      setManualLoading(false);
    }
  }, [manualValue, fetchValveStatus]);

  /* ─── Mode auto (optimistic) ─── */
  const setAutoMode = useCallback(async () => {
    setValveData((prev) => (prev ? { ...prev, mode: "auto", decision_reason: "Passage en mode automatique…" } : prev));
    try {
      setAutoLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/valve/auto`, { method: "POST" });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setValveData(data);
    } catch (err) {
      setError(err.message);
      fetchValveStatus(false);
    } finally {
      setAutoLoading(false);
    }
  }, [fetchValveStatus]);

  /* ─── Polling toutes les 10s (léger grâce au cache backend) ─── */
  useEffect(() => {
    fetchValveStatus();
    const interval = setInterval(() => fetchValveStatus(false), 10000);
    return () => clearInterval(interval);
  }, [fetchValveStatus]);

  const ouverture = valveData?.ouverture ?? 0;
  const mode = valveData?.mode ?? "auto";
  const seuils = valveData?.seuils ?? {};
  const historique = valveData?.historique ?? [];

  /* ─── Stats de la simulation CSV ─── */
  const simStats = useMemo(() => {
    if (!simulation.length) return null;
    const niv = simulation.map((r) => r.niveau_cours_eau_m);
    const ouv = simulation.map((r) => r.ouverture_vanne);
    return {
      max_niveau: Math.max(...niv).toFixed(4),
      max_ouverture: (Math.max(...ouv) * 100).toFixed(0),
      temps_ouvert: ouv.filter((o) => o > 0).length,
      temps_total: ouv.length,
      temps_alerte: niv.filter((n) => n > (seuils.H_alerte ?? 0.25)).length,
      temps_critique: niv.filter((n) => n > (seuils.H_crit ?? 0.45)).length,
    };
  }, [simulation, seuils]);

  return (
    <div className="space-y-6">
      {/* ─── En-tête ─── */}
      <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30">
              <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Pilotage des Vannes – IA</h2>
              <p className="text-xs text-slate-400">Contrôle intelligent basé sur les niveaux et prédictions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusLoading && <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${modeBgColor(mode)}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${mode === "auto" ? "bg-sky-400" : "bg-amber-400"}`} />
              <span className={modeColor(mode)}>Mode {mode === "auto" ? "Automatique" : "Manuel"}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/60 bg-red-950/40 text-red-200 text-sm px-4 py-2 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-300 hover:text-white ml-3 text-lg leading-none cursor-pointer">&times;</button>
          </div>
        )}

        {/* ─── Grille principale ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Jauge */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <CircularGauge value={ouverture} />
            <div className="mt-3 text-center">
              <p className={`text-sm font-semibold transition-colors duration-300 ${valveColor(ouverture)}`}>
                {valveData?.status_label ?? "—"}
              </p>
              <ValveIcon ouverture={ouverture} />
            </div>
          </div>

          {/* Informations de décision */}
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <p className="text-slate-400 text-xs mb-1">Niveau actuel</p>
              <p className="text-xl font-bold text-sky-300">{valveData?.niveau_actuel != null ? `${valveData.niveau_actuel.toFixed(4)} m` : "N/A"}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <p className="text-slate-400 text-xs mb-1">Prédiction max (5h)</p>
              <p className="text-xl font-bold text-amber-300">{valveData?.niveau_predit != null ? `${valveData.niveau_predit.toFixed(4)} m` : "N/A"}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <p className="text-slate-400 text-xs mb-1">Raison de décision</p>
              <p className="text-sm text-slate-200">{valveData?.decision_reason ?? "—"}</p>
            </div>
          </div>

          {/* Seuils & Paramètres */}
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <p className="text-slate-400 text-xs mb-2">Seuils de décision</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs text-slate-300">Normal</span></div>
                  <span className="text-xs font-mono text-emerald-400">&lt; {seuils.H_normal ?? 0.22} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-xs text-slate-300">Alerte</span></div>
                  <span className="text-xs font-mono text-amber-400">&gt; {seuils.H_alerte ?? 0.25} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="text-xs text-slate-300">Critique</span></div>
                  <span className="text-xs font-mono text-red-400">&gt; {seuils.H_crit ?? 0.45} m</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <p className="text-slate-400 text-xs mb-2">Règles d'ouverture</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-300">Normal →</span><span className="font-mono text-emerald-400">0% fermée</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Risque futur →</span><span className="font-mono text-sky-400">30% préventive</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Alerte →</span><span className="font-mono text-amber-400">60% moyenne</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Critique →</span><span className="font-mono text-red-400">100% urgence</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Contrôle Manuel / Auto ─── */}
      <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-5 shadow-lg">
        <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Contrôle de la Vanne
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Slider */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <label className="text-sm text-slate-300 block mb-2">
              Ouverture manuelle : <span className="font-bold text-white">{manualValue}%</span>
            </label>
            <input type="range" min="0" max="100" step="5" value={manualValue}
              onChange={(e) => setManualValue(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>

            {/* Quick presets */}
            <div className="mt-2 grid grid-cols-5 gap-1">
              {[0, 25, 50, 75, 100].map((pct) => (
                <button key={pct} onClick={() => setManualValue(pct)}
                  className={`px-1 py-1 rounded text-xs font-medium transition-all duration-150 cursor-pointer select-none active:scale-95 ${manualValue === pct ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                >{pct}%</button>
              ))}
            </div>

            <button onClick={setManualMode} disabled={manualLoading}
              className="mt-3 w-full px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait text-white text-sm font-medium transition-all duration-150 cursor-pointer select-none flex items-center justify-center gap-2"
            >{manualLoading ? <><Spinner /> Application…</> : "Appliquer en mode manuel"}</button>
          </div>

          {/* Auto */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <p className="text-sm text-slate-300 mb-2">Mode automatique</p>
              <p className="text-xs text-slate-400/80">
                L'IA pilote les vannes automatiquement en fonction des niveaux d'eau actuels
                et des prédictions à 5 heures. Le lissage (max ±20%) et la temporisation
                (dwell {valveData?.parametres?.dwell_steps ?? 5} pas) empêchent les oscillations.
              </p>
            </div>
            <button onClick={setAutoMode} disabled={mode === "auto" || autoLoading}
              className={`mt-3 w-full px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-150 select-none flex items-center justify-center gap-2 ${mode === "auto" ? "bg-sky-700 cursor-default" : "bg-sky-600 hover:bg-sky-500 active:scale-[0.97] cursor-pointer"} disabled:opacity-60 disabled:cursor-wait`}
            >{autoLoading ? <><Spinner /> Activation…</> : mode === "auto" ? "✓ Mode auto actif" : "Activer mode auto"}</button>
          </div>
        </div>
      </div>

      {/* ─── Historique des décisions ─── */}
      {historique.length > 0 && (
        <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-5 shadow-lg">
          <h3 className="text-md font-semibold text-white mb-4">Historique des décisions récentes</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historique}>
                <defs>
                  <linearGradient id="colorOuverture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="niveau_actuel" tick={{ fill: "#94a3b8", fontSize: 11 }}
                  label={{ value: "Niveau (m)", position: "insideBottom", offset: -5, style: { fill: "#64748b", fontSize: 10 } }} />
                <YAxis domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 11 }}
                  label={{ value: "Ouverture", angle: -90, position: "insideLeft", style: { fill: "#64748b", fontSize: 10 } }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.5rem", fontSize: "0.75rem" }}
                  formatter={(v) => [`${(v * 100).toFixed(0)}%`, "Ouverture"]} />
                <Area type="stepAfter" dataKey="ouverture" stroke="#38bdf8" strokeWidth={2} fill="url(#colorOuverture)" />
                <Line type="stepAfter" dataKey="cible" stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-sky-500 rounded" /> Ouverture effective</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-amber-500 rounded opacity-60" /> Cible brute</span>
          </div>
        </div>
      )}

      {/* ─── Simulation (2 onglets) ─── */}
      <div className="rounded-xl bg-aiafs-panel/80 border border-slate-700 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-md font-semibold text-white">Simulation du pilotage</h3>
          <div className="flex items-center gap-2">
            {["csv", "custom"].map((tab) => (
              <button key={tab}
                onClick={() => { setSimTab(tab); setShowSimulation(true); if (tab === "csv" && simulation.length === 0) fetchSimulation(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer select-none active:scale-95 ${simTab === tab && showSimulation ? "bg-sky-600 text-white shadow-md shadow-sky-600/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}
              >{tab === "csv" ? "Données historiques" : "Scénario personnalisé"}</button>
            ))}
            <button onClick={() => setShowSimulation(!showSimulation)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-xs text-white transition-all duration-150 cursor-pointer select-none"
            >{showSimulation ? "Masquer" : "Afficher"}</button>
          </div>
        </div>

        {/* Tab CSV */}
        {showSimulation && simTab === "csv" && (
          <>
            {simLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6 text-sky-400" />
                <span className="ml-3 text-sm text-slate-400">Calcul de la simulation…</span>
              </div>
            ) : simulation.length > 0 ? (
              <div className="space-y-4">
                {simStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Niveau max", value: `${simStats.max_niveau} m`, color: "text-sky-300" },
                      { label: "Ouverture max", value: `${simStats.max_ouverture}%`, color: "text-amber-300" },
                      { label: "Vanne active", value: `${simStats.temps_ouvert}/${simStats.temps_total} pas`, color: "text-slate-200" },
                      { label: "Temps en alerte", value: `${simStats.temps_alerte + simStats.temps_critique} pas`, color: "text-red-400" },
                    ].map((s) => (
                      <div key={s.label} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60">
                        <p className="text-slate-400 text-xs">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <SimulationChart data={simulation} seuils={seuils} />
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-sky-500 rounded" /> Niveau observé</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-purple-400 rounded" /> Prédiction 5h</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-emerald-500 rounded" /> Ouverture vanne</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aucune donnée de simulation disponible.</p>
            )}
          </>
        )}

        {/* Tab custom */}
        {showSimulation && simTab === "custom" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { key: "niveau_initial", label: "Niveau initial (m)", min: 0, max: 1, step: 0.01 },
                { key: "niveau_pic", label: "Niveau pic (m)", min: 0, max: 1, step: 0.01 },
                { key: "duree_montee", label: "Montée (pas)", min: 5, max: 100, step: 5 },
                { key: "duree_pic", label: "Pic (pas)", min: 1, max: 50, step: 1 },
                { key: "duree_descente", label: "Descente (pas)", min: 5, max: 100, step: 5 },
              ].map((p) => (
                <div key={p.key}>
                  <label className="text-xs text-slate-400 block mb-1">{p.label}</label>
                  <input type="number" min={p.min} max={p.max} step={p.step} value={simParams[p.key]}
                    onChange={(e) => setSimParams((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors" />
                </div>
              ))}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Crue légère", params: { niveau_initial: 0.20, niveau_pic: 0.30, duree_montee: 20, duree_pic: 5, duree_descente: 30 } },
                { label: "Crue moyenne", params: { niveau_initial: 0.20, niveau_pic: 0.50, duree_montee: 30, duree_pic: 10, duree_descente: 40 } },
                { label: "Crue sévère", params: { niveau_initial: 0.20, niveau_pic: 0.80, duree_montee: 15, duree_pic: 20, duree_descente: 50 } },
                { label: "Crue éclair", params: { niveau_initial: 0.15, niveau_pic: 0.70, duree_montee: 8, duree_pic: 3, duree_descente: 20 } },
              ].map((preset) => (
                <button key={preset.label} onClick={() => setSimParams(preset.params)}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-150 cursor-pointer select-none active:scale-95"
                >{preset.label}</button>
              ))}
            </div>

            <button onClick={fetchCustomSimulation} disabled={customSimLoading}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait text-white text-sm font-medium transition-all duration-150 cursor-pointer select-none flex items-center gap-2"
            >{customSimLoading ? <><Spinner /> Calcul…</> : "Lancer la simulation"}</button>

            {customSim && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Niveau max", value: `${customSim.stats.max_niveau} m`, color: "text-sky-300" },
                    { label: "Ouverture max", value: `${(customSim.stats.max_ouverture * 100).toFixed(0)}%`, color: "text-amber-300" },
                    { label: "Vanne active", value: `${customSim.stats.temps_ouvert}/${customSim.stats.temps_total} pas`, color: "text-slate-200" },
                    { label: "Temps critique", value: `${customSim.stats.temps_critique} pas`, color: "text-red-400" },
                  ].map((s) => (
                    <div key={s.label} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60">
                      <p className="text-slate-400 text-xs">{s.label}</p>
                      <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <SimulationChart data={customSim.simulation} seuils={seuils} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Chart réutilisable pour les simulations ─── */

function SimulationChart({ data, seuils }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="step" tick={{ fill: "#94a3b8", fontSize: 10 }}
            label={{ value: "Pas de temps", position: "insideBottom", offset: -5, style: { fill: "#64748b", fontSize: 10 } }} />
          <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: "Niveau (m)", angle: -90, position: "insideLeft", style: { fill: "#64748b", fontSize: 10 } }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: "Ouverture", angle: 90, position: "insideRight", style: { fill: "#64748b", fontSize: 10 } }} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.5rem", fontSize: "0.75rem" }}
            formatter={(v, name) => name === "ouverture_vanne" ? [`${(v * 100).toFixed(0)}%`, "Ouverture"] : [`${v.toFixed(4)} m`, name === "niveau_cours_eau_m" ? "Niveau" : "Prédiction 5h"]} />
          <ReferenceLine yAxisId="left" y={seuils.H_alerte ?? 0.25} stroke="#f97316" strokeDasharray="6 3" label={{ value: "Alerte", fill: "#f97316", fontSize: 10 }} />
          <ReferenceLine yAxisId="left" y={seuils.H_crit ?? 0.45} stroke="#ef4444" strokeDasharray="6 3" label={{ value: "Critique", fill: "#ef4444", fontSize: 10 }} />
          <Line yAxisId="left" type="monotone" dataKey="niveau_cours_eau_m" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="prediction_5h" stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 2" dot={false} />
          <Line yAxisId="right" type="stepAfter" dataKey="ouverture_vanne" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
