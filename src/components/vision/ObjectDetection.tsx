
import React from 'react';
import { Info, DoorClosed, ArrowUp, ArrowDown, Navigation, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeObjectLabel } from '@/utils/mobileDetectionHelper';

export interface DetectedObject {
  id: number;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  distance?: number; // Estimated distance in meters
}

interface ObjectDetectionProps {
  detections: DetectedObject[];
  className?: string;
  showLabels?: boolean;
  source?: 'local' | 'cloud' | 'azure' | 'deepseek';
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({
  detections,
  className,
  showLabels = true,
  source = 'local'
}) => {
  // Filter to only show objects within 11 meters
  const nearbyDetections = detections.filter(det => 
    det.distance !== undefined && det.distance <= 11.0
  );
  
  // Check if a detection is a door, doorway, or step
  const isAccessElement = (label: string): { isAccess: boolean, type: 'door' | 'doorway' | 'steps' | null } => {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('door') || lowerLabel === 'entrance') {
      return { isAccess: true, type: 'door' };
    }
    
    if (lowerLabel.includes('doorway') || lowerLabel.includes('threshold') || lowerLabel.includes('entry')) {
      return { isAccess: true, type: 'doorway' };
    }
    
    if (lowerLabel.includes('step') || lowerLabel.includes('stair') || 
        lowerLabel.includes('stairs') || lowerLabel.includes('stairway') || 
        lowerLabel.includes('staircase')) {
      return { isAccess: true, type: 'steps' };
    }
    
    return { isAccess: false, type: null };
  };
  
  // Color coding based on distance and object type
  const getColorByDistance = (distance: number | undefined, label: string): string => {
    const { isAccess, type } = isAccessElement(label);
    
    if (isAccess) {
      // Highlight access elements with special colors
      if (type === 'door') return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      if (type === 'doorway') return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
      if (type === 'steps') return 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
    }
    
    if (distance === undefined) return 'border-primary';
    if (distance < 2.0) return 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'; // Very close objects - red
    if (distance < 5.0) return 'border-orange-500'; // Close objects - orange
    if (distance < 8.0) return 'border-yellow-500'; // Medium distance - yellow
    return 'border-green-500'; // Further away (8-11m) - green
  };
  
  // Get appropriate icon for access elements
  const getAccessIcon = (label: string) => {
    const { isAccess, type } = isAccessElement(label);
    
    if (!isAccess) return null;
    
    if (type === 'door') {
      return <DoorClosed className="h-4 w-4 mr-1 text-blue-500" />;
    }
    
    if (type === 'steps') {
      return <ArrowDown className="h-4 w-4 mr-1 text-amber-500" />;
    }
    
    return null;
  };

  // Show additional help message for mobile users when no detections
  const getHelpMessage = () => {
    if (detections.length === 0) {
      return "Try moving your camera slowly";
    }
    if (detections.length > 0 && nearbyDetections.length === 0) {
      return "No objects within 11 meters";
    }
    return "";
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Red border highlighting (optional) for object tracking/visualization */}
      <div className="absolute inset-0 border-2 border-red-500/30 pointer-events-none z-0"></div>
      
      {nearbyDetections.map((detection) => {
        const { isAccess } = isAccessElement(detection.label);
        
        return (
          <div
            key={detection.id}
            className={cn(
              "absolute border-2 rounded-lg", 
              getColorByDistance(detection.distance, detection.label),
              isAccess ? "border-dashed animate-pulse" : "border-solid"
            )}
            style={{
              left: `${detection.bbox.x * 100}%`,
              top: `${detection.bbox.y * 100}%`,
              width: `${detection.bbox.width * 100}%`,
              height: `${detection.bbox.height * 100}%`,
            }}
          >
            {showLabels && (
              <div className="absolute -top-9 left-0 glass-card px-2 py-1.5 rounded-md text-xs font-medium flex items-center backdrop-blur-sm bg-black/70 text-white border border-white/20 shadow-lg">
                {getAccessIcon(detection.label)}
                <span className="mr-2">{normalizeObjectLabel(detection.label)}</span>
                <span className="bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {Math.round(detection.confidence * 100)}%
                </span>
                {detection.distance !== undefined && (
                  <span className={cn(
                    "ml-2 bg-black/50 px-1.5 py-0.5 rounded-full", 
                    detection.distance < 3.0 ? "text-red-400 font-bold" : "text-white/90"
                  )}>
                    {detection.distance.toFixed(1)}m
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {detections.length === 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 glass-card px-5 py-2.5 rounded-full text-sm font-medium flex items-center shadow-lg border border-white/20">
          <Info className="h-4 w-4 mr-2 text-primary" />
          <span>No objects detected</span>
        </div>
      )}
      
      {detections.length > 0 && nearbyDetections.length === 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 glass-card px-5 py-2.5 rounded-full text-sm font-medium flex items-center shadow-lg border border-white/20">
          <Info className="h-4 w-4 mr-2 text-primary" />
          <span>No objects within 11 meters</span>
        </div>
      )}
      
      {/* Indicator for detection source when detections exist */}
      {detections.length > 0 && (
        <div className="absolute top-4 right-4">
          <div className={cn(
            "text-xs px-3 py-1.5 rounded-full font-medium shadow-lg border border-white/20 backdrop-blur-sm",
            source === 'cloud' ? "bg-purple-500/90 text-white" : 
            source === 'azure' ? "bg-blue-500/90 text-white" :
            source === 'deepseek' ? "bg-green-500/90 text-white" :
            "bg-gray-700/90 text-white"
          )}>
            {source === 'cloud' ? "Cloud AI" : 
             source === 'azure' ? "Azure Vision" :
             source === 'deepseek' ? "DeepSeek AI" :
             "Local AI"}
          </div>
        </div>
      )}
      
      {/* Object details popup (for the primary detection) */}
      {nearbyDetections.length > 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 glass-card px-4 py-3 rounded-xl text-sm font-medium flex items-center shadow-lg border border-white/20 max-w-[90%] bg-black/70">
          {getAccessIcon(nearbyDetections[0].label) || <AlertCircle className="h-4 w-4 mr-2 text-primary" />}
          <span className="text-white">
            {normalizeObjectLabel(nearbyDetections[0].label)} 
            {nearbyDetections[0].distance !== undefined && (
              <span> {nearbyDetections[0].distance.toFixed(1)} meters 
              {nearbyDetections[0].bbox.x < 0.4 ? " to your left" :
               nearbyDetections[0].bbox.x > 0.6 ? " to your right" : " ahead"}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default ObjectDetection;
