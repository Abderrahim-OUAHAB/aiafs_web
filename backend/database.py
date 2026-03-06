from sqlalchemy import create_engine
import pandas as pd
from typing import Optional

DB_CONFIG = {
    'host': 'localhost',
    'database': 'aiafs_db',
    'user': 'postgres',
    'password': 'root',
    'port': '5432'
}

TABLE_NAME = "donnees_modele_1"

RANGE_INTERVALS = {
    "1h": "1 hour",
    "6h": "6 hours",
    "1d": "1 day",
    "1w": "7 days",
}


def connect_to_postgresql():
    """
    Crée et retourne un engine SQLAlchemy vers PostgreSQL.
    """
    try:
        connection_string = (
            f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
            f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        )
        engine = create_engine(connection_string)
        return engine
    except Exception as e:
        print(f"Erreur de connexion : {e}")
        return None


def get_latest_observations(limit: int = 500, time_range: str = "all") -> pd.DataFrame:
    """
    Récupère les observations les plus récentes.
    time_range: "1h", "6h", "1d", "1w", "all"
    """
    engine = connect_to_postgresql()
    if engine is None:
        raise RuntimeError("Impossible de se connecter à PostgreSQL.")

    if time_range in RANGE_INTERVALS:
        interval = RANGE_INTERVALS[time_range]
        query = f"""
            SELECT date_mesure, debit_cours_eau_m3s, niveau_cours_eau_m, precipitation, maree
            FROM {TABLE_NAME}
            WHERE date_mesure >= (SELECT MAX(date_mesure) FROM {TABLE_NAME}) - INTERVAL '{interval}'
            ORDER BY date_mesure ASC
        """
    else:
        query = f"""
            SELECT date_mesure, debit_cours_eau_m3s, niveau_cours_eau_m, precipitation, maree
            FROM (
                SELECT date_mesure, debit_cours_eau_m3s, niveau_cours_eau_m, precipitation, maree
                FROM {TABLE_NAME}
                ORDER BY date_mesure DESC
                LIMIT {int(limit)}
            ) sub
            ORDER BY date_mesure ASC
        """

    df = pd.read_sql(query, con=engine)
    df = df.sort_values("date_mesure").reset_index(drop=True)
    return df


def get_latest_observation() -> Optional[pd.DataFrame]:
    """
    Récupère la DERNIÈRE ligne brute de la table (1 seule observation).
    Retourne un DataFrame d'une seule ligne ou None si aucun résultat.
    """
    engine = connect_to_postgresql()
    if engine is None:
        raise RuntimeError("Impossible de se connecter à PostgreSQL.")

    query = f"""
        SELECT
            date_mesure,
            debit_cours_eau_m3s,
            niveau_cours_eau_m,
            precipitation,
            maree
        FROM {TABLE_NAME}
        ORDER BY date_mesure DESC
        LIMIT 1
    """

    df = pd.read_sql(query, con=engine)

    if df.empty:
        return None

    return df.reset_index(drop=True)

