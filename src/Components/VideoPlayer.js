import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import * as faceapi from 'face-api.js';
import samplevideo from '../Video/sampleVideo.mp4';

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models/weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models/weights');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models/weights');
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/weights');
    };

    const handleVideoTimeUpdate = async () => {
      if (videoRef.current && fabricCanvasRef.current) {
        const faces = await faceapi.detectAllFaces(videoRef.current).withFaceLandmarks().withFaceDescriptors();
        const fabricCanvas = fabricCanvasRef.current;

        // Set canvas dimensions to match the video size
        fabricCanvas.setDimensions({
          width: videoRef.current.clientWidth,
          height: videoRef.current.clientHeight,
        });

        fabricCanvas.clear();
        setFaceDetected(faces.length > 0);

        faces.forEach((face) => {
          const { x, y, width, height } = face.detection.box;
          // Adjust coordinates based on the video and canvas dimensions
          const rect = new fabric.Rect({
            left: (x / videoRef.current.videoWidth) * fabricCanvas.width,
            top: (y / videoRef.current.videoHeight) * fabricCanvas.height,
            width: (width / videoRef.current.videoWidth) * fabricCanvas.width,
            height: (height / videoRef.current.videoHeight) * fabricCanvas.height,
            fill: 'rgba(255, 0, 0, 0.3)',
            selectable: false,
          });

          fabricCanvas.add(rect);
        });
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

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
    }
  }, []);

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({
        width: videoRef.current.clientWidth,
        height: videoRef.current.clientHeight,
      });
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', handleVideoLoadedMetadata);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <input type="file" accept="video/*" onChange={handleUpload} className="mt-2 mb-4" />
      <div style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          controls
          width="100%"
          height="auto"
          style={{ position: 'absolute', top: 12, left: 0 }}
        >
          <source src={samplevideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <canvas ref={canvasRef} className="mt-4 border border-gray-300" style={{ position: 'absolute', top: 0, left: 0 }} />
      </div>
      <button onClick={handlePlayPause} className="mt-12 px-4 py-2 bg-blue-500 text-white rounded">
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default VideoPlayer;
