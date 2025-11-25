const fs = require('fs');
const path = require('path');

console.log('🚀 Creating MERN Stack Human Detection Project...\n');

// Project structure
const projectName = 'human-detection-mern';
const structure = {
  backend: {
    models: {},
    routes: {},
  },
  frontend: {
    public: {},
    src: {
      components: {},
      services: {},
    },
  },
};

// File contents
const files = {
  // Backend files
  'backend/.env': `PORT=5000
MONGODB_URI=mongodb://localhost:27017/human-detection`,

  'backend/package.json': `{
  "name": "human-detection-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "nodemon": "^3.0.1"
  }
}`,

  'backend/server.js': `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/detections', require('./routes/detections'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Human Detection API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});`,

  'backend/models/Detection.js': `const mongoose = require('mongoose');

const DetectionSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  peopleCount: {
    type: Number,
    required: true
  },
  detections: [{
    bbox: [Number],
    score: Number,
    class: String
  }],
  avgConfidence: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Detection', DetectionSchema);`,

  'backend/routes/detections.js': `const express = require('express');
const router = express.Router();
const Detection = require('../models/Detection');

// Get all detections
router.get('/', async (req, res) => {
  try {
    const detections = await Detection.find().sort({ timestamp: -1 }).limit(50);
    res.json(detections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get detection by ID
router.get('/:id', async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id);
    if (!detection) {
      return res.status(404).json({ message: 'Detection not found' });
    }
    res.json(detection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new detection
router.post('/', async (req, res) => {
  const detection = new Detection({
    imageUrl: req.body.imageUrl,
    peopleCount: req.body.peopleCount,
    detections: req.body.detections,
    avgConfidence: req.body.avgConfidence
  });

  try {
    const newDetection = await detection.save();
    res.status(201).json(newDetection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete detection
router.delete('/:id', async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id);
    if (!detection) {
      return res.status(404).json({ message: 'Detection not found' });
    }
    await detection.deleteOne();
    res.json({ message: 'Detection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalDetections = await Detection.countDocuments();
    const avgPeople = await Detection.aggregate([
      { $group: { _id: null, avgCount: { $avg: '$peopleCount' } } }
    ]);
    
    res.json({
      totalDetections,
      avgPeoplePerDetection: avgPeople[0]?.avgCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;`,

  // Frontend files
  'frontend/package.json': `{
  "name": "human-detection-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@tensorflow-models/coco-ssd": "^2.2.3",
    "@tensorflow/tfjs": "^4.11.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,

  'frontend/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="MERN Stack Human Detection System" />
    <title>Human Detection System</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,

  'frontend/src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  'frontend/src/App.js': `import React, { useState, useEffect } from 'react';
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

export default App;`,

  'frontend/src/App.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.App {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.App-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.App-header h1 {
  color: #333;
  font-size: 2.5em;
  margin-bottom: 10px;
}

.App-header p {
  color: #666;
  font-size: 1.2em;
}

.App-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
}

.loading {
  background: white;
  border-radius: 20px;
  padding: 60px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.controls {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.controls button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.controls button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.canvas-container {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  min-height: 400px;
  align-items: center;
}

.canvas-container canvas {
  max-width: 100%;
  border-radius: 15px;
}

.stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-box {
  background: white;
  padding: 25px;
  border-radius: 15px;
  text-align: center;
  min-width: 150px;
  flex: 1;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 1em;
  color: #666;
}

.history-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.history-section h2 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.history-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.history-card p {
  margin: 8px 0;
  font-size: 1.1em;
}

.history-count {
  font-size: 1.3em !important;
  font-weight: bold;
}`,

  'frontend/src/components/DetectionCanvas.js': `import React, { useRef, useEffect, useState } from 'react';

const DetectionCanvas = ({ model, detectionMode, setStats }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [stream, setStream] = useState(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (detectionMode === 'webcam') {
      startWebcam();
    } else if (detectionMode === 'stopped') {
      stopDetection();
    }
    return () => stopDetection();
  }, [detectionMode]);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      videoRef.current.onloadedmetadata = () => {
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        detectFrame();
      };
    } catch (error) {
      console.error('Camera error:', error);
      alert('Camera access denied');
    }
  };

  const stopDetection = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const detectFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!video || !canvas || !model) return;

    const startTime = performance.now();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const predictions = await model.detect(canvas);
    const people = predictions.filter(p => p.class === 'person');

    drawPredictions(ctx, people);
    
    const fps = Math.round(1000 / (performance.now() - startTime));
    const avgConfidence = people.length > 0
      ? people.reduce((sum, p) => sum + p.score, 0) / people.length
      : 0;

    setStats({
      peopleCount: people.length,
      confidence: Math.round(avgConfidence * 100),
      fps
    });

    animationRef.current = requestAnimationFrame(detectFrame);
  };

  const drawPredictions = (ctx, predictions) => {
    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      const label = \`Person \${Math.round(prediction.score * 100)}%\`;
      ctx.font = 'bold 18px Arial';
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x, y - 30, textWidth + 10, 30);
      
      ctx.fillStyle = '#000000';
      ctx.fillText(label, x + 5, y - 8);
    });
  };

  return (
    <div className="canvas-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      <img ref={imageRef} alt="" style={{ display: 'none' }} />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default DetectionCanvas;`,

  'frontend/src/components/Controls.js': `import React, { useRef } from 'react';

const Controls = ({ model, detectionMode, setDetectionMode, setStats, onSaveDetection }) => {
  const fileInputRef = useRef(null);

  const handleWebcam = () => {
    setDetectionMode('webcam');
  };

  const handleStop = () => {
    setDetectionMode('stopped');
    setStats({ peopleCount: 0, confidence: 0, fps: 0 });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const predictions = await model.detect(canvas);
        const people = predictions.filter(p => p.class === 'person');
        
        const avgConfidence = people.length > 0
          ? people.reduce((sum, p) => sum + p.score, 0) / people.length
          : 0;

        await onSaveDetection({
          imageUrl: event.target.result,
          peopleCount: people.length,
          detections: people,
          avgConfidence: avgConfidence * 100
        });

        alert(\`Detected \${people.length} person(s) and saved to database!\`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="controls">
      <button onClick={handleWebcam} disabled={detectionMode === 'webcam'}>
        📹 Start Webcam
      </button>
      <button onClick={handleStop} disabled={detectionMode !== 'webcam'}>
        ⏹️ Stop
      </button>
      <button onClick={() => fileInputRef.current.click()}>
        📁 Upload Image
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Controls;`,

  'frontend/src/components/Stats.js': `import React from 'react';

const Stats = ({ stats }) => {
  return (
    <div className="stats">
      <div className="stat-box">
        <div className="stat-number">{stats.peopleCount}</div>
        <div className="stat-label">People Detected</div>
      </div>
      <div className="stat-box">
        <div className="stat-number">{stats.confidence}%</div>
        <div className="stat-label">Avg Confidence</div>
      </div>
      <div className="stat-box">
        <div className="stat-number">{stats.fps}</div>
        <div className="stat-label">FPS</div>
      </div>
    </div>
  );
};

export default Stats;`,

  'frontend/src/services/api.js': `import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getDetections = async () => {
  const response = await axios.get(\`\${API_URL}/detections\`);
  return response.data;
};

export const saveDetection = async (detectionData) => {
  const response = await axios.post(\`\${API_URL}/detections\`, detectionData);
  return response.data;
};

export const deleteDetection = async (id) => {
  const response = await axios.delete(\`\${API_URL}/detections/\${id}\`);
  return response.data;
};`,

  'README.md': `# MERN Stack Human Detection System

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- MongoDB installed and running

### Installation

1. **Install Backend Dependencies**
\`\`\`bash
cd backend
npm install
\`\`\`

2. **Install Frontend Dependencies**
\`\`\`bash
cd ../frontend
npm install
\`\`\`

### Running the Application

1. **Start MongoDB** (if not running)
\`\`\`bash
mongod
\`\`\`

2. **Start Backend Server**
\`\`\`bash
cd backend
npm run dev
\`\`\`

3. **Start Frontend** (in new terminal)
\`\`\`bash
cd frontend
npm start
\`\`\`

4. **Open Browser**
Navigate to: http://localhost:3000

## ✨ Features
- Real-time webcam detection
- Image upload and analysis
- MongoDB integration
- Detection history
- Live statistics

## 🛠️ Tech Stack
- MongoDB
- Express.js
- React.js
- Node.js
- TensorFlow.js

Enjoy! 🎯`,
};

// Function to create directory structure
function createStructure(basePath, structure) {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(basePath, key);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created: ${fullPath}`);
    }
    if (typeof value === 'object' && Object.keys(value).length > 0) {
      createStructure(fullPath, value);
    }
  }
}

// Function to create files
function createFiles(basePath, files) {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(basePath, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created: ${fullPath}`);
  }
}

// Main execution
try {
  // Create main project directory
  if (!fs.existsSync(projectName)) {
    fs.mkdirSync(projectName);
    console.log(`📁 Created: ${projectName}\n`);
  }

  // Create directory structure
  createStructure(projectName, structure);
  console.log('\n');

  // Create all files
  createFiles(projectName, files);

  console.log('\n✨ Project setup complete!\n');
  console.log('📋 Next steps:\n');
  console.log('1. Make sure MongoDB is installed and running');
  console.log('2. cd human-detection-mern/backend && npm install');
  console.log('3. cd ../frontend && npm install');
  console.log('4. In backend folder: npm run dev');
  console.log('5. In frontend folder (new terminal): npm start');
  console.log('\n🎉 Happy coding!\n');

} catch (error) {
  console.error('❌ Error creating project:', error);
}