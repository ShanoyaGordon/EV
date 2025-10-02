import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import CameraView from '@/components/vision/CameraView';
import ObjectDetection, { DetectedObject } from '@/components/vision/ObjectDetection';
import NavigationInstructions from '@/components/vision/NavigationInstructions';
import CloudDetectionSettings from '@/components/vision/CloudDetectionSettings';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, User, Zap, RotateCcw, X, Info, Settings, Repeat, CameraIcon, Cloud, CloudOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadModel, detectObjects, detectObjectsWithSource, saveAzureApiKey, saveDeepseekApiKey, saveCloudApiKey, saveApiConfig, saveCloudDetectionSettings } from '@/utils/objectDetection';
import { stabilizeDetections, prioritizeCenterDetections, getMobileDetectionSettings } from '@/utils/mobileDetectionHelper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { 
  speak, 
  stopSpeech, 
  createDescriptionFromObjects, 
  initSpeechSynthesis,
  generateNavigationInstructions,
  getSpeechQueueLength
} from '@/utils/speechUtils';
import { textToSpeech, saveCartesiaApiKey } from '@/utils/cartesiaService';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { setInUserGesture } from '@/utils/speechUtils';
import { useCloudDetection } from '@/hooks/use-cloud-detection';

const Camera = () => {
  const navigate = useNavigate();
  const deviceInfo = useDeviceInfo();
  const cloudDetection = useCloudDetection();
  
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [detectionSource, setDetectionSource] = useState<'local' | 'cloud' | 'azure' | 'deepseek'>('local');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showCloudSettings, setShowCloudSettings] = useState(false);
  const [lastDescription, setLastDescription] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settingsTab, setSettingsTab] = useState("vision");
  const [apiSettings, setApiSettings] = useState({
    azureApiUrl: localStorage.getItem('vision_api_config') ? JSON.parse(localStorage.getItem('vision_api_config') || '{}').azureApiUrl || 'https://your_endpoint/vision/v3.2/analyze' : 'https://your_endpoint/vision/v3.2/analyze',
    azureApiKey: localStorage.getItem('azure_api_key') || '',
    deepseekApiUrl: 'https://api.deepseek.com/v1/chat/completions',
    deepseekApiKey: localStorage.getItem('deepseek_api_key') || import.meta.env.VITE_DEEPSEEK_API_KEY || '',
    cloudApiUrl: localStorage.getItem('vision_api_config') ? JSON.parse(localStorage.getItem('vision_api_config') || '{}').cloudApiUrl || 'https://your-cloud-api.com/detect' : 'https://your-cloud-api.com/detect',
    cloudApiKey: localStorage.getItem('cloud_api_key') || '',
    useExternalApi: true,
    useCloudDetection: localStorage.getItem('vision_api_config') ? JSON.parse(localStorage.getItem('vision_api_config') || '{}').useCloudDetection || false : false,
    preferredProvider: 'azure' as 'azure' | 'deepseek' | 'cloud',
    speechRate: 1.0,
    speechVolume: 1.0,
    useCartesiaTTS: (() => { try { return !!(JSON.parse(localStorage.getItem('vision_api_config') || '{}').useCartesiaTTS); } catch { return false; } })(),
    cartesiaApiKey: localStorage.getItem('cartesia_api_key') || ''
  });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const [nearbyObjects, setNearbyObjects] = useState<DetectedObject[]>([]);
  const [continuousSpeech, setContinuousSpeech] = useState<boolean>(true);
  const [speechInterval, setSpeechInterval] = useState<number>(5000);
  const speechTimeoutRef = useRef<any>(null);
  const lastAnnouncementTimeRef = useRef<number>(0);
  const speechFailureCountRef = useRef<number>(0);
  const [useLightweightMode, setUseLightweightMode] = useState<boolean>(false);
  const cloudSuggestionShownRef = useRef<boolean>(false);
  const [navigationInstructions, setNavigationInstructions] = useState<{
    id: number;
    text: string;
    priority: 'high' | 'medium' | 'low';
    timestamp: Date;
  }[]>([]);
  const previousDetectionsRef = useRef<DetectedObject[]>([]);
  const previousFrameRef = useRef<ImageData | null>(null);
  const [detectionFailureCount, setDetectionFailureCount] = useState(0);
  const processingTimeRef = useRef<number[]>([]);
  const frameCountRef = useRef<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

  useEffect(() => {
    const usingExternalAzureOrDeepseek = apiSettings.useExternalApi && (apiSettings.preferredProvider === 'azure' || apiSettings.preferredProvider === 'deepseek');
    if (deviceInfo.needsCloudProcessing 
        && !cloudDetection.settings.enabled 
        && !usingExternalAzureOrDeepseek
        && !cloudSuggestionShownRef.current) {
      setTimeout(() => {
        toast({
          title: "Performance Recommendation",
          description: "Your device may benefit from cloud processing. Consider enabling it in settings.",
        });
        cloudSuggestionShownRef.current = true;
      }, 5000);
    }
    
    const isMobile = deviceInfo.isMobile;
    
    if (isMobile) {
      setUseLightweightMode(true);
    }
    
    const loadStoredConfig = () => {
      try {
        const storedConfig = localStorage.getItem('vision_api_config');
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig);
          setApiSettings(prevSettings => ({
            ...prevSettings,
            ...parsedConfig,
            useCartesiaTTS: !!parsedConfig.useCartesiaTTS,
            cartesiaApiKey: localStorage.getItem('cartesia_api_key') || prevSettings.cartesiaApiKey
          }));
        }
      } catch (error) {
        console.error('Error loading stored configuration:', error);
      }
    };
    
    loadStoredConfig();
    
    // Initialize speech synthesis early for iOS Chrome unlock
    try { initSpeechSynthesis(); } catch (e) {}
    if (!isiOS) {
      setVoiceEnabled(true);
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      stopSpeech();
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [navigate, deviceInfo, cloudDetection.settings.enabled]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    const initModel = async () => {
      try {
        try {
          await speak("Initializing vision system. This may take a moment.", {
            rate: apiSettings.speechRate,
            volume: apiSettings.speechVolume,
            queueMode: 'flush' // Make sure this interrupts any other speech
          });
        } catch (error) {
          console.warn("Text-to-speech initialization failed:", error);
        }
        
        const modelLoadingTimeout = setTimeout(() => {
          setModelLoaded(true);
          console.log('Model loading took too long, continuing with basic camera mode');
          toast({
            title: "Limited Functionality",
            description: "Object detection is unavailable. Using basic camera mode.",
            variant: "destructive"
          });
          startContinuousDetection();
        }, 15000);
        
        if (cloudDetection.settings.enabled) {
          clearTimeout(modelLoadingTimeout);
          setModelLoaded(true);
          console.log('Using cloud-based object detection, skipping local model loading');
          
          try {
            await speak("Camera ready. Using cloud-based object detection.", {
              rate: apiSettings.speechRate,
              volume: apiSettings.speechVolume,
              queueMode: 'flush'
            });
          } catch (error) {
            console.warn("Text-to-speech failed:", error);
          }
          
          startContinuousDetection();
          return;
        }
        
        const loadedModel = await loadModel();
        
        clearTimeout(modelLoadingTimeout);
        
        setModelLoaded(true);
        console.log('Object detection model loaded successfully');
        
        try {
          await speak("Camera ready. Continuous object detection and navigation guidance is now active.", {
            rate: apiSettings.speechRate,
            volume: apiSettings.speechVolume,
            queueMode: 'flush'
          });
        } catch (error) {
          console.warn("Text-to-speech failed:", error);
        }
        
        startContinuousDetection();
      } catch (error) {
        console.error('Failed to load object detection model:', error);
        try {
          await speak("I'm having trouble loading the object detection features. Using basic camera mode.", {
            rate: apiSettings.speechRate,
            volume: apiSettings.speechVolume,
            queueMode: 'flush'
          });
        } catch (speechError) {
          console.warn("Text-to-speech failed:", speechError);
        }
        
        setModelLoaded(true);
        
        toast({
          title: "Limited Functionality",
          description: "Object detection is unavailable. Using basic camera mode.",
          variant: "destructive"
        });
        
        startContinuousDetection();
      }
    };
    
    setTimeout(() => {
      initModel();
    }, 1000);
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const startContinuousDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    const initialInterval = deviceInfo.isMobile ? 2000 : 1000;
    
    detectionIntervalRef.current = window.setInterval(() => {
      if (videoRef.current && !isDetecting) {
        if (getSpeechQueueLength() > 2) {
          console.log("Speech queue backed up, skipping detection cycle");
          return;
        }
        
        if (frameCountRef.current % (deviceInfo.isMobile ? 3 : 1) !== 0) {
          frameCountRef.current++;
          return;
        }
        
        processFrame(videoRef.current);
        frameCountRef.current++;
      }
    }, initialInterval);
  };

  const processFrame = async (videoElement: HTMLVideoElement) => {
    if (isDetecting) return;
    
    setIsDetecting(true);
    const startTime = performance.now();
    
    try {
      let detectionResults: DetectedObject[] = [];
      let source: 'local' | 'cloud' | 'azure' | 'deepseek' = 'local';
      
      if (cloudDetection.settings.enabled) {
        try {
          detectionResults = await cloudDetection.processFrame(videoElement);
          source = 'cloud';
          
          setDetectionFailureCount(0);
        } catch (error) {
          console.error('Cloud detection failed:', error);
          
          try {
            const result = await detectObjectsWithSource(
              videoElement, 
              'local', 
              deviceInfo.isMobile
            );
            
            detectionResults = result.detections;
            source = result.source;
          } catch (localError) {
            console.error('Local fallback detection failed:', localError);
            throw localError;
          }
        }
      } else {
        const preferredProvider: 'local' | 'azure' | 'cloud' | 'deepseek' = apiSettings.useCloudDetection 
                                ? 'cloud' 
                                : (apiSettings.preferredProvider as 'azure' | 'deepseek' | 'local');
        
        const result = await detectObjectsWithSource(
          videoElement, 
          preferredProvider, 
          deviceInfo.isMobile
        );
        
        detectionResults = result.detections;
        source = result.source;
      }
      
      setDetectionSource(source);
      
      const stabilizedDetections = stabilizeDetections(detectionResults, previousDetectionsRef.current);
      previousDetectionsRef.current = stabilizedDetections;
      
      const prioritizedDetections = prioritizeCenterDetections(stabilizedDetections);
      
      setDetections(prioritizedDetections);
      
      const objectsWithinRange = prioritizedDetections.filter(obj => 
        obj.distance !== undefined && obj.distance <= 5.0
      );
      
      setNearbyObjects(objectsWithinRange);
      
      if (prioritizedDetections.length > 0) {
        const instruction = generateNavigationInstructions(prioritizedDetections);
        
        const newInstruction = {
          id: Date.now(),
          text: instruction.text,
          priority: instruction.priority,
          timestamp: new Date()
        };
        
        setNavigationInstructions(prev => {
          const updatedInstructions = [newInstruction, ...prev.slice(0, 9)];
          return updatedInstructions;
        });
        
        setShowInstructions(true);
      }
      
      if (continuousSpeech && voiceEnabled) {
        const now = Date.now();
        
        if ((now - lastAnnouncementTimeRef.current) > speechInterval) {
          const message = prioritizedDetections.length > 0 
            ? createDescriptionFromObjects(prioritizedDetections) 
            : "No objects detected at approximately one meter distance.";
            
          announceSpeech(message);
          lastAnnouncementTimeRef.current = now;
        }
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      processingTimeRef.current.push(processingTime);
      
      if (processingTimeRef.current.length > 10) {
        processingTimeRef.current.shift();
      }
      
      const avgProcessingTime = processingTimeRef.current.reduce((sum, time) => sum + time, 0) / 
                                processingTimeRef.current.length;
      
      if (avgProcessingTime > 1000 && !cloudDetection.settings.enabled && detectionFailureCount === 0) {
        console.log(`Average processing time (${avgProcessingTime.toFixed(0)}ms) is high. Consider cloud detection.`);
        
        if (!cloudDetection.shouldUseCloud) {
          toast({
            title: "Processing is slow",
            description: "Consider enabling cloud detection for better performance",
          });
        }
      }
    } catch (error) {
      console.error('Error detecting objects:', error);
      
      setDetectionFailureCount(prevCount => {
        const newCount = prevCount + 1;
        
        if (newCount === 3 && !cloudDetection.settings.enabled && deviceInfo.isMobile) {
          toast({
            title: "Detection Issues",
            description: "Having trouble with object detection. Try cloud detection for better results.",
            variant: "destructive"
          });
          
          setTimeout(() => {
            setShowCloudSettings(true);
          }, 1500);
        }
        
        return newCount;
      });
      
      if (cloudDetection.settings.enabled) {
        toast({
          title: "Cloud Detection Error",
          description: "Could not connect to cloud detection service. Check your settings.",
          variant: "destructive"
        });
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const announceSpeech = async (text: string) => {
    if (!voiceEnabled) return;
    try {
      const useRecoveryMode = speechFailureCountRef.current > 2;
      
      const simplifiedText = useRecoveryMode 
        ? text.split('.')[0]
        : text;
      
      setIsSpeaking(true);
      
      if (apiSettings.useCartesiaTTS && apiSettings.cartesiaApiKey) {
        await textToSpeech(simplifiedText);
      } else {
        await speak(simplifiedText, {
          rate: useRecoveryMode ? 1.0 : apiSettings.speechRate,
          volume: apiSettings.speechVolume,
          queueMode: 'flush',
          interrupt: true
        });
      }
      
      speechFailureCountRef.current = 0;
      setIsSpeaking(false);
    } catch (error) {
      console.error("Text-to-speech failed:", error);
      speechFailureCountRef.current++;
      setIsSpeaking(false);
      
      if (speechFailureCountRef.current === 3) {
        toast({
          title: "Speech Announcement Issues",
          description: "Having trouble with voice announcements. Still detecting objects.",
          variant: "destructive"
        });
      }
    }
  };

  const speakMessage = async (text: string) => {
    try {
      setIsSpeaking(true);
      if (apiSettings.useCartesiaTTS && apiSettings.cartesiaApiKey) {
        await textToSpeech(text);
      } else {
        await speak(text, {
          rate: apiSettings.speechRate,
          volume: apiSettings.speechVolume,
          queueMode: 'immediate'
        });
      }
      setIsSpeaking(false);
    } catch (error) {
      console.error("Text-to-speech failed:", error);
      toast({
        title: "Speech Error",
        description: "Failed to speak text. Check speech settings.",
        variant: "destructive"
      });
      setIsSpeaking(false);
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    speakMessage("Camera is active and ready to assist you.");
  };

  const handleSaveApiSettings = () => {
    saveAzureApiKey(apiSettings.azureApiKey);
    saveDeepseekApiKey(apiSettings.deepseekApiKey);
    if (apiSettings.cartesiaApiKey) {
      saveCartesiaApiKey(apiSettings.cartesiaApiKey);
    }
    
    try {
      localStorage.setItem('vision_api_config', JSON.stringify({
        azureApiUrl: apiSettings.azureApiUrl,
        cloudApiUrl: apiSettings.cloudApiUrl,
        useExternalApi: apiSettings.useExternalApi,
        useCloudDetection: apiSettings.useCloudDetection,
        preferredProvider: apiSettings.preferredProvider,
        speechRate: apiSettings.speechRate,
        speechVolume: apiSettings.speechVolume,
        useCartesiaTTS: apiSettings.useCartesiaTTS
      }));
    } catch (error) {
      console.error('Error saving configuration to localStorage:', error);
    }
    
    setShowApiSettings(false);
    
    let description = "Settings updated.";
    
    if (apiSettings.useCloudDetection) {
      description = "Using cloud-based object detection.";
    } else if (apiSettings.useExternalApi) {
      const providerName = apiSettings.preferredProvider === 'azure' ? 'Azure Computer Vision' : 'DeepSeek';
      description = `Using ${providerName} for object detection`;
    } else {
      description = "Using local model for object detection";
    }
    
    toast({
      title: "Settings Updated",
      description: description,
    });
    
    speakMessage(description);
    
    startContinuousDetection();
  };

  const handleSaveCloudSettings = () => {
    saveCloudApiKey(apiSettings.cloudApiKey);
    
    saveCloudDetectionSettings({
      cloudApiUrl: apiSettings.cloudApiUrl,
      useCloudDetection: apiSettings.useCloudDetection,
      cloudApiKey: apiSettings.cloudApiKey
    });
    
    setShowCloudSettings(false);
    
    if (apiSettings.useCloudDetection) {
      toast({
        title: "Cloud Detection Enabled",
        description: "Using cloud-based object detection for better mobile performance",
      });
      
      speakMessage("Cloud-based object detection enabled. This should improve performance on mobile devices.");
    } else {
      toast({
        title: "Cloud Detection Disabled",
        description: "Using local device for object detection",
      });
      
      speakMessage("Cloud-based detection disabled. Using your device for object detection.");
    }
    
    startContinuousDetection();
  };

  const handleSwitchCamera = () => {
    setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    toast({
      title: "Camera Switched",
      description: `Using ${cameraFacingMode === 'environment' ? 'front' : 'back'} camera`,
      variant: "default"
    });
    
    speakMessage(`Switching to ${cameraFacingMode === 'environment' ? 'front' : 'back'} camera`);
  };

  const handleManualScan = () => {
    speakMessage("Scanning for objects");
    lastAnnouncementTimeRef.current = 0;
    
    if (videoRef.current) {
      processFrame(videoRef.current);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <div className="relative w-full h-full flex flex-col">
		{/* Top Header Bar */}
		<div className="absolute top-0 left-0 right-0 z-30 px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center backdrop-blur-md bg-black/40 border-b border-white/5">
			<div className="rounded-full bg-black/60 px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 border border-white/20 shadow-lg">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white font-semibold tracking-wide">EchoVision</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/80 shadow-lg transition-all"
            onClick={() => setShowApiSettings(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Full Screen Camera View */}
        <div className="absolute inset-0 w-full h-full">
          <CameraView
            onFrame={undefined}
            className="w-full h-full"
            videoRef={videoRef}
            facingMode={cameraFacingMode}
          />

          <ObjectDetection
            detections={detections}
            className="absolute inset-0 pointer-events-none"
            source={detectionSource}
          />
        </div>

        {isiOS && !voiceEnabled && (
          <div className="absolute bottom-28 left-0 right-0 z-30 px-6">
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full py-3 shadow-xl border border-white/20"
              onClick={() => {
                try { setInUserGesture(true); initSpeechSynthesis(); } catch {}
                setVoiceEnabled(true);
                // Kick off an immediate detection pass so we have fresh objects to announce
                if (videoRef.current) {
                  lastAnnouncementTimeRef.current = 0; // ensure next announcement isn't delayed
                  processFrame(videoRef.current);
                }
                try {
                  speak("Voice enabled. I will announce nearby objects.", {
                    rate: apiSettings.speechRate,
                    volume: apiSettings.speechVolume,
                    queueMode: 'flush'
                  });
                } catch {}
                // Trigger an immediate announcement shortly after detection cycle
                setTimeout(() => {
                  const hasDetections = detections && detections.length > 0;
                  const msg = hasDetections
                    ? createDescriptionFromObjects(detections)
                    : "No objects detected at approximately one meter distance.";
                  announceSpeech(msg);
                  lastAnnouncementTimeRef.current = Date.now();
                }, 300);
              }}
            >
              Enable Voice Guidance
            </Button>
          </div>
        )}

        {/* Cloud Detection Button - Mobile Only */}
		{deviceInfo.isMobile && (
			<Button
				variant="outline"
				size="sm"
				className="absolute top-20 right-3 sm:right-4 bg-black/80 text-white border border-white/30 hover:bg-black/90 z-30 hover:text-white shadow-xl backdrop-blur-lg rounded-full px-3 py-2 sm:px-4"
				onClick={() => setShowCloudSettings(true)}
			>
            {cloudDetection.settings.enabled ? (
              <Cloud className="h-4 w-4 mr-2 text-blue-400" />
            ) : (
              <CloudOff className="h-4 w-4 mr-2 text-gray-400" />
            )}
            <span className="text-xs font-medium">{cloudDetection.settings.enabled ? "Cloud On" : "Cloud Off"}</span>
          </Button>
        )}

		{/* Bottom Control Bar */}
		<div className="absolute bottom-0 left-0 right-0 z-30 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:pt-6 px-4 sm:px-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm">
			<div className="flex items-center justify-center gap-5 sm:gap-6 max-w-lg mx-auto">
            {/* Switch Camera Button */}
            <Button
              variant="ghost"
              size="icon"
					className="text-white hover:text-white bg-black/60 hover:bg-black/80 rounded-full w-12 h-12 sm:w-14 sm:h-14 border border-white/20 shadow-lg transition-all hover:scale-105"
              onClick={handleSwitchCamera}
            >
					<Repeat className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            {/* Main Scan Button */}
            <Button
					className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center p-0 shadow-2xl transition-all hover:scale-105 border-4 border-white/30"
              onClick={(e) => {
                try { setInUserGesture(true); } catch {}
                handleManualScan();
              }}
            >
					<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-600 flex items-center justify-center">
						<CameraIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </Button>

            {/* Instructions Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
					className="text-white hover:text-white bg-black/60 hover:bg-black/80 rounded-full w-12 h-12 sm:w-14 sm:h-14 border border-white/20 shadow-lg transition-all hover:scale-105"
              onClick={() => {
                if (showInstructions) {
                  setShowInstructions(false);
                  speakMessage("Instructions hidden");
                } else {
                  setShowInstructions(true);
                  speakMessage("Instructions shown");
                }
              }}
            >
					<Info className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
      </div>

		{/* Navigation Instructions Overlay */}
		{showInstructions && (
			<div className="absolute bottom-[calc(env(safe-area-inset-bottom)+7rem)] sm:bottom-36 left-3 right-3 sm:left-4 sm:right-4 z-20">
          <NavigationInstructions
            instructions={navigationInstructions}
            isExpanded={isInstructionsExpanded}
            onToggleExpand={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {!modelLoaded && !showWelcome && (
        <div className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center bg-black/80 p-8 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md max-w-sm mx-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-white border-r-2 border-b-2 border-transparent mb-4"></div>
            <p className="text-white font-semibold text-xl mb-2">Loading AI model...</p>
            <p className="text-white/70 text-sm">This may take a few moments</p>
            <div className="mt-6 h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-900/95 to-gray-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-black/80 rounded-2xl p-8 max-w-md relative animate-fade-in border border-white/20 shadow-2xl backdrop-blur-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
              onClick={handleCloseWelcome}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/40 shadow-lg">
                <Users className="h-10 w-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">Welcome to EchoVision</h2>
              <p className="text-white/80 text-base">
                Your AI assistant is now ready to guide you through indoor spaces
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center mr-4 flex-shrink-0 border border-blue-500/40">
                  <span className="font-semibold text-white text-lg">1</span>
                </div>
                <p className="text-sm text-white/90 pt-2">EchoVision will continuously scan your surroundings using your device's back camera</p>
              </div>

              <div className="flex items-start p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center mr-4 flex-shrink-0 border border-blue-500/40">
                  <span className="font-semibold text-white text-lg">2</span>
                </div>
                <p className="text-sm text-white/90 pt-2">Voice instructions will tell you what objects are detected in front of you</p>
              </div>

              <div className="flex items-start p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center mr-4 flex-shrink-0 border border-blue-500/40">
                  <span className="font-semibold text-white text-lg">3</span>
                </div>
                <p className="text-sm text-white/90 pt-2">Press the center button at any time to scan objects</p>
              </div>
            </div>

            {deviceInfo.isMobile && (
              <div className="mb-6 p-5 bg-gradient-to-br from-blue-900/40 to-blue-800/30 border border-blue-500/40 rounded-xl shadow-lg">
                <div className="flex items-start gap-3">
                  <Cloud className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Cloud Detection for Mobile</p>
                    <p className="text-xs text-white/80 leading-relaxed mb-3">
                      For better performance on mobile devices, consider enabling cloud-based object detection in the settings.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs bg-blue-500/30 text-white border-blue-500/60 hover:bg-blue-500/50 rounded-lg"
                      onClick={() => {
                        setShowApiSettings(false);
                        setShowCloudSettings(true);
                      }}
                    >
                      <Cloud className="h-4 w-4 mr-2" />
                      Setup Cloud Detection
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
              onClick={handleCloseWelcome}
            >
              Begin Assistance
            </Button>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showApiSettings} onOpenChange={setShowApiSettings}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            
            <Tabs value={settingsTab} onValueChange={setSettingsTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vision">Vision APIs</TabsTrigger>
                <TabsTrigger value="speech">Speech Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="vision" className="space-y-4 py-4">
                {deviceInfo.isMobile && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 mb-4">
                    <div className="flex items-start gap-2">
                      <Cloud className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Cloud Detection for Mobile</p>
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                          We recommend using cloud-based detection for better performance on mobile devices.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 h-8 text-xs"
                          onClick={() => {
                            setShowApiSettings(false);
                            setShowCloudSettings(true);
                          }}
                        >
                          <Cloud className="h-3.5 w-3.5 mr-1" />
                          Setup Cloud Detection
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              
                <div className="grid gap-2">
                  <Label htmlFor="azure-api">Azure Computer Vision API URL</Label>
                  <Input
                    id="azure-api"
                    placeholder="https://your-azure-endpoint.cognitiveservices.azure.com/vision/v3.2/analyze"
                    value={apiSettings.azureApiUrl}
                    onChange={(e) => setApiSettings({...apiSettings, azureApiUrl: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="azure-key">Azure API Key</Label>
                  <Input
                    id="azure-key"
                    type="password"
                    placeholder="Your Azure API Key"
                    value={apiSettings.azureApiKey}
                    onChange={(e) => setApiSettings({...apiSettings, azureApiKey: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deepseek-api">DeepSeek API URL</Label>
                  <Input
                    id="deepseek-api"
                    placeholder="https://api.deepseek.com/v1/chat/completions"
                    value={apiSettings.deepseekApiUrl || "https://api.deepseek.com/v1/chat/completions"}
                    onChange={(e) => setApiSettings({...apiSettings, deepseekApiUrl: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deepseek-key">DeepSeek API Key</Label>
                  <Input
                    id="deepseek-key"
                    type="password"
                    placeholder="sk-xxxxxxxx"
                    value={apiSettings.deepseekApiKey}
                    onChange={(e) => setApiSettings({...apiSettings, deepseekApiKey: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored securely in your browser only
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-external-api"
                    checked={apiSettings.useExternalApi}
                    onCheckedChange={(checked) => setApiSettings({...apiSettings, useExternalApi: checked})}
                  />
                  <Label htmlFor="use-external-api">Use External APIs</Label>
                </div>
                
                {apiSettings.useExternalApi && (
                  <div className="mt-2">
                    <Label className="mb-2 block">Preferred API Provider</Label>
                    <RadioGroup 
                      value={apiSettings.preferredProvider}
                      onValueChange={(value) => 
                        setApiSettings({
                          ...apiSettings, 
                          preferredProvider: value as 'azure' | 'deepseek' | 'cloud'
                        })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="azure" id="azure" />
                        <Label htmlFor="azure">Azure Computer Vision</Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="deepseek" id="deepseek" />
                        <Label htmlFor="deepseek">DeepSeek</Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="cloud" id="cloud" />
                        <Label htmlFor="cloud">Cloud Detection</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="speech" className="space-y-4 py-4">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Adjust speech settings for the built-in voice assistant
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-cartesia-tts"
                    checked={apiSettings.useCartesiaTTS}
                    onCheckedChange={(checked) => setApiSettings({...apiSettings, useCartesiaTTS: checked})}
                  />
                  <Label htmlFor="use-cartesia-tts">High-quality TTS (Cartesia)</Label>
                </div>

                {apiSettings.useCartesiaTTS && (
                  <div className="grid gap-2">
                    <Label htmlFor="cartesia-key">Cartesia API Key</Label>
                    <Input
                      id="cartesia-key"
                      type="password"
                      placeholder="Your Cartesia API Key"
                      value={apiSettings.cartesiaApiKey}
                      onChange={(e) => setApiSettings({...apiSettings, cartesiaApiKey: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Stored locally in your browser; used only for TTS
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="continuous-speech"
                    checked={continuousSpeech}
                    onCheckedChange={(checked) => setContinuousSpeech(checked)}
                  />
                  <Label htmlFor="continuous-speech">Continuous speech announcements</Label>
                </div>
                
                {continuousSpeech && (
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor="speech-interval">Announcement Interval (seconds)</Label>
                    <div className="flex items-center">
                      <span className="text-xs pr-2">3s</span>
                      <input
                        id="speech-interval"
                        type="range"
                        min="3000"
                        max="15000"
                        step="1000"
                        value={speechInterval}
                        className="flex-1 cursor-pointer"
                        onChange={(e) => setSpeechInterval(parseInt(e.target.value))}
                      />
                      <span className="text-xs pl-2">15s</span>
                    </div>
                    <div className="text-center text-sm mt-1">{(speechInterval / 1000).toFixed(0)} seconds</div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="speech-rate">Speech Rate</Label>
                  <div className="flex items-center">
                    <span className="text-xs pr-2">Slow</span>
                    <input
                      id="speech-rate"
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={apiSettings.speechRate}
                      className="flex-1 cursor-pointer"
                      onChange={(e) => setApiSettings({...apiSettings, speechRate: parseFloat(e.target.value)})}
                    />
                    <span className="text-xs pl-2">Fast</span>
                  </div>
                  <div className="text-center text-sm mt-1">{apiSettings.speechRate.toFixed(1)}x</div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="speech-volume">Volume</Label>
                  <div className="flex items-center">
                    <span className="text-xs pr-2">Quiet</span>
                    <input
                      id="speech-volume"
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={apiSettings.speechVolume}
                      className="flex-1 cursor-pointer"
                      onChange={(e) => setApiSettings({...apiSettings, speechVolume: parseFloat(e.target.value)})}
                    />
                    <span className="text-xs pl-2">Loud</span>
                  </div>
                  <div className="text-center text-sm mt-1">{Math.round(apiSettings.speechVolume * 100)}%</div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={async () => {
                    if (apiSettings.useCartesiaTTS && apiSettings.cartesiaApiKey) {
                      try { await textToSpeech("This is a test of the speech settings. How does this sound?"); } catch {}
                    } else {
                      speak("This is a test of the speech settings. How does this sound?", {
                        rate: apiSettings.speechRate,
                        volume: apiSettings.speechVolume,
                        queueMode: 'immediate'
                      })
                    }
                  }}
                >
                  Test Speech
                </Button>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button onClick={handleSaveApiSettings}>
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      {/* Cloud Detection Settings Dialog */}
      <CloudDetectionSettings
        open={showCloudSettings}
        onOpenChange={setShowCloudSettings}
        settings={{
          cloudApiUrl: apiSettings.cloudApiUrl,
          cloudApiKey: apiSettings.cloudApiKey,
          useCloudDetection: apiSettings.useCloudDetection
        }}
        onSettingsChange={(newSettings) => {
          setApiSettings(prev => ({
            ...prev,
            ...newSettings
          }));
        }}
        onSave={handleSaveCloudSettings}
      />
    </div>
  );
};

export default Camera;
