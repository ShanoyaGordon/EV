
import { DetectedObject } from '@/components/vision/ObjectDetection';
import { useIsMobile, DeviceInfo } from '@/hooks/use-mobile';

// Helps stabilize detections on mobile by reducing jitter
export function stabilizeDetections(currentDetections: DetectedObject[], previousDetections?: DetectedObject[]): DetectedObject[] {
  if (!previousDetections || previousDetections.length === 0) {
    return currentDetections;
  }
  
  // Simple stabilization logic - if we have similar objects, average their positions
  return currentDetections.map(detection => {
    const similar = previousDetections.find(prev => 
      prev.label === detection.label && 
      Math.abs(prev.bbox.x - detection.bbox.x) < 0.15 && // Increased tolerance for mobile
      Math.abs(prev.bbox.y - detection.bbox.y) < 0.15
    );
    
    if (similar) {
      return {
        ...detection,
        bbox: {
          x: (detection.bbox.x * 0.6 + similar.bbox.x * 0.4), // Adjusted weight to reduce jitter
          y: (detection.bbox.y * 0.6 + similar.bbox.y * 0.4),
          width: (detection.bbox.width * 0.6 + similar.bbox.width * 0.4),
          height: (detection.bbox.height * 0.6 + similar.bbox.height * 0.4),
        },
        confidence: Math.max(detection.confidence, similar.confidence),
      };
    }
    
    return detection;
  });
}

// This function helps prioritize detections in the center of the frame
export function prioritizeCenterDetections(detections: DetectedObject[]): DetectedObject[] {
  if (detections.length <= 3) return detections;
  
  return detections.sort((a, b) => {
    // Calculate distance from center (0.5, 0.5)
    const centerA = Math.sqrt(
      Math.pow((a.bbox.x + a.bbox.width/2) - 0.5, 2) + 
      Math.pow((a.bbox.y + a.bbox.height/2) - 0.5, 2)
    );
    
    const centerB = Math.sqrt(
      Math.pow((b.bbox.x + b.bbox.width/2) - 0.5, 2) + 
      Math.pow((b.bbox.y + b.bbox.height/2) - 0.5, 2)
    );
    
    // Lower center distance means higher priority
    return centerA - centerB;
  });
}

// Mobile-specific optimizations for better performance
export function getMobileDetectionSettings(deviceInfo?: DeviceInfo) {
  // Base settings
  const settings = {
    confidenceThreshold: 0.15,     // Lower threshold for mobile
    maxDetections: 5,              // Fewer detections for better performance
    minObjectSize: 0.0001,         // Detect smaller objects
    processingScale: 0.4,          // Reduced resolution for faster processing
    skipFrames: 2,                 // Process every 3rd frame
    useEdgeModel: true,            // Use lightweight model
    useCloudOffload: false         // Determine if cloud offloading should be used
  };
  
  // Adjust settings based on device capabilities if deviceInfo is provided
  if (deviceInfo) {
    if (deviceInfo.needsCloudProcessing) {
      settings.useCloudOffload = true;
    }
    
    if (deviceInfo.cpuCores <= 2) {
      // Very low-end device
      settings.processingScale = 0.3;
      settings.maxDetections = 3;
      settings.skipFrames = 3;
    } else if (deviceInfo.cpuCores <= 4) {
      // Low-end device
      settings.processingScale = 0.35;
      settings.maxDetections = 4;
      settings.skipFrames = 2;
    } else if (deviceInfo.isHighEndDevice) {
      // High-end device
      settings.processingScale = 0.5;
      settings.maxDetections = 8;
      settings.skipFrames = 1;
    }
  }
  
  return settings;
}

