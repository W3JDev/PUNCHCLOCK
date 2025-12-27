
// @ts-nocheck
// Disabling TS check for this file because face-api is loaded via CDN (global variable)

import { Employee } from "../types";

declare const faceapi: any;

// Use public CDN for models to work out-of-the-box in demo. 
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let faceMatcher: any = null;

export const loadFaceModels = async () => {
  try {
    // Safety Check: Ensure global faceapi exists
    if (typeof faceapi === 'undefined') {
        console.warn("FaceAPI not loaded yet. Retrying...");
        return false;
    }

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
    if (typeof faceapi === 'undefined') return;

    const labeledDescriptors = employees
        .filter(e => e.faceRegistered && e.faceDescriptor && e.faceDescriptor.length > 0)
        .map(e => {
            return new faceapi.LabeledFaceDescriptors(
                e.id,
                [new Float32Array(e.faceDescriptor!)]
            );
        });

    if (labeledDescriptors.length > 0) {
        // 0.5 is a strict distance threshold to prevent false positives
        faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5); 
        console.log(`Biometric Index Rebuilt: ${labeledDescriptors.length} subjects.`);
    }
};

export const detectFace = async (video: HTMLVideoElement) => {
  if (typeof faceapi === 'undefined') return null;
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
 * Security Check: Verifies if a detected face matches someone other than the current target.
 * Used during enrollment to prevent duplicate face ID usage across the system.
 */
export const findDuplicateFace = (descriptor: Float32Array, currentEmployeeId?: string): { isDuplicate: boolean, matchedId?: string } => {
    if (!faceMatcher) return { isDuplicate: false };
    
    // Check if this face matches ANYONE else in the db
    const bestMatch = faceMatcher.findBestMatch(descriptor);
    
    // If it matches someone (not unknown) AND that someone is NOT the current person being edited
    if (bestMatch.label !== 'unknown' && bestMatch.label !== currentEmployeeId) {
        return { isDuplicate: true, matchedId: bestMatch.label };
    }
    
    return { isDuplicate: false };
};

/**
 * Liveness Check: Verifies if the user is performing the requested expression
 */
export const verifyLiveness = (expressions: any, challenge: 'Smile' | 'Neutral'): boolean => {
    if (!expressions) return false;
    
    // Thresholds for expression confidence
    const SMILE_THRESHOLD = 0.7;
    const NEUTRAL_THRESHOLD = 0.6;
    
    if (challenge === 'Smile') {
        // High happiness score
        return expressions.happy > SMILE_THRESHOLD;
    }
    
    if (challenge === 'Neutral') {
        // High neutral score
        return expressions.neutral > NEUTRAL_THRESHOLD;
    }

    return false;
};
