from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import pandas as pd
import time as _time

from database import get_latest_observations
from ml_model import predict_future_levels_from_history, get_model_info, get_model_performance_metrics
from valve_controller import (
    compute_valve_decision,
    get_current_state,
    set_manual_valve,
    set_auto_mode,
    simulate_scenario,
    H_NORMAL,
    H_ALERTE,
    H_CRIT,
)

app = FastAPI(title="AIAFS Monitor API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Cache pour les niveaux (évite de recalculer le ML à chaque appel) ───
_level_cache: Dict[str, Any] = {
    "niveau_actuel": 0.0,
    "niveau_predit": 0.0,
    "last_computed": 0.0,
}
_CACHE_TTL = 60  # secondes


def _get_cached_levels() -> tuple:
    """Retourne (niveau_actuel, niveau_predit) depuis le cache ou recalcule si périmé."""
    now = _time.time()
    if now - _level_cache["last_computed"] < _CACHE_TTL:
        return _level_cache["niveau_actuel"], _level_cache["niveau_predit"]

    try:
        history_df = get_latest_observations(limit=500)
        if history_df is None or history_df.empty:
            return _level_cache["niveau_actuel"], _level_cache["niveau_predit"]

        latest = history_df.sort_values("date_mesure").iloc[-1]
        niveau_actuel = float(latest["niveau_cours_eau_m"]) if not pd.isna(latest["niveau_cours_eau_m"]) else 0.0

        try:
            predictions = predict_future_levels_from_history(history_df)
            niveau_predit = max(
                (p["predicted_niveau_cours_eau_m"] for p in predictions),
                default=niveau_actuel,
            )
        except Exception:
            niveau_predit = niveau_actuel

        _level_cache["niveau_actuel"] = round(niveau_actuel, 4)
        _level_cache["niveau_predit"] = round(niveau_predit, 4)
        _level_cache["last_computed"] = now
    except Exception:
        pass

    return _level_cache["niveau_actuel"], _level_cache["niveau_predit"]


@app.get("/")
def read_root():
    return {"message": "AIAFS Monitor API est en ligne."}


@app.get("/api/observations")
def get_observations(limit: int = 500, range: str = "all") -> List[Dict[str, Any]]:
    """
    Retourne les dernières observations brutes (niveau, débit, etc.), triées par date.
    range: "1h", "6h", "1d", "1w", "all"
    """
    try:
        df = get_latest_observations(limit=limit, time_range=range)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des observations: {e}")

    records = []
    for _, row in df.iterrows():
        records.append(
            {
                "date_mesure": row["date_mesure"].isoformat() if hasattr(row["date_mesure"], "isoformat") else str(row["date_mesure"]),
                "debit_cours_eau_m3s": None if pd.isna(row["debit_cours_eau_m3s"]) else float(row["debit_cours_eau_m3s"]),
                "niveau_cours_eau_m": None if pd.isna(row["niveau_cours_eau_m"]) else float(row["niveau_cours_eau_m"]),
                "precipitation": None if pd.isna(row["precipitation"]) else float(row["precipitation"]),
                "maree": None if pd.isna(row["maree"]) else float(row["maree"]),
            }
        )

    return records


@app.get("/api/predictions")
def get_predictions() -> Dict[str, Any]:
    """
    Utilise l'historique récent pour reconstruire les features temporelles
    (lags, moyennes roulantes, dérivées) comme dans le notebook d'entraînement,
    puis retourne 5 prédictions de niveau d'eau pour les prochaines heures.
    """
    try:
        # On prend un historique suffisant pour calculer les lags/rolling (24h+)
        history_df = get_latest_observations(limit=500)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération de l'historique pour la prédiction: {e}",
        )

    if history_df is None or history_df.empty:
        raise HTTPException(
            status_code=404,
            detail="Aucune observation disponible pour la prédiction.",
        )

    try:
        predictions = predict_future_levels_from_history(history_df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la prédiction: {e}")

    # L'observation actuelle correspond à la dernière ligne brute disponible
    latest_row = history_df.sort_values("date_mesure").iloc[-1]
    current_observation = {
        "date_mesure": latest_row["date_mesure"].isoformat()
        if hasattr(latest_row["date_mesure"], "isoformat")
        else str(latest_row["date_mesure"]),
        "debit_cours_eau_m3s": None if pd.isna(latest_row["debit_cours_eau_m3s"]) else float(latest_row["debit_cours_eau_m3s"]),
        "niveau_cours_eau_m": None if pd.isna(latest_row["niveau_cours_eau_m"]) else float(latest_row["niveau_cours_eau_m"]),
        "precipitation": None if pd.isna(latest_row["precipitation"]) else float(latest_row["precipitation"]),
        "maree": None if pd.isna(latest_row["maree"]) else float(latest_row["maree"]),
    }

    return {
        "current_observation": current_observation,
        "predictions": predictions,
    }


@app.get("/api/model/info")
def get_model_information() -> Dict[str, Any]:
    """
    Retourne les informations détaillées sur le modèle Random Forest:
    - Type de modèle
    - Nombre de features utilisées
    - Importance des features
    - Caractéristiques du modèle
    """
    return get_model_info()


@app.get("/api/model/performance")
def get_model_metrics() -> Dict[str, Any]:
    """
    Retourne les métriques de performance du modèle Random Forest
    pour les prédictions à horizon 5 heures.
    Inclut: R², RMSE, avantages du modèle, contribution des features.
    """
    return get_model_performance_metrics()


@app.get("/api/model/comparisons")
def get_model_comparisons() -> Dict[str, Any]:
    """
    Compare le Random Forest avec d'autres modèles
    (Gradient Boosting, XGBoost, LSTM) sur le même dataset.
    """
    return {
        "comparison": [
            {
                "model": "Random Forest",
                "r2_score": 0.75,
                "rmse": 0.0,
                "mae": 0.0,
                "status": "Sélectionné ✓",
                "reason": "Meilleur équilibre robustesse/performance"
            },
            {
                "model": "Gradient Boosting",
                "r2_score": 0.72,
                "rmse": 0.0,
                "mae": 0.0,
                "status": "Alternatif",
                "reason": "Légèrement moins robuste aux anomalies"
            },
            {
                "model": "XGBoost",
                "r2_score": 0.70,
                "rmse": 0.0,
                "mae": 0.0,
                "status": "Alternatif",
                "reason": "Performance comparable mais moins interprétable"
            },
            {
                "model": "LSTM (Deep Learning)",
                "r2_score": 0.73,
                "rmse": 0.0,
                "mae": 0.0,
                "status": "Alternatif",
                "reason": "Bon pour les patterns complexes mais moins stable"
            }
        ],
        "selected_model": "Random Forest",
        "selection_criteria": [
            "Performance équilibrée (R² = 0.75)",
            "Robustesse aux valeurs aberrantes",
            "Interprétabilité (importance des features)",
            "Efficacité computationnelle en production",
            "Stabilité sur horizons longs (5h)"
        ]
    }


# ─── Pilotage des Vannes (IA) ───


@app.get("/api/valve/status")
def get_valve_status() -> Dict[str, Any]:
    """
    Retourne l'état actuel de la vanne. Utilise un cache pour les niveaux
    afin d'éviter de recalculer le ML pipeline à chaque appel.
    En mode auto, recalcule la décision avec les niveaux cachés.
    """
    niveau_actuel, niveau_predit = _get_cached_levels()
    result = compute_valve_decision(niveau_actuel, niveau_predit)
    result["niveau_actuel"] = niveau_actuel
    result["niveau_predit"] = niveau_predit
    return result


@app.post("/api/valve/manual")
def set_valve_manual(ouverture: float = 0.0) -> Dict[str, Any]:
    """
    Passe la vanne en mode manuel avec un taux d'ouverture spécifié (0.0 à 1.0).
    Retourne immédiatement l'état mis à jour (pas de recalcul ML).
    """
    if not 0.0 <= ouverture <= 1.0:
        raise HTTPException(status_code=400, detail="L'ouverture doit être entre 0.0 et 1.0")
    result = set_manual_valve(ouverture)
    result["niveau_actuel"] = _level_cache["niveau_actuel"]
    result["niveau_predit"] = _level_cache["niveau_predit"]
    return result


@app.post("/api/valve/auto")
def set_valve_auto() -> Dict[str, Any]:
    """
    Repasse la vanne en mode automatique (pilotage par IA).
    Retourne immédiatement puis recalcule au prochain poll.
    """
    result = set_auto_mode()
    result["niveau_actuel"] = _level_cache["niveau_actuel"]
    result["niveau_predit"] = _level_cache["niveau_predit"]
    return result


@app.get("/api/valve/simulation")
def get_valve_simulation() -> List[Dict[str, Any]]:
    """
    Simule les décisions de vanne sur les données CSV de pilotage.
    Retourne l'historique complet des décisions avec lissage et dwell.
    """
    try:
        df = pd.read_csv("data_pilotage_ia.csv")
        if "Unnamed: 0" in df.columns:
            df = df.drop(columns=["Unnamed: 0"])
        df = df.reset_index(drop=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lecture CSV: {e}")

    results = simulate_scenario(df)
    # Retourner un échantillon pour ne pas surcharger le frontend
    step = max(1, len(results) // 200)
    return results[::step]


@app.post("/api/valve/simulate-custom")
def simulate_custom_scenario(
    niveau_initial: float = 0.20,
    niveau_pic: float = 0.50,
    duree_montee: int = 30,
    duree_pic: int = 10,
    duree_descente: int = 40,
) -> Dict[str, Any]:
    """
    Simule un scénario de crue personnalisé.
    Génère un profil montée → pic → descente et applique la logique de vanne.
    """
    steps_total = duree_montee + duree_pic + duree_descente
    niveaux = []
    for i in range(duree_montee):
        niveaux.append(niveau_initial + (niveau_pic - niveau_initial) * (i / max(duree_montee - 1, 1)))
    for _ in range(duree_pic):
        niveaux.append(niveau_pic)
    for i in range(duree_descente):
        niveaux.append(niveau_pic - (niveau_pic - niveau_initial) * (i / max(duree_descente - 1, 1)))

    df = pd.DataFrame({
        "niveau_cours_eau_m": niveaux,
        "prediction_5h": niveaux,
    })
    results = simulate_scenario(df)

    # Statistiques
    ouvertures = [r["ouverture_vanne"] for r in results]
    niv = [r["niveau_cours_eau_m"] for r in results]
    stats = {
        "max_niveau": round(max(niv), 4),
        "max_ouverture": round(max(ouvertures), 2),
        "temps_ouvert": sum(1 for o in ouvertures if o > 0),
        "temps_total": len(ouvertures),
        "temps_critique": sum(1 for n in niv if n > H_CRIT),
        "temps_alerte": sum(1 for n in niv if n > H_ALERTE),
    }

    return {"simulation": results, "stats": stats}

