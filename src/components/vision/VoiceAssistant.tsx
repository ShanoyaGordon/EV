
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { textToSpeech, stopSpeech } from '@/utils/cartesiaService';

interface VoiceAssistantProps {
  isListening?: boolean;
  onVoiceCommand?: (command: string) => void;
  className?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isListening = false,
  onVoiceCommand,
  className
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(isListening);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionStartedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        console.log('Voice recognition started');
        recognitionStartedRef.current = true;
        setIsRecording(true);
      };
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        
        console.log('Voice recognition result:', transcriptText);
        setTranscript(transcriptText);
        
        if (result.isFinal && onVoiceCommand) {
          onVoiceCommand(transcriptText);
          setTranscript('');
        }
      };
      
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Voice recognition error:', event.error);
        if (event.error === 'no-speech') {
          // No speech detected, restart recognition
          stopRecognition();
          setTimeout(startRecognition, 1000);
        }
      };
      
      recognitionRef.current.onend = () => {
        console.log('Voice recognition ended');
        recognitionStartedRef.current = false;
        // Restart recognition if it was supposed to be listening
        if (isListening) {
          setTimeout(startRecognition, 1000);
        } else {
          setIsRecording(false);
        }
      };
      
      if (isListening) {
        startRecognition();
      }
    } else {
      console.error('Speech recognition not supported in this browser');
    }
    
    // Monitor speech synthesis to update UI
    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);
    
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
    });
    
    if ('addEventListener' in window.speechSynthesis) {
      window.speechSynthesis.addEventListener('start', handleSpeechStart);
      window.speechSynthesis.addEventListener('end', handleSpeechEnd);
      window.speechSynthesis.addEventListener('pause', handleSpeechEnd);
      window.speechSynthesis.addEventListener('resume', handleSpeechStart);
    }
    
    // Cleanup
    return () => {
      stopRecognition();
      
      if ('removeEventListener' in window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('start', handleSpeechStart);
        window.speechSynthesis.removeEventListener('end', handleSpeechEnd);
        window.speechSynthesis.removeEventListener('pause', handleSpeechEnd);
        window.speechSynthesis.removeEventListener('resume', handleSpeechStart);
      }
    };
  }, [isListening, onVoiceCommand]);

  useEffect(() => {
    // Update recording state when isListening changes
    if (isListening && !isRecording && recognitionRef.current) {
      startRecognition();
    } else if (!isListening && isRecording) {
      stopRecognition();
    }
  }, [isListening, isRecording]);

  const startRecognition = () => {
    try {
      if (recognitionRef.current && !recognitionStartedRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };

  const stopRecognition = () => {
    try {
      if (recognitionRef.current && recognitionStartedRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  const toggleRecognition = () => {
    if (isRecording) {
      stopRecognition();
      setIsRecording(false);
    } else {
      startRecognition();
      setIsRecording(true);
    }
  };

  // Replace the speak function with Cartesia service
  const speak = async (text: string) => {
    // Stop any ongoing speech
    stopSpeech();
    
    // Set speaking state
    setIsSpeaking(true);
    
    // Use the Cartesia TTS service
    const result = await textToSpeech(text);
    
    // If Cartesia TTS completed successfully or failed, update UI
    if (!result) {
      setIsSpeaking(false);
    }
  };

  return (
    <div className={cn("voice-assistant glass-card rounded-full p-4", className)}>
      <div className="relative flex flex-col items-center">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "w-14 h-14 rounded-full",
            isRecording ? "bg-primary text-white" : "bg-muted",
            isSpeaking ? "ring-2 ring-primary ring-offset-2" : ""
          )}
          onClick={toggleRecognition}
        >
          {isRecording ? (
            <Mic className="h-6 w-6" />
          ) : (
            <MicOff className="h-6 w-6" />
          )}
        </Button>
        
        {isSpeaking && (
          <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
            <Volume2 className="h-4 w-4" />
          </div>
        )}
        
        {isRecording && (
          <div className="mt-4 voice-pulse">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        {transcript && (
          <div className="mt-4 glass-card px-4 py-2 rounded-full max-w-xs animate-fade-in">
            <p className="text-sm text-center">{transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
