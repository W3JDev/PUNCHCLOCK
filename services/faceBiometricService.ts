
// @ts-nocheck
// Disabling TS check for this file because face-api is loaded via CDN (global variable)

import { Employee } from "../types";

declare const faceapi: any;

// Use public CDN for models to work out-of-the-box in demo. 
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let faceMatcher: any = null;

export const loadFaceModels = async () => {
  try {
    if (!faceapi.nets.tinyFaceDetector.params) {
        console.log("Loading Biometric Models...");
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // Added for Liveness
        ]);
        console.log("Face Models Loaded");
    }
    return true;
  } catch (error) {
    console.error("Failed to load face models", error);
    return false;
  }
};

/**
 * Initializes the FaceMatcher for O(1) lookup speed.
 * This should be called once when employees are loaded.
 */
export const initializeFaceMatcher = (employees: Employee[]) => {
    const labeledDescriptors = employees
        .filter(e => e.faceRegistered && e.faceDescriptor && e.faceDescriptor.length > 0)
        .map(e => {
            return new faceapi.LabeledFaceDescriptors(
                e.id,
                [new Float32Array(e.faceDescriptor!)]
            );
        });

    if (labeledDescriptors.length > 0) {
        // 0.6 is the standard distance threshold
        faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5); 
        console.log(`Biometric Index Rebuilt: ${labeledDescriptors.length} subjects.`);
    }
};

export const detectFace = async (video: HTMLVideoElement) => {
  if (!video || video.paused || video.ended) return null;

  // TinyFaceDetector is faster for real-time mobile/kiosk use. 
  // inputSize 512 is better accuracy than 224
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });
  
  const detection = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks()
    .withFaceExpressions() // Added for Liveness
    .withFaceDescriptor();

  return detection;
};

/**
 * High-Speed matching using spatial index
 */
export const matchFaceFast = (descriptor: Float32Array): { match: any, distance: number } => {
    if (!faceMatcher || !descriptor) return { match: null, distance: 1.0 };
    
    const bestMatch = faceMatcher.findBestMatch(descriptor);
    
    // face-api returns 'unknown' if distance > threshold
    if (bestMatch.label === 'unknown') {
        return { match: null, distance: bestMatch.distance };
    }

    return { match: { id: bestMatch.label }, distance: bestMatch.distance };
};

/**
 * Liveness Check: Verifies if the user is performing the requested expression
 */
export const verifyLiveness = (expressions: any, challenge: 'Smile' | 'Neutral'): boolean => {
    if (!expressions) return false;
    
    // Thresholds for expression confidence
    const SMILE_THRESHOLD = 0.7;
    
    if (challenge === 'Smile') {
        return expressions.happy > SMILE_THRESHOLD;
    }
    
    if (challenge === 'Neutral') {
        return expressions.neutral > SMILE_THRESHOLD;
    }

    return false;
};
