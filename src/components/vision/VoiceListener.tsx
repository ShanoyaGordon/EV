import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceListenerProps {
  isListening?: boolean;
  onVoiceCommand?: (command: string) => void;
  className?: string;
}

// This component is no longer used based on the user's request
// Keeping a minimal implementation for backward compatibility
const VoiceListener: React.FC<VoiceListenerProps> = ({
  isListening = false,
  onVoiceCommand,
  className
}) => {
  return null; // Return null to render nothing
};

export default VoiceListener;
