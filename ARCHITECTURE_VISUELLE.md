# 🎨 Architecture Visuelle - Système AIAFS Amélioré

## Diagramme Complet du Système

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    COUCHE DONNEES                           ┃
┃               PostgreSQL - donnees_modele_1                 ┃
┃   (date_mesure, debit_cours_eau_m3s, niveau_cours_eau_m,   ┃
┃    precipitation, maree)                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   COUCHE BACKEND (FastAPI)                  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  ENDPOINT                   │  FONCTION              │ FILE  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  GET /api/observations      │  get_latest_obs(500)   │ db.py ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  GET /api/predictions       │  predict_future_levels │ ml.py ┃
┃  (historique → RF model)    │  _from_history()       │       ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  GET /api/model/info        │  get_model_info()      │ ml.py ┃
┃  (infos + importance)       │                        │ [NEW] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  GET /api/model/performance │  get_model_            │ ml.py ┃
┃  (metrics + avantages)      │  performance_metrics() │ [NEW] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  GET /api/model/comparisons │  (return dict dans     │ main. ┃
┃  (comparaison RF/GB/XGB)    │   main.py)             │ py    ┃
┃                             │                        │ [NEW] ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          ▼
        ┌─────────────────────────────────────┐
        │     RANDOM FOREST MODEL             │
        │  modèle_1_rf_aiafs.pkl             │
        │                                     │
        │ Features:                          │
        │ ├─ Lags (1-5)                      │
        │ ├─ Rolling means (60,120,240)      │
        │ ├─ Dérivative                      │
        │ ├─ Precip cumulative               │
        │ └─ Temporal (hour, month)          │
        │                                     │
        │ Type: Regression                   │
        │ Horizon: 5 heures                  │
        │ R² ≈ 0.75                          │
        └─────────────────────────────────────┘
                          ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 COUCHE FRONTEND (React)                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃              DASHBOARD LAYOUT (App.jsx → Dashboard.jsx)      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  ┌──────────────────────────────────────────────────────┐  ┃
┃  │ HEADER: AIAFS Dashboard - La Liane                    │  ┃
┃  └──────────────────────────────────────────────────────┘  ┃
┃                                                              ┃
┃  ┌──────────────────────────┐ ┌──────────────────────────┐  ┃
┃  │                          │ │                          │  ┃
┃  │ WaterLevelChart          │ │ AlertPanel               │  ┃
┃  │ (historique + courbe)    │ │ (statut actuel)          │  ┃
┃  │ Utilise: /api/obs +      │ │ Niveau: X.XXX m          │  ┃
┃  │          /api/pred       │ │ Max prévu: X.XXX m       │  ┃
┃  │                          │ │ Status: Normal/Alerte    │  ┃
┃  └──────────────────────────┘ └──────────────────────────┘  ┃
┃                                                              ┃
┃  ┌──────────────────────────┐ ┌──────────────────────────┐  ┃
┃  │                          │ │                          │  ┃
┃  │ ForecastDetails [NEW]    │ │ ModelPerformance [NEW]   │  ┃
┃  │                          │ │                          │  ┃
┃  │ • T+1h: 3.102m ↓ Normal  │ │ TABS:                    │  ┃
┃  │ • T+2h: 3.187m ↑ Vigilme │ │ ├─ Performance           │  ┃
┃  │ • T+3h: 3.421m ↑ Vigilme │ │ │  (R²=0.75, Avantages) │  ┃
┃  │ • T+4h: 3.356m ↓ Vigilme │ │ ├─ Features Importance   │  ┃
┃  │ • T+5h: 3.298m ↓ Normal  │ │ │  (Top 5 features)     │  ┃
┃  │                          │ │ └─ Comparisons           │  ┃
┃  │ Stat: Min/Moy/Max        │ │    (RF vs GB/XGB/LSTM)   │  ┃
┃  │ Utilise: /api/pred       │ │ Utilise: 3 endpoints API │  ┃
┃  │                          │ │                          │  ┃
┃  └──────────────────────────┘ └──────────────────────────┘  ┃
┃                                                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Composants Frontend - Détail

