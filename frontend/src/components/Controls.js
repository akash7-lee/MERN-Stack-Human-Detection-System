
import React, { useRef } from 'react';

const Controls = ({ model, detectionMode, setDetectionMode, setStats, onSaveDetection }) => {
  const fileInputRef = useRef(null);

  const handleWebcam = () => {
    console.log('Webcam button clicked!'); // Debug log
    setDetectionMode('webcam');
  };

  const handleStop = () => {
    console.log('Stop button clicked!'); // Debug log
    setDetectionMode('stopped');
    setStats({ peopleCount: 0, confidence: 0, fps: 0 });
  };

  const handleImageUpload = async (e) => {
    console.log('File selected!'); // Debug log
    const file = e.target.files[0];
    if (!file) return;

    if (!model) {
      alert('⏳ Model is still loading. Please wait and try again.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
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

          alert(`✅ Detected ${people.length} person(s) and saved to database!`);
          e.target.value = '';
        } catch (error) {
          console.error('Detection error:', error);
          alert('❌ Error detecting people in image. Please try again.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="controls">
      <button 
        onClick={handleWebcam} 
        disabled={detectionMode === 'webcam' || !model}
        style={{ pointerEvents: 'auto' }}
      >
        📹 Start Webcam
      </button>
      <button 
        onClick={handleStop} 
        disabled={detectionMode !== 'webcam'}
        style={{ pointerEvents: 'auto' }}
      >
        ⏹️ Stop
      </button>
      <button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={!model}
        style={{ pointerEvents: 'auto' }}
      >
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

export default Controls;