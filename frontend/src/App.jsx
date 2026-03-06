import React, { useEffect, useState, useRef, useCallback } from "react";
import Dashboard from "./components/Dashboard.jsx";

const API_BASE_URL = "http://localhost:8000";

async function fetchObservations() {
  const res = await fetch(`${API_BASE_URL}/api/observations?limit=5000&range=all`);
  if (!res.ok) throw new Error(`Erreur HTTP observations: ${res.status}`);
  return res.json();
}

async function fetchPredictions() {
  const res = await fetch(`${API_BASE_URL}/api/predictions`);
  if (!res.ok) throw new Error(`Erreur HTTP prédictions: ${res.status}`);
  return res.json();
}

export default function App() {
  const [observations, setObservations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("1d");

  const intervalRef = useRef(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [obsData, predData] = await Promise.all([
        fetchObservations(),
        fetchPredictions(),
      ]);
      setObservations(obsData || []);
      setPredictions(predData?.predictions || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors du chargement des données.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 30000);
    return () => clearInterval(intervalRef.current);
  }, [loadData]);

  return (
    <Dashboard
      observations={observations}
      predictions={predictions}
      lastUpdate={lastUpdate}
      isLoading={isLoading}
      error={error}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
    />
  );
}

