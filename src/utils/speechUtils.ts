
import { DetectedObject } from '@/components/vision/ObjectDetection';
import { normalizeObjectLabel } from '@/utils/mobileDetectionHelper';

// Speech queue for managing multiple announcements
let speechQueue: {
  text: string;
  options: {
    rate: number;
    volume: number;
    voice?: SpeechSynthesisVoice;
    queueMode?: 'append' | 'flush' | 'immediate';
    interrupt?: boolean;
  };
  resolve: () => void;
  reject: (reason?: any) => void;
}[] = [];

let isSpeaking = false;
let availableVoices: SpeechSynthesisVoice[] = [];
let preferredVoice: SpeechSynthesisVoice | null = null;
let initialized = false;
let speechWatchdog: number | null = null;

// Initialize speech synthesis
export function initSpeechSynthesis() {
  if (initialized) return;
  
  try {
    if (!('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported in this browser');
      return;
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Load available voices
    const loadVoices = () => {
      availableVoices = window.speechSynthesis.getVoices();
      console.log(`Voices loaded: ${availableVoices.length}`);
      
      // Voice selection strategy for iOS
      if (isIOS) {
        // On iOS, prefer the first available voice that matches the system language
        const systemLang = navigator.language || 'en-US';
        const matchingVoices = availableVoices.filter(
          voice => voice.lang.startsWith(systemLang.split('-')[0])
        );
        
        if (matchingVoices.length > 0) {
          preferredVoice = matchingVoices[0];
        } else if (availableVoices.length > 0) {
          // Fallback to first available voice
          preferredVoice = availableVoices[0];
        }
      } else {
        // Original voice selection for non-iOS platforms
        const englishVoices = availableVoices.filter(
          voice => voice.lang.includes('en') && !voice.name.includes('Google')
        );
        
        if (englishVoices.length > 0) {
          preferredVoice = englishVoices[0];
        } else if (availableVoices.length > 0) {
          preferredVoice = availableVoices[0];
        }
      }
    };
    
    // iOS Safari and Chrome require initial speak() call during a user gesture
    if (isIOS) {
      // Create a silent utterance
      const silence = new SpeechSynthesisUtterance('');
      silence.volume = 0;
      silence.rate = 1.0;
      
      // Force unlock audio context on iOS
      const unlockAudio = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(0);
        oscillator.stop(0.001);
        
        // Speak the silent utterance
        window.speechSynthesis.speak(silence);
        
        // Resume audio context
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        // Mark that we've had a user gesture for iOS speech gating
        inUserGesture = true;
        
        // Remove the event listeners after first use
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      };
      
      // Add event listeners for user interaction
      document.addEventListener('touchstart', unlockAudio);
      document.addEventListener('touchend', unlockAudio);
      document.addEventListener('click', unlockAudio);
    }
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.getVoices().length) {
      loadVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize speech synthesis:', error);
  }
}

// Check if running on iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Track if we're in a user gesture context
let inUserGesture = false;
export function setInUserGesture(value: boolean) {
  inUserGesture = value;
}

// Function to speak text
export async function speak(
  text: string,
  options: {
    rate?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
    queueMode?: 'append' | 'flush' | 'immediate';
    interrupt?: boolean;
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // iOS specific checks
    if (isIOS && !inUserGesture) {
      reject(new Error('Speech synthesis on iOS requires user interaction. Please try again after tapping a button.'));
      return;
    }
    
    // Default options
    const defaultOptions = {
      rate: isIOS ? 0.8 : 1.0, // Slightly slower on iOS for better reliability
      volume: 1.0,
      voice: preferredVoice || undefined,
      queueMode: 'append' as 'append' | 'flush' | 'immediate',
      interrupt: false
    };
    
    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Clean the queue if requested
    if (mergedOptions.queueMode === 'flush') {
      speechQueue = [];
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
      }
    }
    
    // If immediate, speak right now
    if (mergedOptions.queueMode === 'immediate') {
      if (isSpeaking && mergedOptions.interrupt) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
      }
      
      if (isSpeaking) {
        reject(new Error('Speech already in progress'));
        return;
      }
      
      try {
        speakNow(text, mergedOptions, resolve, reject);
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    // Add to queue
    speechQueue.push({
      text,
      options: mergedOptions,
      resolve,
      reject
    });
    
    // Process queue if not speaking
    if (!isSpeaking) {
      processQueue();
    }
  });
}

