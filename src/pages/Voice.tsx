
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import VoiceListener from '@/components/vision/VoiceListener';
import { Button } from '@/components/ui/button';
import { Info, MessageSquare, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceCommandHistory {
  id: number;
  command: string;
  response: string;
  timestamp: Date;
}

const Voice = () => {
  const [isListening, setIsListening] = useState(false);
  const [commandHistory, setCommandHistory] = useState<VoiceCommandHistory[]>([
    {
      id: 1,
      command: "What's in front of me?",
      response: "I can see a table about 3 meters ahead with several chairs around it. There appears to be an empty seat on the far side.",
      timestamp: new Date(Date.now() - 120000)
    },
    {
      id: 2,
      command: "Are there any obstacles nearby?",
      response: "There's a chair about 2 meters to your right. Consider moving slightly to the left to avoid it.",
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  
  const [responseText, setResponseText] = useState<string>('');
  const [currentCommand, setCurrentCommand] = useState<string>('');
  
  const toggleListening = () => {
    setIsListening(!isListening);
  };
  
  const handleVoiceCommand = (command: string) => {
    setCurrentCommand(command);
    
    // Mock responses based on the command
    let response = '';
    if (command.toLowerCase().includes('describe') || command.toLowerCase().includes('what')) {
      response = "I see a conference room with a large table in the center. There are approximately 8 chairs around it, and 3 people are seated on the far side. There's a projector screen on the wall ahead.";
    } else if (command.toLowerCase().includes('obstacle') || command.toLowerCase().includes('nearby')) {
      response = "The nearest obstacle is a chair about 1.5 meters to your left. There's clear path ahead for about 4 meters.";
    } else if (command.toLowerCase().includes('exit') || command.toLowerCase().includes('door')) {
      response = "The nearest exit is approximately 10 meters behind you. Turn around 180 degrees and proceed straight ahead.";
    } else if (command.toLowerCase().includes('chair') || command.toLowerCase().includes('sit')) {
      response = "There's an empty chair about 3 meters ahead, slightly to your right. There's a clear path to reach it.";
    } else if (command.toLowerCase().includes('table') || command.toLowerCase().includes('conference')) {
      response = "The conference table is 4 meters ahead. There are people seated on the other side, but several empty chairs on this side.";
    } else {
      response = "I'm processing your request. I can describe what's around you, identify obstacles, or help you navigate to specific objects.";
    }
    
    // Simulate typing effect for the response
    let i = 0;
    const typeEffect = () => {
      if (i < response.length) {
        setResponseText(response.substring(0, i + 1));
        i++;
        setTimeout(typeEffect, 30);
      } else {
        // When done typing, add to history
        const newHistoryItem: VoiceCommandHistory = {
          id: Date.now(),
          command: command,
          response: response,
          timestamp: new Date()
        };
        
        setCommandHistory(prev => [newHistoryItem, ...prev]);
        
        // Reset after a delay
        setTimeout(() => {
          setCurrentCommand('');
          setResponseText('');
        }, 3000);
      }
    };
    
    // Start typing effect after a short delay
    setTimeout(typeEffect, 500);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Voice Commands</h1>
          <p className="text-muted-foreground">
            Ask questions or give commands using your voice
          </p>
        </div>
        
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex flex-col items-center">
            <VoiceListener 
              isListening={isListening} 
              onVoiceCommand={handleVoiceCommand}
              className="mb-4"
            />
            
            <Button
              onClick={toggleListening}
              className={cn(
                "min-w-40",
                isListening && "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isListening ? "Stop Listening" : "Start Listening"}
            </Button>
          </div>
          
          {/* Current command and response */}
          {(currentCommand || responseText) && (
            <div className="mt-6 pt-6 border-t border-border/40">
              {currentCommand && (
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3 flex-shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="glass-card px-3 py-2 rounded-xl rounded-tl-none">
                    <p className="text-sm">{currentCommand}</p>
                  </div>
                </div>
              )}
              
              {responseText && (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3 flex-shrink-0">
                    <Info className="h-4 w-4 text-white" />
                  </div>
                  <div className="glass-card px-3 py-2 rounded-xl rounded-tl-none bg-primary/10">
                    <p className="text-sm">{responseText}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Command history */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex items-center mb-4">
            <List className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-medium">Recent Commands</h2>
          </div>
          
          <div className="space-y-4">
            {commandHistory.map(item => (
              <div key={item.id} className="glass-card p-3 rounded-xl">
                <p className="text-sm font-medium mb-1">{item.command}</p>
                <p className="text-xs text-muted-foreground mb-2">{item.response}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(item.timestamp)}
                </p>
              </div>
            ))}
            
            {commandHistory.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No command history yet
              </p>
            )}
          </div>
        </div>
        
        {/* Command suggestions */}
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-lg font-medium mb-3">Try Saying</h2>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="justify-start text-left h-auto py-2">
              "What's in front of me?"
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-2">
              "Are there any obstacles nearby?"
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-2">
              "Where is the nearest chair?"
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-2">
              "Help me find the exit"
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper function to format timestamps
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  
  return date.toLocaleString();
};

export default Voice;
