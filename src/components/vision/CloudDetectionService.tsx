
import React, { useCallback, useEffect, useState } from 'react';
import { DetectedObject } from './ObjectDetection';
import { toast } from '@/components/ui/use-toast';
import { compressImageForCloudAPI, mockCloudDetection } from '@/utils/mobileDetectionHelper';

interface CloudDetectionServiceProps {
  isEnabled: boolean;
  apiUrl: string;
  apiKey?: string;
  onDetectionResult: (result: DetectedObject[], source: 'cloud') => void;
  onError: (error: Error) => void;
}

const CloudDetectionService: React.FC<CloudDetectionServiceProps> = ({
  isEnabled,
  apiUrl,
  apiKey,
  onDetectionResult,
  onError
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize the service
  useEffect(() => {
    if (isEnabled && !isInitialized) {
      console.log('CloudDetectionService: Initializing...');
      
      // Check if the API URL is valid
      if (!apiUrl || apiUrl.includes('your-cloud-api')) {
        console.log('CloudDetectionService: Using mock detection (demo/development mode)');
        setIsInitialized(true);
        return;
      }
      
      // Initialize was successful
      setIsInitialized(true);
      console.log('CloudDetectionService: Initialized with real API');
    }
  }, [isEnabled, apiUrl, apiKey, isInitialized, onError]);
  
  // Enhanced object detection capabilities for architectural features
  const enhanceDetectionResults = (results: DetectedObject[]): DetectedObject[] => {
    // Find potential doors, doorways, and steps based on shape and context
    return results.map(obj => {
      const { label, bbox } = obj;
      let updatedObj = { ...obj };
      
      // Check for tall rectangular shapes that might be doors
      if (bbox.height > bbox.width * 1.8 && 
          label.toLowerCase().includes('rectangle') || 
          label.toLowerCase().includes('shape') ||
          label.toLowerCase().includes('panel')) {
        updatedObj.label = 'Door';
        updatedObj.confidence = Math.min(obj.confidence + 0.1, 0.95);
      }
      
      // Check for horizontal lines near the bottom that might be steps
      if (bbox.height < bbox.width * 0.3 && 
          bbox.y > 0.6 &&
          (label.toLowerCase().includes('line') || 
           label.toLowerCase().includes('horizontal') ||
           label.toLowerCase().includes('edge'))) {
        updatedObj.label = 'Steps';
        updatedObj.confidence = Math.min(obj.confidence + 0.05, 0.9);
      }
      
      return updatedObj;
    });
  };
  
  // This function will be called by the Camera component to process a frame
  const processFrame = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<DetectedObject[]> => {
    if (!isEnabled || !isInitialized) {
      throw new Error('Cloud detection service not enabled or initialized');
    }
    
    try {
      // Compress the image for the API
      const imageData = await compressImageForCloudAPI(videoElement);
      
      // Check if we're in development mode without a real endpoint
      if (apiUrl.includes('your-cloud-api') || !apiUrl) {
        console.log('CloudDetectionService: Using mock detection (no real endpoint)');
        const mockResults = await mockCloudDetection();
        
        // Add a mock door detection occasionally
        if (Math.random() > 0.7) {
          mockResults.push({
            id: mockResults.length + 1,
            label: Math.random() > 0.5 ? 'Door' : 'Doorway',
            confidence: 0.75 + Math.random() * 0.2,
            bbox: {
              x: 0.6 + Math.random() * 0.2,
              y: 0.2 + Math.random() * 0.1,
              width: 0.15 + Math.random() * 0.1,
              height: 0.4 + Math.random() * 0.2
            },
            distance: 3 + Math.random() * 5
          });
        }
        
        // Add mock steps occasionally
        if (Math.random() > 0.8) {
          mockResults.push({
            id: mockResults.length + 1,
            label: 'Steps',
            confidence: 0.7 + Math.random() * 0.2,
            bbox: {
              x: 0.3 + Math.random() * 0.4,
              y: 0.7 + Math.random() * 0.2,
              width: 0.4 + Math.random() * 0.2,
              height: 0.05 + Math.random() * 0.05
            },
            distance: 2 + Math.random() * 6
          });
        }
        
        onDetectionResult(mockResults, 'cloud');
        return mockResults;
      }
      
      // Make the actual API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          image: imageData,
          options: {
            confidenceThreshold: 0.15,
            maxDetections: 10,
            detectArchitecturalFeatures: true // request special detection for doors, etc.
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Cloud API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.objects || !Array.isArray(data.objects)) {
        console.warn('No objects detected by Cloud API');
        return [];
      }
      
      let results = data.objects.map((item: any, index: number) => {
        const rect = item.bbox;
        
        return {
          id: index + 1,
          label: item.class || 'object',
          confidence: item.confidence || 0.5,
          bbox: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          distance: item.distance || 2.0
        };
      });
      
      // Enhance results to better detect architectural features
      results = enhanceDetectionResults(results);
      
      onDetectionResult(results, 'cloud');
      return results;
    } catch (error) {
      console.error('Error in cloud detection:', error);
      onError(error instanceof Error ? error : new Error('Unknown error in cloud detection'));
      throw error;
    }
  }, [isEnabled, isInitialized, apiUrl, apiKey, onDetectionResult, onError]);
  
  return null; // This is a non-visual service component
};

export default CloudDetectionService;