// Process the speech queue
function processQueue() {
  if (speechQueue.length === 0 || isSpeaking) return;
  
  const item = speechQueue.shift();
  if (!item) return;
  
  try {
    speakNow(item.text, item.options, item.resolve, item.reject);
  } catch (error) {
    item.reject(error);
    processQueue(); // Continue with next item in case of error
  }
}

// Actually speak the text
function speakNow(
  text: string,
  options: {
    rate: number;
    volume: number;
    voice?: SpeechSynthesisVoice;
    queueMode?: 'append' | 'flush' | 'immediate';
    interrupt?: boolean;
  },
  resolve: () => void,
  reject: (reason?: any) => void
) {
  const utterance = new SpeechSynthesisUtterance(text);
  
  utterance.rate = options.rate;
  utterance.volume = options.volume;
  
  if (options.voice) {
    utterance.voice = options.voice;
  }
  
  utterance.onend = () => {
    isSpeaking = false;
    resolve();
    
    // Start the next item in the queue
    setTimeout(processQueue, 50);
  };
  
  utterance.onerror = (event) => {
    const error = event as SpeechSynthesisErrorEvent;
    let errorMessage = 'Speech synthesis failed';
    
    // Provide more specific error messages
    if (isIOS) {
      if (!inUserGesture) {
        errorMessage = 'Speech requires user interaction on iOS. Please tap a button to speak.';
      } else if (error.error === 'synthesis-failed') {
        errorMessage = 'Speech synthesis failed. Please try again or check iOS speech settings.';
      } else if (error.error === 'audio-busy') {
        errorMessage = 'Audio is busy. Please wait and try again.';
      }
    } else {
      errorMessage = `Speech synthesis error: ${error.error}`;
    }
    
    console.error(errorMessage, error);
    isSpeaking = false;
    reject(new Error(errorMessage));
    
    // Continue with next item
    setTimeout(processQueue, 50);
  };
  
  try {
    isSpeaking = true;
    
    // iOS specific handling
    if (isIOS) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Start the watchdog
      startSpeechWatchdog();
      
      // Small delay to ensure previous speech is cancelled
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        
        // iOS sometimes needs a kick to start speaking
        setTimeout(() => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 100);
      }, 50);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    isSpeaking = false;
    stopSpeechWatchdog();
    reject(error);
  }
}

