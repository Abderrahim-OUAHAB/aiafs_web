from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import pandas as pd

from database import get_latest_observations
from ml_model import predict_future_levels_from_history

app = FastAPI(title="AIAFS Monitor API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "AIAFS Monitor API est en ligne."}


@app.get("/api/observations")
def get_observations(limit: int = 200) -> List[Dict[str, Any]]:
    """
    Retourne les dernières observations brutes (niveau, débit, etc.), triées par date.
    """
    try:
        df = get_latest_observations(limit=limit)
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