### 1️⃣ WaterLevelChart (Original)

```
┌─────────────────────────────────────────────────┐
│ Niveau de la Liane (Historique & Prévisions)   │
├─────────────────────────────────────────────────┤
│                                                 │
│      Graphique Recharts                        │
│      ├─ Ligne Bleue : Historique               │
│      ├─ Ligne Pointillée Rouge : Prédictions   │
│      ├─ Ligne Orange : Seuil Vigilance (3.0m)  │
│      └─ Ligne Rouge : Seuil Alerte (3.8m)      │
│                                                 │
│      X: Timestamps                             │
│      Y: Niveau (m)                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2️⃣ AlertPanel (Original)

```
┌─────────────────────────────────────────────────┐
│ Statut Hydrologique                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Niveau Actuel      │ Max Prévu (5h) │ Status  │
│ ═════════════════  │ ══════════════ │ ═════  │
│ X.XXX m            │ X.XXX m        │ ✓      │
│                    │                │ Normal │
│                                                 │
│ Seuils: 3.0m (Vigilance) · 3.8m (Alerte)      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3️⃣ ForecastDetails [NEW]

```
┌─────────────────────────────────────────────────┐
│ 🕐 Prévisions Horaires (Random Forest +5h)     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Min: X.XXXm  │  Moy: X.XXXm  │  Max: X.XXXm  │
│                                                 │
│ T+1h │ 03:30 │ 3.102m │ ↓ │ ✓ Normal          │
│ ☆☆☆☆░░░░░░░░░░░░░░░░░░│                     │
│ 0m      3.0m      3.8m                        │
│                                                 │
│ T+2h │ 04:30 │ 3.187m │ ↑ │ 🟠 Vigilance      │
│ ☆☆☆☆☆☆░░░░░ │                                │
│                                                 │
│ T+3h │ 05:30 │ 3.421m │ ↑ │ 🟠 Vigilance ←Pic │
│ ☆☆☆☆☆☆☆░░  │                                │
│                                                 │
│ T+4h │ 06:30 │ 3.356m │ ↓ │ 🟠 Vigilance      │
│ ☆☆☆☆☆☆░░░░ │                                │
│                                                 │
│ T+5h │ 07:30 │ 3.298m │ ↓ │ ✓ Normal          │
│ ☆☆☆☆☆░░░░░░ │                                │
│                                                 │
│ 💡 Modèle: Random Forest | Horizon: 5h       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4️⃣ ModelPerformance [NEW]

#### TAB 1: Performance

```
┌─────────────────────────────────────────────────┐
│ 📊 Modèle AI - Random Forest                   │
├──────┬──────────┬──────────────────────────────┤
│ Perf │ Features │ Comparaisons                 │
├──────┴──────────┴──────────────────────────────┤
│                                                 │
│ Modèle: Random Forest Regressor                │
│ Horizon: 5 heures (T+5h)                       │
│                                                 │
│ R² Score: 0.75 │ Confiance: Élevée            │
│                                                 │
│ Avantages du Random Forest:                    │
│ ✓ Non-sensible aux valeurs aberrantes         │
│ ✓ Capture les relations non-linéaires         │
│ ✓ Peu de data preprocessing requis            │
│ ✓ Très bon pour séries temporelles complexes  │
│ ✓ Fournit l'importance des features           │
│                                                 │
│ Contribution des Features:                     │
│ Primaire: Lags du niveau (passé proche)       │
│ Secondaire: Moyennes roulantes et dérivées    │
│ Tertiaire: Accumulations de précipitation     │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### TAB 2: Features Importance

