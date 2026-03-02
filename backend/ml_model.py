import joblib
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any

MODEL_FILENAME = "modèle_1_rf_aiafs.pkl"

_model_path = Path(__file__).resolve().parent / MODEL_FILENAME
try:
    model = joblib.load(_model_path)
except Exception as e:
    print(f"Erreur lors du chargement du modèle '{MODEL_FILENAME}': {e}")
    model = None


def _build_feature_row_from_history(raw_data: pd.DataFrame) -> pd.DataFrame:
    """
    Reproduit la logique de préparation des features du notebook `model_niveau.ipynb`
    pour construire UNE seule ligne de features à partir de l'historique récent.

    Cette fonction:
      - trie les données par date_mesure
      - reconstruit les features temporelles, lags, rolling, dérivées
      - aligne les colonnes sur model.feature_names_in_ (ajoute les manquantes avec 0)
      - renvoie un DataFrame (1 ligne) prêt pour model.predict(...)
    """
    if raw_data is None or raw_data.empty:
        raise ValueError("Les données brutes pour la construction des features sont vides.")

    if "date_mesure" not in raw_data.columns:
        raise ValueError("La colonne 'date_mesure' est manquante dans les données brutes.")

    # Copie et préparation de l'index temporel
    data = raw_data.copy()
    data["date_mesure"] = pd.to_datetime(data["date_mesure"])
    data = data.sort_values("date_mesure").set_index("date_mesure")

    # 1. Features temporelles (heure, mois)
    data["heure"] = data.index.hour
    data["mois"] = data.index.month

    # 2. Lags profonds pour la précipitation (1h, 2h, 3h, 6h, 12h)
    # Hypothèse identique au notebook: pas de 6 minutes -> 10 pas = 1h
    if "precipitation" in data.columns:
        for h in [1, 2, 3, 6, 12]:
            steps = h * 10
            data[f"precip_cum_{h}h"] = data["precipitation"].rolling(window=steps).sum()
            data[f"precip_lag_{h}h"] = data["precipitation"].shift(steps)

    # 3. Lags pour le niveau (lag_features = 5 dans le notebook)
    if "niveau_cours_eau_m" not in data.columns:
        raise ValueError("La colonne 'niveau_cours_eau_m' est manquante dans les données brutes.")

    lag_features = 5
    for i in range(1, lag_features + 1):
        data[f"niveau_lag_{i}"] = data["niveau_cours_eau_m"].shift(i)

    # 4. Features roulantes longues (60, 120, 240 pas)
    for window in [60, 120, 240]:
        data[f"niveau_roll_mean_{window}"] = data["niveau_cours_eau_m"].rolling(window=window).mean()
        if "precipitation" in data.columns:
            data[f"precip_roll_mean_{window}"] = data["precipitation"].rolling(window=window).mean()

    # 5. Différenciation (vitesse de montée des eaux)
    data["derivee_niveau"] = data["niveau_cours_eau_m"].diff(5)

    # 6. Constitution des features (on ne garde pas la date brute)
    feature_cols = [c for c in data.columns]
    X_full = data[feature_cols]

    # On enlève les lignes qui ont des NaNs (début des séries à cause des shifts/rolling)
    valid_mask = ~X_full.isnull().any(axis=1)
    X_valid = X_full[valid_mask]

    if X_valid.empty:
        raise ValueError("Aucune ligne valide après la construction des features (trop peu d'historique ?).")

    # On prend la DERNIÈRE ligne valide (la plus récente)
    X_last = X_valid.tail(1)

    # Alignement sur les features utilisées lors de l'entraînement
    if hasattr(model, "feature_names_in_"):
        expected_features = list(model.feature_names_in_)
        # Ajout de colonnes manquantes (ex: 'Unnamed: 0') avec 0
        for col in expected_features:
            if col not in X_last.columns:
                X_last[col] = 0.0
        # Suppression de colonnes en trop et réordonnancement
        X_last = X_last[expected_features]

    return X_last


def predict_future_levels_from_history(raw_history: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Prend en entrée un DataFrame de plusieurs lignes brutes (historique récent),
    reconstruit les features comme dans le notebook, puis utilise le modèle
    Random Forest pour prédire 5 niveaux futurs.

    On part de l'hypothèse:
      - le modèle est un modèle "un pas" (forecast_horizon=1 dans le notebook)
      - on itère 5 fois pour obtenir 5 pas futurs
      - chaque pas est présenté comme +1h dans le temps côté API
    """
    if model is None:
        raise RuntimeError("Le modèle n'a pas pu être chargé.")

    if raw_history is None or raw_history.empty:
        raise ValueError("Les données d'historique pour la prédiction sont vides.")

    if "date_mesure" not in raw_history.columns:
        raise ValueError("La colonne 'date_mesure' est manquante dans l'historique.")

    # Timestamp de la dernière observation existante
    last_timestamp = pd.to_datetime(raw_history["date_mesure"].max())

    # On construit une ligne de features à partir de l'historique récent
    X_last = _build_feature_row_from_history(raw_history)

    # On duplique cette même ligne pour générer 5 prédictions successives
    X_future = pd.concat([X_last] * 5, ignore_index=True)

    y_pred = model.predict(X_future)

    predictions: List[Dict[str, Any]] = []
    for i in range(5):
        future_timestamp = last_timestamp + pd.Timedelta(hours=i + 1)
        predictions.append(
            {
                "timestamp": future_timestamp.isoformat(),
                "predicted_niveau_cours_eau_m": float(y_pred[i]),
            }
        )

    return predictions

