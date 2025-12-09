
// @ts-nocheck
// Disabling TS check for this file because face-api is loaded via CDN (global variable)

import { Employee } from "../types";

declare const faceapi: any;

// Use public CDN for models to work out-of-the-box in demo. 
// In production, download these weights to your /public/models folder.
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export const loadFaceModels = async () => {
  try {
    if (!faceapi.nets.tinyFaceDetector.params) {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Face Models Loaded");
    }
    return true;
  } catch (error) {
    console.error("Failed to load face models", error);
    return false;
  }
};

export const detectFace = async (video: HTMLVideoElement) => {
  if (!video || video.paused || video.ended) return null;

  // TinyFaceDetector is faster for real-time mobile/kiosk use
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
  
  const detection = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection;
};

export const matchFace = (descriptor: Float32Array, employees: Employee[]): { match: Employee | null, distance: number } => {
  if (!descriptor) return { match: null, distance: 1 };

  let bestMatch: Employee | null = null;
  let lowestDistance = 1.0; // 1.0 is far, 0.0 is exact match

  // Convert raw descriptor to array for easy comparison if stored that way
  // face-api uses Euclidean distance
  
  const registeredEmployees = employees.filter(e => e.faceRegistered && e.faceDescriptor);

  for (const emp of registeredEmployees) {
      if (!emp.faceDescriptor) continue;
      
      const empDescriptor = new Float32Array(emp.faceDescriptor);
      const distance = faceapi.euclideanDistance(descriptor, empDescriptor);
      
      // Threshold typically 0.6 for FaceAPI
      if (distance < 0.5 && distance < lowestDistance) {
          lowestDistance = distance;
          bestMatch = emp;
      }
  }

  return { match: bestMatch, distance: lowestDistance };
};