// For unknown objects, use a default label and size estimate
export function normalizeObjectLabel(label: string): string {
  if (!label || label.trim() === '') {
    return 'object';
  }
  
  // Handle known common misdetections with better terms
  const labelMap: Record<string, string> = {
    'person': 'person',
    'bicycle': 'bicycle',
    'car': 'car',
    'motorcycle': 'motorcycle',
    'airplane': 'airplane',
    'bus': 'bus',
    'train': 'train',
    'truck': 'truck',
    'boat': 'boat',
    'traffic light': 'traffic light',
    'fire hydrant': 'fire hydrant',
    'stop sign': 'stop sign',
    'parking meter': 'parking meter',
    'bench': 'bench',
    'bird': 'bird',
    'cat': 'cat',
    'dog': 'dog',
    'horse': 'horse',
    'sheep': 'sheep',
    'cow': 'cow',
    'elephant': 'elephant',
    'bear': 'bear',
    'zebra': 'zebra',
    'giraffe': 'giraffe',
    'backpack': 'backpack',
    'umbrella': 'umbrella',
    'handbag': 'handbag',
    'tie': 'tie',
    'suitcase': 'suitcase',
    'frisbee': 'frisbee',
    'skis': 'skis',
    'snowboard': 'snowboard',
    'sports ball': 'sports ball',
    'kite': 'kite',
    'baseball bat': 'baseball bat',
    'baseball glove': 'baseball glove',
    'skateboard': 'skateboard',
    'surfboard': 'surfboard',
    'tennis racket': 'tennis racket',
    'bottle': 'bottle',
    'wine glass': 'wine glass',
    'cup': 'cup',
    'fork': 'fork',
    'knife': 'knife',
    'spoon': 'spoon',
    'bowl': 'bowl',
    'banana': 'banana',
    'apple': 'apple',
    'sandwich': 'sandwich',
    'orange': 'orange',
    'broccoli': 'broccoli',
    'carrot': 'carrot',
    'hot dog': 'hot dog',
    'pizza': 'pizza',
    'donut': 'donut',
    'cake': 'cake',
    'chair': 'chair',
    'couch': 'couch',
    'potted plant': 'potted plant',
    'bed': 'bed',
    'dining table': 'table',
    'toilet': 'toilet',
    'tv': 'tv',
    'laptop': 'laptop',
    'mouse': 'mouse',
    'remote': 'remote',
    'keyboard': 'keyboard',
    'cell phone': 'phone',
    'microwave': 'microwave',
    'oven': 'oven',
    'toaster': 'toaster',
    'sink': 'sink',
    'refrigerator': 'refrigerator',
    'book': 'book',
    'clock': 'clock',
    'vase': 'vase',
    'scissors': 'scissors',
    'teddy bear': 'teddy bear',
    'hair drier': 'hair dryer',
    'toothbrush': 'toothbrush',
    // Add any custom mappings
  };
  
  // Check for mapped label
  const cleanedLabel = label.toLowerCase().trim();
  if (labelMap[cleanedLabel]) {
    return labelMap[cleanedLabel];
  }
  
  // If no specific mapping, use generic "object" for unknown items
  if (!labelMap[cleanedLabel]) {
    return 'object';
  }
  
  // Replace underscores with spaces and capitalize
  return label
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Optimize frame processing by detecting if the camera has moved significantly
export function hasSignificantMovement(
  currentFrame: ImageData, 
  previousFrame?: ImageData
): boolean {
  if (!previousFrame) return true;
  
  // More efficient sampling for mobile
  const sampleSize = 50; // Larger sample size = fewer checks
  const threshold = 40;  // Higher threshold = less sensitivity
  let diffCount = 0;
  
  for (let i = 0; i < currentFrame.data.length; i += sampleSize * 4) {
    const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
    const gDiff = Math.abs(currentFrame.data[i+1] - previousFrame.data[i+1]);
    const bDiff = Math.abs(currentFrame.data[i+2] - previousFrame.data[i+2]);
    
    if (rDiff > threshold || gDiff > threshold || bDiff > threshold) {
      diffCount++;
    }
    
    if (diffCount > 5) { // Reduced threshold for faster return
      return true;
    }
  }
  
  return false;
}

// For mobile, reduce the image size before processing to improve performance
export function downscaleImageForProcessing(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  videoElement: HTMLVideoElement,
  scale: number = 0.4 // Reduced further for better performance
): ImageData {
  const width = videoElement.videoWidth * scale;
  const height = videoElement.videoHeight * scale;
  
  // Set canvas to smaller size for faster processing
  canvas.width = width;
  canvas.height = height;
  
  // Draw video onto canvas at smaller size
  ctx.drawImage(videoElement, 0, 0, width, height);
  
  // Get image data at reduced size
  return ctx.getImageData(0, 0, width, height);
}

// Function to prepare image data for cloud API
export function prepareImageForCloud(
  videoElement: HTMLVideoElement,
  quality: number = 0.6,
  maxDimension: number = 640
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Calculate dimensions while maintaining aspect ratio
      let width = videoElement.videoWidth;
      let height = videoElement.videoHeight;
      
      if (width > height && width > maxDimension) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw the video frame to the canvas
      ctx.drawImage(videoElement, 0, 0, width, height);
      
      // Convert to base64 JPEG with reduced quality
      const base64Data = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      resolve(base64Data);
    } catch (error) {
      reject(error);
    }
  });
}

