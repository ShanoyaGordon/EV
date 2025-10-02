
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import CameraView from './CameraView';
import VoiceAssistant from './VoiceAssistant';
import NavigationInstructions, { NavigationInstruction } from './NavigationInstructions';
import ObjectDetection, { DetectedObject } from './ObjectDetection';

interface DemoViewProps {
  onBack?: () => void;
}

const DemoView: React.FC<DemoViewProps> = ({ onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create navigation instructions from detected objects
  const [navigationInstructions, setNavigationInstructions] = useState<NavigationInstruction[]>([]);
  
  useEffect(() => {
    // Simulate object detection process with demo data
    const startDemoDetection = () => {
      setIsProcessing(true);
      
      // Clear any existing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      // Set timeout to simulate processing delay
      processingTimeoutRef.current = setTimeout(() => {
        const demoObjects: DetectedObject[] = [
          {
            id: 1,
            label: 'chair',
            confidence: 0.89,
            bbox: {
              x: 0.1,
              y: 0.2,
              width: 0.2,
              height: 0.3
            },
            distance: 2.5
          },
          {
            id: 2,
            label: 'table',
            confidence: 0.76,
            bbox: {
              x: 0.5,
              y: 0.6,
              width: 0.3,
              height: 0.2
            },
            distance: 3.8
          },
          {
            id: 3,
            label: 'door',
            confidence: 0.92,
            bbox: {
              x: 0.7,
              y: 0.3,
              width: 0.25,
              height: 0.4
            },
            distance: 5.2
          }
        ];
        
        setDetectedObjects(demoObjects);
        setIsProcessing(false);
        
        // Create navigation instructions from detected objects
        const instructions: NavigationInstruction[] = demoObjects.map((obj, index) => {
          const priority = obj.distance && obj.distance < 1.5 ? 'high' : 
                          obj.distance && obj.distance < 3.0 ? 'medium' : 'low';
          
          let text = '';
          if (obj.distance && obj.distance < 1.5) {
            text = `Caution: ${obj.label} very close ahead, about ${obj.distance.toFixed(1)} meters away.`;
          } else if (obj.bbox.x < 0.4) {
            text = `${obj.label} detected on your left, about ${obj.distance?.toFixed(1)} meters away.`;
          } else if (obj.bbox.x > 0.6) {
            text = `${obj.label} detected on your right, about ${obj.distance?.toFixed(1)} meters away.`;
          } else {
            text = `${obj.label} detected ahead, about ${obj.distance?.toFixed(1)} meters away.`;
          }
          
          return {
            id: index + 1,
            text,
            priority,
            timestamp: new Date(Date.now() - (index * 15000)) // Stagger timestamps
          };
        });
        
        setNavigationInstructions(instructions);
        
        // Provide audio feedback using Cartesia service
        textToSpeech('Objects detected in demo mode. Found chair, table, and door.');
        
        // Show toast notification
        toast({
          title: "Demo Detection Complete",
          description: "Found 3 objects in the scene",
        });
      }, 2000);
    };
    
    // Start demo detection on component mount
    startDemoDetection();
    
    // Clean up timeout on unmount
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleVoiceCommand = (command: string) => {
    setTranscript(command);
    // Process the voice command here
    toast({
      title: "Voice Command Received",
      description: command,
    });
  };

  const handleToggleExpand = () => {
    setIsInstructionsExpanded(!isInstructionsExpanded);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Camera View with Object Detection Overlay */}
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
        <CameraView className="h-full" />
        
        {/* Object Detection Overlay */}
        <ObjectDetection 
          detections={detectedObjects}
          showLabels={true}
          source="local"
        />
        
        {/* Navigation Instructions */}
        <NavigationInstructions 
          instructions={navigationInstructions}
          isExpanded={isInstructionsExpanded}
          onToggleExpand={handleToggleExpand}
          className="absolute bottom-4 left-4 right-4"
        />
      </div>
      
      {/* Voice Assistant Section */}
      <VoiceAssistant 
        isListening={isListening}
        onVoiceCommand={handleVoiceCommand}
        className="absolute bottom-24 right-4"
      />
    </div>
  );
};

export default DemoView;
