import React, { useEffect, useState, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ForecastDetails from "./components/ForecastDetails.jsx";
import StationMap from "./components/StationMap.jsx";
import ValvePiloting from "./components/ValvePiloting.jsx";
import ModelPerformance from "./components/ModelPerformance.jsx";
import SimulationPage from "./components/SimulationPage.jsx";
import ReportsPage from "./components/ReportsPage.jsx";

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

function DataProvider({ children }) {
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

  const currentLevel =
    observations.length > 0
      ? observations[observations.length - 1].niveau_cours_eau_m
      : null;

  const maxPredicted =
    predictions.length > 0
      ? Math.max(
          ...predictions
            .map((p) => p.predicted_niveau_cours_eau_m)
            .filter((v) => v != null)
        )
      : null;

  const props = {
    observations,
    predictions,
    lastUpdate,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    currentLevel,
    maxPredicted,
  };

  return children(props);
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        {(data) => (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<Layout />}>
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    observations={data.observations}
                    predictions={data.predictions}
                    lastUpdate={data.lastUpdate}
                    isLoading={data.isLoading}
                    error={data.error}
                    timeRange={data.timeRange}
                    setTimeRange={data.setTimeRange}
                  />
                }
              />
              <Route
                path="/forecasts"
                element={<ForecastDetails predictions={data.predictions} />}
              />
              <Route
                path="/map"
                element={
                  <StationMap
                    currentLevel={data.currentLevel}
                    maxPredicted={data.maxPredicted}
                    lastUpdate={data.lastUpdate}
                    predictions={data.predictions}
                  />
                }
              />
              <Route path="/valves" element={<ValvePiloting />} />
              <Route path="/model" element={<ModelPerformance />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </DataProvider>
    </BrowserRouter>
  );
}

