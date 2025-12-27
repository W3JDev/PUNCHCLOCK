
// Simulating advanced security logic
import { AttendanceRecord, Employee } from '../types';

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

// Fixed office location (Example: KLCC)
const OFFICE_LOCATION = { lat: 3.1578, lng: 101.7118 };

/**
 * Haversine formula to calculate distance in meters
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Detects Fake GPS or Spoofing
 */
export const detectLocationSpoofing = (location: GeoLocation): string[] => {
  const risks: string[] = [];
  
  // Risk 1: Impossible Accuracy (Simulators often return exact integers or 0)
  if (location.accuracy === 0) {
    risks.push("Suspiciously perfect GPS signal (Possible Emulator)");
  }

  // Risk 2: Distance Check
  const distance = calculateDistance(location.lat, location.lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
  if (distance > 500) {
    risks.push(`Device is ${Math.round(distance)}m away from designated workplace.`);
  }

  return risks;
};

/**
 * Simulates a Liveness Challenge for Face Recognition
 */
export const generateLivenessChallenge = (): string => {
  const challenges = [
    "Blink your eyes twice",
    "Turn head slightly left",
    "Smile showing teeth",
    "Nod your head"
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
};

/**
 * Calculates a Risk Score (0-100) for an attendance attempt
 */
export const calculateAttendanceRisk = (
  location: GeoLocation | null,
  time: Date,
  employee: Employee
): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  // 1. Location Risk
  if (!location) {
    score += 100; // Critical Block
    reasons.push("Location data missing - Enable GPS");
  } else {
    const dist = calculateDistance(location.lat, location.lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
    
    // STRICT GEOFENCE (100m)
    if (dist > 100) { 
      score += 100; // Critical Block
      reasons.push(`OUT OF ZONE: You are ${Math.round(dist)}m away from HQ (Limit: 100m)`);
    } else if (dist > 50) { 
      score += 30; // Warning
      reasons.push("GPS Drifting - Near Perimeter");
    }
  }

  // 2. Time Risk (Late/Early) - Handled by Shift Logic in Attendance.tsx mostly, but keep for fallback
  const hour = time.getHours();
  if (hour < 6) {
    score += 10;
    reasons.push("Unusual hours (Very early)");
  }

  // 3. Status Risk
  if (employee.status === 'MIA' || employee.status === 'Terminated') {
    score += 100;
    reasons.push(`ACCESS DENIED: Employee status is ${employee.status}`);
  }

  return { score: Math.min(score, 100), reasons };
};