// Stop all speech
// Start the watchdog timer to prevent speech from getting stuck
function startSpeechWatchdog() {
  if (speechWatchdog) {
    clearInterval(speechWatchdog);
  }
  
  speechWatchdog = window.setInterval(() => {
    if (isIOS && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, 1000);
}

// Stop the watchdog timer
function stopSpeechWatchdog() {
  if (speechWatchdog) {
    clearInterval(speechWatchdog);
    speechWatchdog = null;
  }
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    speechQueue = [];
    isSpeaking = false;
    stopSpeechWatchdog();
  }
}

// Return the current queue length
export function getSpeechQueueLength(): number {
  return speechQueue.length;
}

// Get relative position of an object (left, right, center)
const getObjectPosition = (detection: DetectedObject): 'left' | 'center' | 'right' => {
  const centerX = detection.bbox.x + (detection.bbox.width / 2);
  
  if (centerX < 0.4) return 'left';
  if (centerX > 0.6) return 'right';
  return 'center';
};

// Create a description from detected objects with more intuitive navigational prompts
export function createDescriptionFromObjects(detections: DetectedObject[]): string {
  if (!detections || detections.length === 0) {
    return "Path is clear";
  }
  
  // Ensure a distance is available; default to 5.0m if missing, then filter
  const nearbyObjects = detections
    .map(obj => ({
      ...obj,
      distance: obj.distance !== undefined ? obj.distance : 5.0
    }))
    .filter(obj => obj.distance !== undefined && obj.distance <= 11.0)
    .sort((a, b) => {
      // Sort by distance, prioritizing closer objects
      const distA = a.distance || 999;
      const distB = b.distance || 999;
      return distA - distB;
    });
  
  if (nearbyObjects.length === 0) {
    return "Path is clear ahead";
  }
  
  // Limit to closest 3 objects to avoid information overload
  const limitedObjects = nearbyObjects.slice(0, 3);
  
  // Create concise, directive phrases for each object in preferred style
  const objectDescriptions = limitedObjects.map(obj => {
    const label = normalizeObjectLabel(obj.label || 'object');
    const position = getObjectPosition(obj);
    const distance = obj.distance !== undefined ? obj.distance : 5;

    let directive = '';
    if (position === 'center') {
      if (distance < 1.5) directive = 'stop';
      else if (distance < 3.5) directive = 'pass around';
    } else if (position === 'left') {
      if (distance < 5.0) directive = 'move right';
    } else if (position === 'right') {
      if (distance < 5.0) directive = 'move left';
    }

    const locationPhrase = position === 'left' ? 'to your left' : position === 'right' ? 'to your right' : 'ahead';
    const base = `${label} ${locationPhrase}`;
    return directive ? `${base} — ${directive}` : base;
  });
  
  // Join descriptions based on number of objects
  if (objectDescriptions.length === 1) {
    return objectDescriptions[0];
  } else if (objectDescriptions.length === 2) {
    return `${objectDescriptions[0]} and ${objectDescriptions[1]}`;
  } else {
    return `${objectDescriptions[0]}, ${objectDescriptions[1]}, and ${objectDescriptions[2]}`;
  }
}

// Generate navigation instructions with more intuitive prompts
export function generateNavigationInstructions(detections: DetectedObject[]): {
  text: string;
  priority: 'high' | 'medium' | 'low';
} {
  // Default response if no objects
  if (!detections || detections.length === 0) {
    return { 
      text: "Path is clear", 
      priority: 'low' 
    };
  }
  
  // Ensure a distance is available; default to 5.0m if missing, then sort
  const nearbyObjects = detections
    .map(obj => ({
      ...obj,
      distance: obj.distance !== undefined ? obj.distance : 5.0
    }))
    .filter(obj => obj.distance !== undefined && obj.distance <= 11.0)
    .sort((a, b) => {
      const distA = a.distance || 999;
      const distB = b.distance || 999;
      return distA - distB;
    });
  
  if (nearbyObjects.length === 0) {
    return { 
      text: "Path is clear ahead", 
      priority: 'low' 
    };
  }
  
  // Get the closest object
  const closestObject = nearbyObjects[0];
  const objectPosition = getObjectPosition(closestObject);
  const distanceMeters = closestObject.distance || 5.0;
  const normalizedLabel = normalizeObjectLabel(closestObject.label || 'object');
  
  // Determine priority based on distance
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (distanceMeters < 3.0) {
    priority = 'high';
  } else if (distanceMeters > 8.0) {
    priority = 'low';
  }
  
  // Generate concise single instruction for the closest object
  const locationPhrase = objectPosition === 'left' ? 'to your left' : objectPosition === 'right' ? 'to your right' : 'ahead';
  let directive = '';
  if (objectPosition === 'center') {
    if (distanceMeters < 1.5) directive = 'stop';
    else if (distanceMeters < 3.5) directive = 'pass around';
  } else if (objectPosition === 'left') {
    if (distanceMeters < 5.0) directive = 'move right';
  } else if (objectPosition === 'right') {
    if (distanceMeters < 5.0) directive = 'move left';
  }

  const base = `${normalizedLabel} ${locationPhrase}`;
  const instruction = directive ? `${base} — ${directive}` : base;
  
  return {
    text: instruction,
    priority
  };
}
