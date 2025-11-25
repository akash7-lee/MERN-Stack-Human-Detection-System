import React, { useRef, useEffect, useState } from 'react';

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
      
      const label = `Person ${Math.round(prediction.score * 100)}%`;
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

export default DetectionCanvas;