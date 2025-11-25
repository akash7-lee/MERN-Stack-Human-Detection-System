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
  const [loadingStatus, setLoadingStatus] = useState('Initializing TensorFlow...');
  const [detectionMode, setDetectionMode] = useState(null);
  const [stats, setStats] = useState({
    peopleCount: 0,
    confidence: 0,
    fps: 0
  });
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    loadModel();
    checkBackendConnection();
  }, []);

  const loadModel = async () => {
    try {
      setLoading(true);
      setLoadingStatus('Loading TensorFlow backend...');
      
      // Wait for TensorFlow to be ready
      await window.tf.ready();
      console.log('✅ TensorFlow backend ready');
      
      setLoadingStatus('Loading AI Model...');
      const loadedModel = await cocoSsd.load();
      console.log('✅ Model loaded successfully');
      
      setModel(loadedModel);
      setLoading(false);
      setLoadingStatus('Model Ready!');
    } catch (error) {
      console.error('Error loading model:', error);
      setLoadingStatus('Error loading model. Please refresh the page.');
      setLoading(false);
    }
  };

  const checkBackendConnection = async () => {
    try {
      const data = await getDetections();
      setDetectionHistory(data);
      setBackendConnected(true);
      console.log('✅ Backend connected');
    } catch (error) {
      console.warn('⚠️ Backend not connected. Running in offline mode.');
      setBackendConnected(false);
    }
  };

  const fetchDetectionHistory = async () => {
    if (!backendConnected) return;
    
    try {
      const data = await getDetections();
      setDetectionHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleSaveDetection = async (detectionData) => {
    if (!backendConnected) {
      console.warn('⚠️ Backend not connected. Detection not saved.');
      return;
    }

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
        {!backendConnected && (
          <p style={{ 
            color: '#ff9800', 
            fontSize: '0.9em', 
            marginTop: '10px',
            background: '#fff3e0',
            padding: '8px 15px',
            borderRadius: '5px',
            display: 'inline-block'
          }}>
            ⚠️ Running in offline mode - Backend not connected
          </p>
        )}
      </header>

      <main className="App-main">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>{loadingStatus}</p>
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

            {backendConnected && detectionHistory.length > 0 && (
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
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;