// Get the expected version of a model for mobile devices
export function getMobileModelVersion(modelName: string): string {
  if (modelName.includes('mobilenet')) {
    return 'lite_mobilenet_v2'; // Use more efficient model for mobile
  }
  
  return modelName; // Default to requested model
}

// Function to determine if we should skip frame processing (for performance)
export function shouldSkipFrame(frameCount: number, settings: { skipFrames: number }): boolean {
  return frameCount % (settings.skipFrames + 1) !== 0;
}

// Get estimated device performance rating (1-5)
export function getDevicePerformanceLevel(): number {
  // Simple heuristic based on hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  
  if (cores <= 2) return 1; // Very low-end device
  if (cores <= 4) return 2; // Low-end device
  if (cores <= 6) return 3; // Mid-range device
  if (cores <= 8) return 4; // High-end device
  return 5; // Very high-end device
}

// Adjust mobile settings based on device performance
export function getOptimizedMobileSettings(): {
  processingScale: number;
  confidenceThreshold: number;
  maxDetections: number;
  skipFrames: number;
} {
  const performanceLevel = getDevicePerformanceLevel();
  
  // Default settings for mid-range devices
  let settings = {
    processingScale: 0.4,
    confidenceThreshold: 0.15,
    maxDetections: 5,
    skipFrames: 2
  };
  
  // Adjust based on performance level
  if (performanceLevel <= 2) {
    // Low-end device, more aggressive optimization
    settings.processingScale = 0.3;
    settings.maxDetections = 3;
    settings.skipFrames = 3;
  } else if (performanceLevel >= 4) {
    // High-end device, less aggressive optimization
    settings.processingScale = 0.5;
    settings.maxDetections = 8;
    settings.skipFrames = 1;
  }
  
  return settings;
}

// Compress and format image data for cloud API
export function compressImageForCloudAPI(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  maxWidth: number = 640,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Get dimensions from the element
      const sourceWidth = 'videoWidth' in imageElement ? imageElement.videoWidth : imageElement.width;
      const sourceHeight = 'videoHeight' in imageElement ? imageElement.videoHeight : imageElement.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      let targetWidth = sourceWidth;
      let targetHeight = sourceHeight;
      
      if (targetWidth > maxWidth) {
        const ratio = maxWidth / targetWidth;
        targetWidth = maxWidth;
        targetHeight = Math.floor(targetHeight * ratio);
      }
      
      // Set canvas size
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Draw image to canvas at new size
      ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);
      
      // Convert to base64 JPEG with reduced quality
      const base64String = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      resolve(base64String);
    } catch (error) {
      reject(error);
    }
  });
}

// Mock function for development without a cloud endpoint
export async function mockCloudDetection(): Promise<DetectedObject[]> {
  // Sample response that would come from a cloud API
  return [
    {
      id: 1,
      label: 'person',
      confidence: 0.92,
      bbox: { x: 0.2, y: 0.3, width: 0.2, height: 0.5 },
      distance: 1.5
    },
    {
      id: 2,
      label: 'chair',
      confidence: 0.87,
      bbox: { x: 0.6, y: 0.5, width: 0.15, height: 0.2 },
      distance: 2.3
    }
  ];
}

// Check if the device can handle local processing
export function canUseLocalProcessing(deviceInfo: DeviceInfo): boolean {
  // Use more aggressive thresholds to favor cloud processing for mobile
  if (deviceInfo.isMobile) {
    return deviceInfo.isHighEndDevice && deviceInfo.cpuCores >= 6;
  }
  
  // For desktop, we can be more lenient
  return deviceInfo.cpuCores >= 4;
}
