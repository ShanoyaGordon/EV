
import React, { useState, useEffect } from 'react';
import { Volume2, ChevronUp, ChevronDown, AlertCircle, DoorClosed, ArrowDown, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NavigationInstruction {
  id: number;
  text: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  type?: 'door' | 'doorway' | 'steps' | 'general';
}

interface NavigationInstructionsProps {
  instructions?: NavigationInstruction[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

const NavigationInstructions: React.FC<NavigationInstructionsProps> = ({
  instructions = [],
  isExpanded = false,
  onToggleExpand,
  className
}) => {
  const [mockInstructions, setMockInstructions] = useState<NavigationInstruction[]>([
    {
      id: 1,
      text: "Door detected about 4 meters ahead. Path appears clear to approach.",
      priority: 'medium',
      timestamp: new Date(),
      type: 'door'
    },
    {
      id: 2,
      text: 'Conference table detected 3 meters ahead. There appears to be an open seat at the far end.',
      priority: 'low',
      timestamp: new Date(Date.now() - 30000),
      type: 'general'
    },
    {
      id: 3,
      text: 'Caution: Steps detected 2 meters ahead. Three steps going down.',
      priority: 'high',
      timestamp: new Date(Date.now() - 60000),
      type: 'steps'
    }
  ]);

  const allInstructions = instructions.length > 0 ? instructions : mockInstructions;
  
  const sortedInstructions = [...allInstructions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const highPriorityInstruction = sortedInstructions.find(instr => instr.priority === 'high');
  
  const primaryInstruction = highPriorityInstruction || sortedInstructions[0];
  
  // Get the appropriate icon based on instruction type
  const getInstructionIcon = (type?: 'door' | 'doorway' | 'steps' | 'general') => {
    switch (type) {
      case 'door':
      case 'doorway':
        return <DoorClosed className="h-5 w-5 text-blue-500 mr-2" />;
      case 'steps':
        return <ArrowDown className="h-5 w-5 text-amber-500 mr-2" />;
      default:
        return primaryInstruction?.priority === 'high' ? (
          <AlertCircle className="h-5 w-5 text-destructive animate-pulse mr-2" />
        ) : (
          <Navigation className="h-5 w-5 text-primary mr-2" />
        );
    }
  };
  
  // Priority badge color
  const getPriorityBadgeColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className={cn(
      "glass-card rounded-xl overflow-hidden shadow-lg transition-all duration-300 border border-white/20", 
      isExpanded ? "max-h-96" : "max-h-24",
      className
    )}>
      <div className="flex items-start p-4 border-b border-white/10 bg-black/50">
        <div className="flex-shrink-0 mr-2">
          {primaryInstruction ? getInstructionIcon(primaryInstruction.type) : (
            <Navigation className="h-5 w-5 text-primary" />
          )}
        </div>
        
        <div className="flex-1">
          {primaryInstruction ? (
            <div className="flex items-start">
              <p className={cn(
                "text-sm text-white",
                primaryInstruction.priority === 'high' && "font-medium"
              )}>
                {primaryInstruction.text}
              </p>
            </div>
          ) : (
            <p className="text-sm text-white/70">No navigation instructions yet.</p>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2 flex-shrink-0 p-0 h-6 w-6 text-white hover:bg-white/10"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isExpanded && sortedInstructions.length > 1 && (
        <div className="p-4 max-h-80 overflow-y-auto bg-black/30 backdrop-blur-md">
          <h3 className="text-xs uppercase text-white/70 font-medium mb-3">Previous Instructions</h3>
          <div className="space-y-4">
            {sortedInstructions.slice(1).map(instruction => (
              <div key={instruction.id} className="flex items-start p-3 bg-black/20 rounded-lg border border-white/10">
                <div className="flex-shrink-0 mr-2">
                  {getInstructionIcon(instruction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className={cn(
                      "inline-block px-2 py-0.5 text-[10px] rounded-full text-white font-medium mr-2",
                      getPriorityBadgeColor(instruction.priority)
                    )}>
                      {instruction.priority.toUpperCase()}
                    </span>
                    <p className="text-xs text-white/60">
                      {formatTimestamp(instruction.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-white">{instruction.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  
  return date.toLocaleString();
};

export default NavigationInstructions;
