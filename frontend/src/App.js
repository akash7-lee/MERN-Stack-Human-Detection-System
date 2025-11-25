import React, { useState, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import DetectionCanvas from './components/DetectionCanvas';
import Controls from './components/Controls';
import Stats from './components/Stats';
import { saveDetection, getDetections } from './services/api';
import './App.css';

function App() {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectionMode, setDetectionMode] = useState(null);
  const [stats, setStats] = useState({
    peopleCount: 0,
    confidence: 0,
    fps: 0
  });
  const [detectionHistory, setDetectionHistory] = useState([]);

  useEffect(() => {
    loadModel();
    fetchDetectionHistory();
  }, []);

  const loadModel = async () => {
    try {
      setLoading(true);
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      setLoading(false);
    } catch (error) {
      console.error('Error loading model:', error);
      setLoading(false);
    }
  };

  const fetchDetectionHistory = async () => {
    try {
      const data = await getDetections();
      setDetectionHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleSaveDetection = async (detectionData) => {
    try {
      await saveDetection(detectionData);
      fetchDetectionHistory();
    } catch (error) {
      console.error('Error saving detection:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎯 MERN Stack Human Detection</h1>
        <p>Real-time AI-powered person detection</p>
      </header>

      <main className="App-main">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading AI Model...</p>
          </div>
        ) : (
          <>
            <Controls
              model={model}
              detectionMode={detectionMode}
              setDetectionMode={setDetectionMode}
              setStats={setStats}
              onSaveDetection={handleSaveDetection}
            />

            <DetectionCanvas
              model={model}
              detectionMode={detectionMode}
              setStats={setStats}
            />

            <Stats stats={stats} />

            <div className="history-section">
              <h2>Detection History</h2>
              <div className="history-grid">
                {detectionHistory.slice(0, 10).map((detection) => (
                  <div key={detection._id} className="history-card">
                    <p className="history-count">
                      👥 {detection.peopleCount} person(s)
                    </p>
                    <p className="history-confidence">
                      📊 {Math.round(detection.avgConfidence)}% confidence
                    </p>
                    <p className="history-time">
                      🕒 {new Date(detection.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;