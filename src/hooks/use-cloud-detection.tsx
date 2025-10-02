
import { useState, useCallback, useEffect } from 'react';
import { DetectedObject } from '@/components/vision/ObjectDetection';
import { useDeviceInfo } from './use-mobile';
import { toast } from '@/components/ui/use-toast';
import { compressImageForCloudAPI, mockCloudDetection } from '@/utils/mobileDetectionHelper';

export interface CloudDetectionSettings {
  enabled: boolean;
  apiUrl: string;
  apiKey?: string;
}

export function useCloudDetection() {
  const deviceInfo = useDeviceInfo();
  const [settings, setSettings] = useState<CloudDetectionSettings>(() => {
    try {
      const stored = localStorage.getItem('vision_api_config');
      const config = stored ? JSON.parse(stored) : {};
      
      return {
        enabled: config.useCloudDetection || false,
        apiUrl: config.cloudApiUrl || 'https://your-cloud-api.com/detect',
        apiKey: localStorage.getItem('cloud_api_key') || undefined
      };
    } catch (e) {
      console.error('Error loading cloud detection settings', e);
      return {
        enabled: false,
        apiUrl: 'https://your-cloud-api.com/detect'
      };
    }
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize the service
  useEffect(() => {
    if (settings.enabled && !isInitialized) {
      // Only mark as initialized if we've enabled
      setIsInitialized(true);
      
      // If we're in development mode or have an invalid URL
      if (settings.apiUrl.includes('your-cloud-api')) {
        console.log('Cloud Detection: Using mock detection (development mode)');
        return;
      }
      
      console.log('Cloud Detection: Service initialized with URL:', settings.apiUrl);
    }
  }, [settings.enabled, settings.apiUrl, isInitialized]);
  
  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<CloudDetectionSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      try {
        // Get existing config
        const stored = localStorage.getItem('vision_api_config');
        const config = stored ? JSON.parse(stored) : {};
        
        // Update with new settings
        localStorage.setItem('vision_api_config', JSON.stringify({
          ...config,
          useCloudDetection: updated.enabled,
          cloudApiUrl: updated.apiUrl
        }));
        
        // Update API key if provided
        if (updated.apiKey) {
          localStorage.setItem('cloud_api_key', updated.apiKey);
        }
      } catch (e) {
        console.error('Error saving cloud detection settings', e);
      }
      
      return updated;
    });
  }, []);
  
  // Process a frame through the cloud detection service
  const processFrame = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<DetectedObject[]> => {
    if (!settings.enabled) {
      throw new Error('Cloud detection not enabled');
    }
    
    if (isProcessing) {
      throw new Error('Already processing a frame');
    }
    
    setIsProcessing(true);
    
    try {
      // Compress the image for the API
      const imageData = await compressImageForCloudAPI(videoElement);
      
      // Check if we're in development mode or have an invalid URL
      if (settings.apiUrl.includes('your-cloud-api')) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        const mockResults = await mockCloudDetection();
        setHasError(false);
        return mockResults;
      }
      
      // Make the actual API call
      const response = await fetch(settings.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` })
        },
        body: JSON.stringify({
          image: imageData,
          options: {
            confidenceThreshold: 0.15,
            maxDetections: 10
          }
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Cloud API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.objects || !Array.isArray(data.objects)) {
        return [];
      }
      
      setHasError(false);
      
      return data.objects.map((item: any, index: number) => {
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
    } catch (error) {
      console.error('Error in cloud detection:', error);
      
      if (!hasError) {
        toast({
          title: "Cloud Detection Error",
          description: "Could not connect to cloud detection service. Using local fallback.",
          variant: "destructive",
        });
        setHasError(true);
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [settings.enabled, settings.apiUrl, settings.apiKey, isProcessing, hasError]);
  
  // Recommend cloud detection based on device capabilities
  const shouldUseCloud = deviceInfo.needsCloudProcessing;
  
  return {
    settings,
    updateSettings,
    processFrame,
    isInitialized,
    hasError,
    isProcessing,
    shouldUseCloud
  };
}
