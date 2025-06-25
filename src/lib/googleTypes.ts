/**
 * Type definitions for Google API responses
 */

// Google Vision API Face Detection types
export interface GoogleVisionFaceLandmark {
  type: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface GoogleVisionFaceAnnotation {
  boundingPoly: {
    vertices: Array<{ x: number; y: number }>;
  };
  fdBoundingPoly: {
    vertices: Array<{ x: number; y: number }>;
  };
  landmarks: GoogleVisionFaceLandmark[];
  rollAngle: number;
  panAngle: number;
  tiltAngle: number;
  detectionConfidence: number;
  landmarkingConfidence: number;
  joyLikelihood: string; // VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY, UNKNOWN
  sorrowLikelihood: string;
  angerLikelihood: string;
  surpriseLikelihood: string;
  underExposedLikelihood: string;
  blurredLikelihood: string;
  headwearLikelihood: string;
}

// Google Vision API Object Detection types
export interface GoogleVisionVertex {
  x: number;
  y: number;
}

export interface GoogleVisionNormalizedVertex {
  x: number;
  y: number;
}

export interface GoogleVisionBoundingPoly {
  vertices: GoogleVisionVertex[];
  normalizedVertices: GoogleVisionNormalizedVertex[];
}

export interface GoogleVisionObjectAnnotation {
  mid: string;
  name: string;
  score: number;
  boundingPoly: GoogleVisionBoundingPoly;
}
