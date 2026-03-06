"""
Module de pilotage intelligent des vannes – AIAFS
Logique de décision basée sur les niveaux actuels et prédits,
avec lissage des actions et contrôle de temporisation (dwell).
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

# ─── Seuils de décision (mètres) ───
H_NORMAL = 0.22
H_ALERTE = 0.25
H_CRIT = 0.45

# ─── Paramètres de contrôle ───
MAX_DELTA = 0.2      # variation max entre deux pas
DWELL_STEPS = 5      # pas minimum entre deux changements

# État global de la vanne (simulé en mémoire)
_valve_state = {
    "ouverture": 0.0,
    "mode": "auto",           # "auto" ou "manuel"
    "last_change_step": 0,
    "historique": [],
}


def decision(niveau_actuel: float, niveau_predit: float) -> float:
    """
    Décision brute d'ouverture de vanne basée sur les seuils.
    Retourne un taux d'ouverture entre 0.0 et 1.0.
    """
    # CAS CRITIQUE
    if niveau_actuel > H_CRIT or niveau_predit > H_CRIT:
        return 1.0   # ouverture forte (100%)

    # CAS ALERTE ACTUELLE
    elif niveau_actuel > H_ALERTE:
        return 0.6   # ouverture moyenne (60%)

    # CAS RISQUE FUTUR
    elif niveau_predit > H_ALERTE:
        return 0.3   # ouverture progressive (30%)

    # CAS NORMAL
    else:
        return 0.0   # vanne fermée


def smooth_action(u_target: float, u_prev: float, max_delta: float = MAX_DELTA) -> float:
    """
    Lisse la transition entre deux ouvertures pour éviter les à-coups.
    """
    if u_target > u_prev + max_delta:
        u_new = u_prev + max_delta
    elif u_target < u_prev - max_delta:
        u_new = u_prev - max_delta
    else:
        u_new = u_target

    return float(np.clip(u_new, 0.0, 1.0))


def get_valve_status_label(ouverture: float) -> str:
    """Retourne le label d'état de la vanne."""
    if ouverture <= 0.0:
        return "Fermée"
    elif ouverture < 0.3:
        return "Ouverture progressive"
    elif ouverture < 0.6:
        return "Ouverture modérée"
    elif ouverture < 1.0:
        return "Ouverture forte"
    else:
        return "Ouverture maximale"


def get_decision_reason(niveau_actuel: float, niveau_predit: float) -> str:
    """Retourne l'explication de la décision."""
    if niveau_actuel > H_CRIT or niveau_predit > H_CRIT:
        return "Niveau critique détecté – ouverture d'urgence"
    elif niveau_actuel > H_ALERTE:
        return "Niveau en alerte – ouverture moyenne activée"
    elif niveau_predit > H_ALERTE:
        return "Risque futur détecté (prédiction 5h) – ouverture préventive"
    else:
        return "Situation normale – vanne fermée"


def compute_valve_decision(niveau_actuel: float, niveau_predit: float) -> Dict[str, Any]:
    """
    Calcule la décision de pilotage en mode automatique.
    Applique le lissage et met à jour l'état global.
    """
    global _valve_state

    if _valve_state["mode"] == "manuel":
        return get_current_state(niveau_actuel, niveau_predit)

    u_target = decision(niveau_actuel, niveau_predit)
    u_prev = _valve_state["ouverture"]

    # Détection urgence – bypass du dwell
    urgence = (niveau_actuel > H_CRIT or niveau_predit > H_CRIT)

    step = _valve_state["last_change_step"] + 1

    if urgence or (step >= DWELL_STEPS):
        u_new = smooth_action(u_target, u_prev)
        if abs(u_new - u_prev) > 1e-6:
            _valve_state["last_change_step"] = 0
        else:
            _valve_state["last_change_step"] = step
    else:
        u_new = u_prev
        _valve_state["last_change_step"] = step

    u_new = round(u_new, 2)
    _valve_state["ouverture"] = u_new

    # Historique (garder les 50 derniers)
    _valve_state["historique"].append({
        "ouverture": u_new,
        "niveau_actuel": round(niveau_actuel, 4),
        "niveau_predit": round(niveau_predit, 4),
        "cible": round(u_target, 2),
    })
    if len(_valve_state["historique"]) > 50:
        _valve_state["historique"] = _valve_state["historique"][-50:]

    return get_current_state(niveau_actuel, niveau_predit)


def get_current_state(niveau_actuel: float = 0.0, niveau_predit: float = 0.0) -> Dict[str, Any]:
    """Retourne l'état complet actuel de la vanne."""
    ouverture = _valve_state["ouverture"]
    return {
        "ouverture": ouverture,
        "ouverture_pct": round(ouverture * 100, 1),
        "status_label": get_valve_status_label(ouverture),
        "mode": _valve_state["mode"],
        "decision_reason": get_decision_reason(niveau_actuel, niveau_predit),
        "seuils": {
            "H_normal": H_NORMAL,
            "H_alerte": H_ALERTE,
            "H_crit": H_CRIT,
        },
        "parametres": {
            "max_delta": MAX_DELTA,
            "dwell_steps": DWELL_STEPS,
        },
        "historique": _valve_state["historique"][-20:],
    }


def set_manual_valve(ouverture: float) -> Dict[str, Any]:
    """
    Passe la vanne en mode manuel avec l'ouverture spécifiée.
    """
    global _valve_state
    ouverture = float(np.clip(ouverture, 0.0, 1.0))
    _valve_state["mode"] = "manuel"
    _valve_state["ouverture"] = round(ouverture, 2)
    _valve_state["historique"].append({
        "ouverture": _valve_state["ouverture"],
        "niveau_actuel": 0.0,
        "niveau_predit": 0.0,
        "cible": _valve_state["ouverture"],
    })
    if len(_valve_state["historique"]) > 50:
        _valve_state["historique"] = _valve_state["historique"][-50:]
    return get_current_state()


def set_auto_mode() -> Dict[str, Any]:
    """Repasse la vanne en mode automatique."""
    global _valve_state
    _valve_state["mode"] = "auto"
    _valve_state["last_change_step"] = 0
    return get_current_state()


def simulate_scenario(observations_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Simule les décisions de vanne sur un historique d'observations.
    Utile pour visualiser comment le système aurait réagi.
    """
    results = []
    u_prev = 0.0
    last_change = -DWELL_STEPS

    for i, row in observations_df.iterrows():
        niveau = float(row.get("niveau_cours_eau_m", 0))
        prediction = float(row.get("prediction_5h", row.get("niveau_cours_eau_m", 0)))

        u_target = decision(niveau, prediction)
        urgence = (niveau > H_CRIT or prediction > H_CRIT)

        if urgence or (i - last_change >= DWELL_STEPS):
            u_new = smooth_action(u_target, u_prev)
            if abs(u_new - u_prev) > 1e-6:
                last_change = i
        else:
            u_new = u_prev

        u_new = round(float(np.clip(u_new, 0.0, 1.0)), 2)
        results.append({
            "step": int(i),
            "niveau_cours_eau_m": round(niveau, 4),
            "prediction_5h": round(prediction, 4),
            "ouverture_vanne": u_new,
            "cible": round(u_target, 2),
            "status": get_valve_status_label(u_new),
        })
        u_prev = u_new

    return results
