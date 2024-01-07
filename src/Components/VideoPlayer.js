import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models/weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models/weights');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models/weights');
    };

    const detectFaces = async () => {
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512 });
      const result = await faceapi.detectAllFaces(videoRef.current, options).withFaceLandmarks().withFaceDescriptors();
      return result.map((face) => ({
        box: face.detection.box,
      }));
    };

    const handleVideoTimeUpdate = async () => {
      if (videoRef.current && canvasRef.current) {
        const faces = await detectFaces();
        const ctx = canvasRef.current.getContext('2d');

        canvasRef.current.width = videoRef.current.clientWidth;
        canvasRef.current.height = videoRef.current.clientHeight;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (faces.length > 0) {
          setFaceDetected(true);

          faces.forEach((face) => {
            const { x, y, width, height } = face.box;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';
            ctx.stroke();
            ctx.closePath();
          });
        } else {
          setFaceDetected(false);
        }
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', handleVideoTimeUpdate);
    }

    loadModels();

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleVideoTimeUpdate);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const dataURL = URL.createObjectURL(file);
      videoRef.current.src = dataURL;
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <input type="file" accept="video/*" onChange={handleUpload} className="mt-2 mb-4" />
      <div style={{ position: 'relative' }}>
        <video ref={videoRef} controls width="100%" height="auto" style={{ position: 'absolute', top: 0, left: 0 }} />
        <canvas ref={canvasRef} className="mt-4 border border-gray-300" />
        {faceDetected && <p style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', color: 'red' }}>Face Detected!</p>}
      </div>
      <button onClick={handlePlayPause} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default VideoPlayer;