```
┌─────────────────────────────────────────────────┐
│ 🔥 Top 5 Features les Plus Importantes         │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. niveau_lag_1                   25.34%      │
│    ████████░░░░░░░░░░░░           │
│                                                 │
│ 2. niveau_roll_mean_60            18.92%      │
│    ██████░░░░░░░░░░░░░░░░░░       │
│                                                 │
│ 3. derivee_niveau                 12.45%      │
│    ████░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                 │
│ 4. precip_cum_6h                  10.87%      │
│    ███░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                 │
│ 5. niveau_lag_2                    8.92%      │
│    ███░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                 │
│ Ces features influencent les prédictions      │
│ RF pour l'horizon 5 heures                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### TAB 3: Comparaisons

```
┌─────────────────────────────────────────────────┐
│ ✓ Modèle Sélectionné: Random Forest            │
│                                                 │
│ Critères de sélection:                        │
│ • Performance équilibrée (R² = 0.75)          │
│ • Robustesse aux valeurs aberrantes           │
│ • Interprétabilité (importance des features)  │
│ • Efficacité computationnelle en production   │
│ • Stabilité sur horizons longs (5h)           │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Random Forest        R² 0.75  [Sélectionné ✓] │
│ Gradient Boosting    R² 0.72  [Alternatif]    │
│ XGBoost              R² 0.70  [Alternatif]    │
│ LSTM                 R² 0.73  [Alternatif]    │
│                                                 │
│ Raisons du choix RF:                          │
│ • Meilleur rapport performance/robustesse     │
│ • Stabilité sur long terme                    │
│ • Expliquabilité supérieure                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Flux de Données Complet

```
1. APP.JSX (loadData)
   │
   └─→ Promise.all([
        fetchObservations(),
        fetchPredictions()
       ])
       │
       ├─→ GET /api/observations → [historique]
       │
       └─→ GET /api/predictions → [5 prédictions]
           │
           ├─→ Récupère 500 historiques
           ├─→ Feature engineering (lags, rolling)
           ├─→ RF model.predict() 5 fois itérativement
           └─→ Extrait T+1h, T+2h, ..., T+5h

2. DASHBOARD.JSX
   │
   ├─→ WaterLevelChart (observations + predictions)
   ├─→ AlertPanel (currentLevel, maxPredicted)
   ├─→ ForecastDetails (predictions) [NEW]
   │
   └─→ ModelPerformance [NEW]
       │
       ├─→ GET /api/model/info
       │   ├─ feature_names
       │   ├─ feature_importance
       │   └─ top_5_features
       │
       ├─→ GET /api/model/performance
       │   ├─ metrics (R², RMSE, MAE)
       │   └─ model_characteristics
       │
       └─→ GET /api/model/comparisons
           ├─ comparison list
           └─ selection_criteria
```

---

## Seuils d'Alerte

```
┌─────────────────────────────────────────────────┐
│           NIVEAU D'EAU (m)                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ > 3.8m  │ 🔴 ALERTE                            │
│         │ Risque de débordement imminent       │
│ ───────────────────────────────────────────   │
│                                                 │
│ 3.0-3.8 │ 🟠 VIGILANCE                         │
│         │ Situation à surveiller               │
│ ───────────────────────────────────────────   │
│                                                 │
│ < 3.0   │ ✅ NORMAL                            │
│         │ Situation sous contrôle              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Interactions Utilisateur

### 1. Chargement Initial
```
[App charge] → API observations + predictions
             → Dashboard render avec 4 composants
             → ModelPerformance récupère 3 endpoints
```

### 2. Consultation
```
Utilisateur regarde:
├─ WaterLevelChart : Voit la tendance globale
├─ AlertPanel : Voit le statut actuel
├─ ForecastDetails : Voit heure par heure
└─ ModelPerformance:
   ├─ Tab Performance: Comprend pourquoi RF
   ├─ Tab Features: Voit quelles données influencent
   └─ Tab Comparisons: Voit pourquoi RF > autres
```

### 3. Mise à Jour
```
Chaque 30 secondes (interval App.jsx):
└─ Appelle loadData()
   ├─ Récupère observations fraîches
   ├─ Récupère predictions fraîches
   ├─ UpdateState (observations, predictions)
   └─ Composants se re-render avec nouvelles données
```

---

**Architecture complète, transparente et exploitant pleinement le Random Forest ! 🎉**
