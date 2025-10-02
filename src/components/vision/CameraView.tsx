
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface CameraViewProps {
  onFrame?: (imageData: ImageData) => void;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  facingMode?: 'user' | 'environment'; 
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onFrame,
  className,
  videoRef: externalVideoRef,
  facingMode = 'environment' 
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const startingCameraRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState(0);
  const isMobile = useIsMobile();
  
  // Use external ref if provided, otherwise use internal ref
  const videoReference = externalVideoRef || internalVideoRef;

  // Keep latest onFrame in a ref to avoid changing function identities
  const onFrameRef = useRef<typeof onFrame>(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  // Clean up function to properly stop stream and animation
  const cleanupCamera = useCallback(() => {
    // Cancel any pending animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset video element
    if (videoReference.current && videoReference.current.srcObject) {
      videoReference.current.srcObject = null;
    }
    
    setIsActive(false);
  }, [videoReference]);

  // Process video frames when camera is active
  const processVideoFrames = useCallback(() => {
    const callback = onFrameRef.current;
    if (!videoReference.current || !canvasRef.current || !callback) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Make sure video is actually playing and has dimensions
    if (videoReference.current.readyState < 2 || 
        !videoReference.current.videoWidth || 
        !videoReference.current.videoHeight) {
      // Video not ready yet, try again in the next frame
      animationRef.current = requestAnimationFrame(processVideoFrames);
      return;
    }
    
    // Set canvas dimensions to match video
    canvasRef.current.width = videoReference.current.videoWidth;
    canvasRef.current.height = videoReference.current.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(
      videoReference.current, 
      0, 0, 
      videoReference.current.videoWidth, 
      videoReference.current.videoHeight
    );
    
    try {
      // Get image data from canvas
      const imageData = ctx.getImageData(
        0, 0, 
        canvasRef.current.width, 
        canvasRef.current.height
      );
      
      // Pass image data to callback
      callback(imageData);
    } catch (err) {
      console.error('Error processing frame:', err);
      // Don't set error state here to avoid interrupting the camera feed
    }
    
    // Continue processing frames
    animationRef.current = requestAnimationFrame(processVideoFrames);
  }, [videoReference]);

  // Start the camera
  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous camera start attempts
    if (startingCameraRef.current) {
      console.log('Camera start already in progress, skipping request');
      return;
    }
    
    // Set flag to indicate camera start in progress
    startingCameraRef.current = true;
    
    // Clean up any existing camera resources only if we are switching or recovering
    if (isActive || streamRef.current) {
      cleanupCamera();
    }
    
    // Show loading state
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get access to the camera with the requested facing mode
      const mobileFacingMode = isMobile ? facingMode : 'environment';
      
      // For mobile, we'll simplify constraints to improve compatibility
      const constraints = {
        video: isMobile 
          ? {
              facingMode: mobileFacingMode,
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15, max: 24 }
            }
          : {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 24, max: 30 }
            },
        audio: false
      };
      
      console.log(`Attempting to access camera with mode: ${isMobile ? mobileFacingMode : facingMode}`);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store stream in ref for cleanup
      streamRef.current = stream;
      
      if (videoReference.current) {
        // Connect stream to video element
        videoReference.current.srcObject = stream;
        
        // Use promise to handle play success/failure
        await videoReference.current.play();
        
        // Camera is now active
        setIsActive(true);
        setIsLoading(false);
        setRetryCount(0);
        startingCameraRef.current = false;
        
        // Start processing frames if callback provided
        if (onFrame) {
          processVideoFrames();
        }
        
        console.log('Camera started successfully');
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      // Do not immediately cleanup if we already have a playing stream to avoid flicker
      if (!isActive) {
        cleanupCamera();
      }
      startingCameraRef.current = false;
      
      // Enhanced error messages for mobile users
      if (isMobile) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission denied. For mobile browsers, you may need to grant the permission in your browser settings and ensure the site is using HTTPS.');
          
          toast({
            variant: "destructive",
            title: "Camera Permission Denied",
            description: "For mobile browsers, you need to grant camera permission in your settings menu",
          });
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Cannot access your camera. Try closing other apps that might be using it.');
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          // For mobile, try with very basic constraints if the first attempt failed
          if (retryCount === 0) {
            setRetryCount(prev => prev + 1);
            setError('Retrying with simpler camera settings...');
            setTimeout(() => {
              startCamera();
            }, 800);
            return;
          } else {
            setError('Your camera does not support the required settings. Try with a different browser.');
          }
        } else {
          setError(`Camera error: ${err.message || 'Unknown mobile browser camera issue'}`);
        }
      } else {
        // Set appropriate error message based on error type for desktop
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please check your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera detected on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is already in use by another application.');
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          setError('Camera does not support the requested settings. Trying alternative...');
          // Try again with less specific constraints if this was a constraint error
          if (retryCount === 0) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              startCamera();
            }, 500);
            return;
          }
        } else if (err.name === 'AbortError') {
          setError('Camera initialization was interrupted. Please try again.');
          // AbortError can happen when multiple requests occur, so we'll automatically retry once
          if (retryCount === 0) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              startCamera();
            }, 800);
            return;
          }
        } else {
          setError(`Camera error: ${err.message || 'Unknown error'}`);
        }
      }
      
      setIsLoading(false);
      
      // Show toast notification for the error
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: err.message || "Failed to access camera",
      });
    }
  }, [facingMode, processVideoFrames, cleanupCamera, retryCount, isMobile]);

  // Initialize camera when component mounts
  useEffect(() => {
    // Wait a moment before initializing to prevent race conditions
    const initTimer = setTimeout(() => {
      startCamera();
    }, 300);
    
    // Clean up when component unmounts
    return () => {
      clearTimeout(initTimer);
      cleanupCamera();
    };
  }, []);

  // Handle facing mode changes only when the facingMode value actually changes
  const previousFacingModeRef = useRef<typeof facingMode>(facingMode);
  useEffect(() => {
    if (previousFacingModeRef.current !== facingMode) {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      previousFacingModeRef.current = facingMode;
      return () => clearTimeout(timer);
    }
  }, [facingMode, startCamera]);

  // Function to retry camera access
  const retryCamera = () => {
    // Prevent rapid retries
    const now = Date.now();
    if (now - lastRetryTime < 1000) {
      console.log('Throttling retry attempts');
      return;
    }
    
    setLastRetryTime(now);
    setRetryCount(0);
    startCamera();
  };

  return (
    <div className={cn('camera-viewport relative bg-black w-full h-full', className)}>
      <video 
        ref={videoReference}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        playsInline
        muted
        autoPlay
      />
      
      <canvas 
        ref={canvasRef}
        className="hidden" // Hidden canvas for processing
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <Loader2 className="h-10 w-10 text-white animate-spin mb-4" />
          <p className="text-white text-lg font-medium">Accessing camera...</p>
          {isMobile && (
            <p className="text-white/70 text-sm mt-2 text-center px-6">
              Please allow camera access when prompted by your browser
            </p>
          )}
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 p-6">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">Camera Error</h3>
          <p className="text-white/80 text-center mb-6">{error}</p>
          {isMobile && (
            <div className="text-white/70 text-sm mb-6 max-w-xs text-center">
              <p className="font-medium mb-2">Mobile Troubleshooting:</p>
              <ul className="list-disc text-left pl-6 space-y-1">
                <li>Ensure you've given camera permission</li>
                <li>Try using Chrome or Safari</li>
                <li>Close other apps using your camera</li>
                <li>Reload the page and try again</li>
              </ul>
            </div>
          )}
          <Button onClick={retryCamera} className="bg-white text-black hover:bg-gray-200">
            Retry Camera Access
          </Button>
        </div>
      )}
      
      {/* No camera active or error and not loading - show placeholder */}
      {(!isActive && !isLoading) && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-5">
          <Camera className="h-12 w-12 text-white/40 mb-4" />
          <p className="text-white/60 text-center mb-6">Camera inactive</p>
          <Button onClick={retryCamera} className="bg-white text-black hover:bg-gray-200">
            Start Camera
          </Button>
          {isMobile && (
            <p className="text-white/70 text-sm mt-6 max-w-xs text-center">
              For mobile devices, you may need to allow camera permissions when prompted
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraView;
