from sqlalchemy import create_engine
import pandas as pd
from typing import Optional

DB_CONFIG = {
    'host': 'localhost',
    'database': 'aiafs_db',
    'user': 'postgres',
    'password': 'wahhab',
    'port': '5432'
}

TABLE_NAME = "donnees_modele_1"


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


def get_latest_observations(limit: int = 200) -> pd.DataFrame:
    """
    Récupère les dernières observations brutes depuis la table,
    triées par date_mesure croissante.

    AUCUN traitement supplémentaire n'est appliqué.
    """
    engine = connect_to_postgresql()
    if engine is None:
        raise RuntimeError("Impossible de se connecter à PostgreSQL.")
    '''
    query = f"""
        SELECT
            date_mesure,
            debit_cours_eau_m3s,
            niveau_cours_eau_m,
            precipitation,
            maree
        FROM {TABLE_NAME}
        ORDER BY date_mesure DESC
        LIMIT {limit}
    """
    '''
    query = f"""
    SELECT
        date_mesure,
        debit_cours_eau_m3s,
        niveau_cours_eau_m,
        precipitation,
        maree
    FROM {TABLE_NAME}
    WHERE date_mesure BETWEEN '2026-01-13' AND '2026-01-30'
    ORDER BY date_mesure ASC
    """

    df = pd.read_sql(query, con=engine)
    # On réinverse pour avoir du plus ancien au plus récent dans l'API
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

