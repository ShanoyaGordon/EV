
// Cartesia AI Text-to-Speech Integration
interface CartesiaConfig {
  apiKey: string;
  apiEndpoint: string;
  voiceId?: string;
  language?: string;
}

let CARTESIA_CONFIG: CartesiaConfig = {
  apiKey: '',
  apiEndpoint: 'https://api.cartesia.ai/tts/bytes',
  voiceId: 'bf0a246a-8642-498a-9950-80c35e9276b5', // Default voice ID
  language: 'en'
};

/**
 * Initialize the Cartesia service with API key and optional configs
 */
export const initializeCartesia = (config: CartesiaConfig) => {
  CARTESIA_CONFIG = {
    ...CARTESIA_CONFIG,
    ...config
  };
  
  // Save configuration to localStorage for persistence
  try {
    localStorage.setItem('cartesia_config', JSON.stringify({
      apiEndpoint: CARTESIA_CONFIG.apiEndpoint,
      voiceId: CARTESIA_CONFIG.voiceId,
      language: CARTESIA_CONFIG.language
    }));
    // Store API key separately for better security
    localStorage.setItem('cartesia_api_key', CARTESIA_CONFIG.apiKey);
    console.log('Cartesia configuration saved');
  } catch (error) {
    console.error('Error saving Cartesia configuration:', error);
  }
  
  return true;
};

/**
 * Load configuration from localStorage if available
 */
const loadCartesiaConfig = () => {
  try {
    const configStr = localStorage.getItem('cartesia_config');
    const apiKey = localStorage.getItem('cartesia_api_key');
    
    if (configStr) {
      const config = JSON.parse(configStr);
      CARTESIA_CONFIG = {
        ...CARTESIA_CONFIG,
        ...config
      };
    }
    
    if (apiKey) {
      CARTESIA_CONFIG.apiKey = apiKey;
    }
  } catch (error) {
    console.error('Error loading Cartesia configuration:', error);
  }
};

// Load config on module initialization
loadCartesiaConfig();

/**
 * Convert text to speech using Cartesia.ai
 */
export const textToSpeech = async (text: string): Promise<boolean> => {
  if (!CARTESIA_CONFIG.apiKey) {
    console.error('Cartesia API key not configured');
    // Fall back to browser speech synthesis if API key is not available
    useBrowserSpeech(text);
    return false;
  }
  
  try {
    const response = await fetch(CARTESIA_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': CARTESIA_CONFIG.apiKey
      },
      body: JSON.stringify({
        model_id: "sonic-2",
        transcript: text,
        voice: {
          mode: "id",
          id: CARTESIA_CONFIG.voiceId,
          __experimental_controls: {
            speed: 0,
            emotion: []
          }
        },
        output_format: {
          container: "wav",
          encoding: "pcm_f32le",
          sample_rate: 44100
        },
        language: CARTESIA_CONFIG.language
      })
    });
    
    if (!response.ok) {
      throw new Error(`Cartesia API error: ${response.status}`);
    }
    
    // Response will be audio data
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Play the audio
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Clean up
        resolve(true);
      };
      
      audio.onerror = () => {
        console.error('Error playing Cartesia TTS audio');
        URL.revokeObjectURL(audioUrl);
        resolve(false);
      };
      
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('Error calling Cartesia API:', error);
    // Fall back to browser TTS on error
    useBrowserSpeech(text);
    return false;
  }
};

/**
 * Fallback to browser's built-in speech synthesis
 */
const useBrowserSpeech = async (text: string): Promise<boolean> => {
  if (!window.speechSynthesis) return false;
  
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  return new Promise((resolve) => {
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices
      let voices = window.speechSynthesis.getVoices();
      
      // For iOS, prefer system language voice
      if (isIOS) {
        const systemLang = navigator.language || 'en-US';
        const matchingVoices = voices.filter(
          voice => voice.lang.startsWith(systemLang.split('-')[0])
        );
        
        if (matchingVoices.length > 0) {
          utterance.voice = matchingVoices[0];
        }
        
        // Use slower rate on iOS for better reliability
        utterance.rate = 0.8;
      } else {
        // Non-iOS voice selection
        const preferredVoice = voices.find(voice => 
          voice.lang.includes('en')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.rate = 1.0;
      }
      
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Handle speech completion
      utterance.onend = () => {
        resolve(true);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        resolve(false);
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      
      // iOS Safari sometimes needs a kick to start speaking
      if (isIOS) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      resolve(false);
    }
  });
};

/**
 * Stop any ongoing speech
 */
export const stopSpeech = () => {
  // Stop browser speech synthesis
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  
  // Additional logic to stop Cartesia playback if needed
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
};

/**
 * Save Cartesia API key to localStorage
 */
export const saveCartesiaApiKey = (apiKey: string) => {
  try {
    localStorage.setItem('cartesia_api_key', apiKey);
    CARTESIA_CONFIG.apiKey = apiKey;
    console.log('Cartesia API key saved');
    return true;
  } catch (error) {
    console.error('Error saving Cartesia API key:', error);
    return false;
  }
};
