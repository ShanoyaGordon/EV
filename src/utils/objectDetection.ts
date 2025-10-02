import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { DetectedObject } from '@/components/vision/ObjectDetection';
import { getMobileDetectionSettings } from '@/utils/mobileDetectionHelper';
import { useIsMobile } from '@/hooks/use-mobile';

const API_CONFIG = {
  azureApiUrl: import.meta.env.VITE_AZURE_VISION_ENDPOINT || 'https://your_endpoint/vision/v3.2/analyze',
  azureApiKey: import.meta.env.VITE_AZURE_VISION_KEY || '',
  deepseekApiUrl: 'https://api.deepseek.com/v1/chat/completions',
  deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  useExternalApi: true,
  preferredProvider: 'azure' as 'azure' | 'deepseek' | 'cloud',
  cloudApiUrl: 'https://your-cloud-api.com/detect',
  cloudApiKey: '',
  useCloudDetection: false,
};

const DISTANCE_CALIBRATION = {
  baseDistance: 1.5,
  scaleFactor: 0.8,
  minDistance: 0.5,
  maxDistance: 10,
  objectSizeReferences: {
    // People and persons
    person: 0.5,
    man: 0.5,
    woman: 0.5,
    child: 0.35,
    baby: 0.25,
    teenager: 0.45,
    adult: 0.5,
    elderly: 0.48,
    pedestrian: 0.5,
    crowd: 3.0,
    human: 0.5,
    person_right_hand: 0.15,
    person_leg: 0.3,
    
    // Transportation - Vehicles
    bicycle: 0.6,
    bike: 0.6,
    car: 1.8,
    automobile: 1.8,
    sedan: 1.8,
    suv: 1.9,
    truck: 2.5,
    pickup_truck: 2.0,
    van: 2.0,
    minivan: 1.9,
    bus: 2.6,
    train: 3.0,
    motorcycle: 0.8,
    scooter: 0.5,
    moped: 0.7,
    skateboard: 0.8,
    surfboard: 2.0,
    skis: 1.8,
    snowboard: 1.5,
    airplane: 20.0,
    boat: 3.0,
    ambulance: 2.2,
    fire_truck: 2.5,
    police_car: 1.9,
    taxi: 1.8,
    delivery_truck: 2.3,
    tractor: 2.0,
    trailer: 2.5,
    golf_cart: 1.4,
    vehicle: 1.8,
    
    // Street objects
    traffic_light: 0.3,
    fire_hydrant: 0.5,
    stop_sign: 0.6,
    parking_meter: 0.5,
    bench: 1.2,
    
    // Furniture
    chair: 0.5,
    armchair: 0.7,
    stool: 0.4,
    office_chair: 0.65,
    rocking_chair: 0.7,
    bean_bag: 0.8,
    bench_outdoor: 1.5,
    sofa: 1.8,
    couch: 1.8,
    loveseat: 1.4,
    futon: 1.5,
    sectional: 2.5,
    chaise_lounge: 1.6,
    ottoman: 0.5,
    table: 1.5,
    coffee_table: 0.9,
    end_table: 0.5,
    side_table: 0.5,
    dining_table: 1.5,
    kitchen_table: 1.4,
    desk: 1.4,
    computer_desk: 1.2,
    standing_desk: 1.4,
    console_table: 1.0,
    vanity: 1.0,
    dresser: 1.2,
    chest_of_drawers: 1.0,
    nightstand: 0.5,
    bookshelf: 0.9,
    bookcase: 1.0,
    cabinet: 0.8,
    file_cabinet: 0.5,
    credenza: 1.5,
    hutch: 1.2,
    entertainment_center: 1.8,
    tv_stand: 1.2,
    bed: 1.5,
    twin_bed: 1.0,
    full_bed: 1.4,
    queen_bed: 1.6,
    king_bed: 2.0,
    bunk_bed: 1.5,
    cradle: 0.8,
    crib: 0.8,
    daybed: 0.9,
    hammock: 1.5,
    folding_chair: 0.45,
    folding_table: 0.8,
    bean_bag_chair: 0.8,
    
    // Office equipment
    laptop: 0.35,
    computer: 0.4,
    desktop: 0.45,
    server: 0.6,
    pc: 0.4,
    workstation: 0.9,
    tablet: 0.2,
    e_reader: 0.18,
    keyboard: 0.4,
    mouse: 0.07,
    trackpad: 0.12,
    monitor: 0.55,
    display: 0.5,
    screen: 1.8,
    lcd: 0.5,
    led_screen: 0.5,
    tv: 1.0,
    television: 1.0,
    hdtv: 1.0,
    smarttv: 1.2,
    projector: 0.3,
    projector_screen: 2.0,
    phone: 0.1,
    telephone: 0.15,
    landline: 0.15,
    smartphone: 0.08,
    cell_phone: 0.07,
    mobile: 0.07,
    iphone: 0.07,
    android: 0.07,
    headphones: 0.18,
    headset: 0.2,
    earbuds: 0.05,
    microphone: 0.05,
    speaker: 0.25,
    stereo: 0.4,
    soundbar: 0.9,
    webcam: 0.05,
    camera: 0.1,
    video_camera: 0.15,
    dslr: 0.15,
    digital_camera: 0.12,
    printer: 0.5,
    scanner: 0.4,
    copier: 0.7,
    fax: 0.4,
    shredder: 0.3,
    calculator: 0.15,
    stapler: 0.08,
    tape_dispenser: 0.1,
    hole_punch: 0.12,
    paper_cutter: 0.3,
    binder: 0.28,
    clipboard: 0.23,
    whiteboard: 1.2,
    blackboard: 1.2,
    bulletin_board: 0.9,
    flip_chart: 0.7,
    easel: 0.6,
    
    // Conference room items
    podium: 0.8,
    lectern: 0.7,
    conference_table: 2.4,
    meeting_table: 2.0,
    boardroom_table: 3.0,
    conference_chair: 0.6,
    av_cart: 0.6,
    conference_phone: 0.2,
    speakerphone: 0.2,
    video_conferencing: 0.8,
    telepresence: 1.0,
    remote: 0.05,
    remote_control: 0.05,
    laser_pointer: 0.02,
    presentation_clicker: 0.05,
    marker: 0.01,
    dry_erase_marker: 0.01,
    chalk: 0.01,
    eraser: 0.1,
    notebook: 0.25,
    legal_pad: 0.22,
    notepad: 0.15,
    pen: 0.01,
    pencil: 0.01,
    folder: 0.25,
    document: 0.21,
    paper: 0.21,
    water_pitcher: 0.2,
    water_glasses: 0.08,
    coffee_carafe: 0.25,
    
    // Electronics
    router: 0.2,
    modem: 0.2,
    hub: 0.15,
    switch: 0.2,
    network_equipment: 0.3,
    cable_box: 0.3,
    streaming_device: 0.1,
    game_console: 0.3,
    playstation: 0.3,
    xbox: 0.3,
    nintendo: 0.25,
    wii: 0.2,
    controller: 0.15,
    power_strip: 0.3,
    extension_cord: 0.3,
    adapter: 0.1,
    charger: 0.1,
    usb_drive: 0.05,
    external_drive: 0.15,
    hard_drive: 0.15,
    ssd: 0.1,
    
    // Appliances
    refrigerator: 0.8,
    fridge: 0.8,
    freezer: 0.75,
    microwave: 0.5,
    oven: 0.6,
    stove: 0.6,
    range: 0.75,
    dishwasher: 0.6,
    washing_machine: 0.65,
    washer: 0.65,
    dryer: 0.65,
    toaster: 0.3,
    toaster_oven: 0.4,
    blender: 0.2,
    mixer: 0.25,
    food_processor: 0.25,
    coffee_maker: 0.3,
    espresso_machine: 0.35,
    kettle: 0.25,
    electric_kettle: 0.2,
    rice_cooker: 0.3,
    slow_cooker: 0.35,
    pressure_cooker: 0.3,
    instant_pot: 0.3,
    air_fryer: 0.3,
    water_cooler: 0.5,
    air_conditioner: 0.7,
    heater: 0.5,
    fan: 0.45,
    ceiling_fan: 1.2,
    air_purifier: 0.4,
    humidifier: 0.3,
    dehumidifier: 0.4,
    vacuum: 0.4,
    robot_vacuum: 0.3,
    hair_drier: 0.2,
    
    // COCO standard classes
    // Added with proper naming conventions to avoid duplicates
    backpack: 0.4,
    handbag: 0.3,
    tie: 0.1,
    suitcase: 0.7,
    frisbee: 0.25,
    sports_ball: 0.2,
    kite: 0.5,
    baseball_bat: 0.9,
    baseball_glove: 0.25,
    tennis_racket: 0.7,
    bottle: 0.1,
    wine_glass: 0.08,
    cup: 0.1,
    fork: 0.02,
    knife: 0.02,
    spoon: 0.02,
    bowl: 0.2,
    banana: 0.2,
    apple: 0.08,
    sandwich: 0.2,
    orange: 0.08,
    broccoli: 0.15,
    carrot: 0.15,
    hot_dog: 0.15,
    pizza: 0.35,
    donut: 0.1,
    cake: 0.25,
    potted_plant: 0.3,
    
    // Common COCO animal classes 
    bird: 0.2,
    cat: 0.4,
    dog: 0.6,
    horse: 2.0,
    sheep: 1.2,
    cow: 2.0,
    elephant: 3.0,
    bear: 2.0,
    zebra: 2.0,
    giraffe: 1.5,
    
    // Additional COCO classes
    umbrella: 1.0, 
    teddy_bear: 0.3,
    scissors: 0.15,
    vase: 0.2,
    toothbrush: 0.02,
    
    // Default size (used when no specific object size is available)
    default: 0.5
  }
};

const DETECTION_CONFIG = {
  confidenceThreshold: 0.35,
  maxDetections: 15,
  nmsRadius: 20,
  maxDistanceThreshold: 5.0,
  nearObjectDistance: 1.0,
  nearObjectRange: 0.3,
  minObjectSize: 0.001
};

const initializeConfig = () => {
  try {
    // Log environment variables status
    console.log('Vision API Configuration:', {
      hasVisionKey: !!import.meta.env.VITE_AZURE_VISION_KEY,
      hasVisionEndpoint: !!import.meta.env.VITE_AZURE_VISION_ENDPOINT,
      visionEndpoint: import.meta.env.VITE_AZURE_VISION_ENDPOINT
    });
    
    // First try environment variables
    if (import.meta.env.VITE_AZURE_VISION_KEY) {
      API_CONFIG.azureApiKey = import.meta.env.VITE_AZURE_VISION_KEY;
    }
    if (import.meta.env.VITE_AZURE_VISION_ENDPOINT) {
      API_CONFIG.azureApiUrl = import.meta.env.VITE_AZURE_VISION_ENDPOINT;
    }
    if (import.meta.env.VITE_DEEPSEEK_API_KEY) {
      API_CONFIG.deepseekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    }
    
    // Then try localStorage as fallback
    const storedConfig = localStorage.getItem('vision_api_config');
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      // Only use localStorage values if environment variables are not set
      if (!import.meta.env.VITE_AZURE_VISION_ENDPOINT) {
        API_CONFIG.azureApiUrl = parsedConfig.azureApiUrl || API_CONFIG.azureApiUrl;
      }
      if (!import.meta.env.VITE_AZURE_VISION_KEY) {
        API_CONFIG.azureApiKey = parsedConfig.azureApiKey || API_CONFIG.azureApiKey;
      }
      API_CONFIG.useExternalApi = parsedConfig.useExternalApi ?? API_CONFIG.useExternalApi;
      API_CONFIG.useCloudDetection = parsedConfig.useCloudDetection ?? API_CONFIG.useCloudDetection;
      API_CONFIG.preferredProvider = parsedConfig.preferredProvider || API_CONFIG.preferredProvider;
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
};

initializeConfig();

let model: cocoSsd.ObjectDetection | null = null;
let isModelLoading = false;

const initializeTensorFlow = async () => {
  try {
    await tf.setBackend('webgl');
    console.log('Using WebGL backend for TensorFlow.js');
  } catch (error) {
    try {
      await tf.setBackend('cpu');
      console.log('Using CPU backend for TensorFlow.js');
    } catch (fallbackError) {
      console.error('Failed to initialize TensorFlow backend:', fallbackError);
      throw new Error('Could not initialize TensorFlow backend');
    }
  }
};

export const loadModel = async () => {
  if (model) return model;
  
  if (isModelLoading) {
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (model) return model;
    }
    throw new Error('Model loading timed out');
  }
  
  try {
    isModelLoading = true;
    console.log('Loading TensorFlow.js COCO-SSD model...');
    
    await initializeTensorFlow();
    
    model = await cocoSsd.load({
      base: 'lite_mobilenet_v2'
    });
    
    console.log('TensorFlow model loaded successfully');
    isModelLoading = false;
    return model;
  } catch (error) {
    console.error('Error loading TensorFlow model:', error);
    isModelLoading = false;
    throw new Error('Failed to load object detection model');
  }
};

const calculateObjectDistance = (
  objectClass: string,
  normalizedWidth: number,
  normalizedHeight: number
): number => {
  const defaultSize = DISTANCE_CALIBRATION.objectSizeReferences.default;
  
  const referenceSize = DISTANCE_CALIBRATION.objectSizeReferences[objectClass.toLowerCase() as keyof typeof DISTANCE_CALIBRATION.objectSizeReferences] 
    || defaultSize;
  
  const objectSize = normalizedWidth * normalizedHeight;
  
  if (objectSize < 0.001) {
    return DISTANCE_CALIBRATION.maxDistance;
  }
  
  let distance = (referenceSize / (normalizedWidth * DISTANCE_CALIBRATION.scaleFactor)) * DISTANCE_CALIBRATION.baseDistance;
  
  const variance = Math.random() * 0.2 - 0.1;
  distance = distance * (1 + variance);
  
  distance = Math.max(DISTANCE_CALIBRATION.minDistance, 
              Math.min(DISTANCE_CALIBRATION.maxDistance, distance));
  
  return distance;
};

const getImageDataFromElement = (
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = element.width || (element as HTMLVideoElement).videoWidth || 300;
  canvas.height = element.height || (element as HTMLVideoElement).videoHeight || 300;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
};

const callAzureApi = async (
  imageData: string
): Promise<DetectedObject[]> => {
  try {
    if (!API_CONFIG.azureApiUrl || !API_CONFIG.azureApiKey) {
      console.error('Azure API URL or key not configured');
      return [];
    }
    
    const response = await fetch(API_CONFIG.azureApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': API_CONFIG.azureApiKey
      },
      body: Buffer.from(imageData, 'base64'),
    });
    
    if (!response.ok) {
      throw new Error(`Azure API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.objects || !Array.isArray(data.objects)) {
      console.warn('No objects detected by Azure API');
      return [];
    }
    
    return data.objects.map((item: any, index: number) => {
      const rect = item.rectangle;
      const imageWidth = data.metadata?.width || 1;
      const imageHeight = data.metadata?.height || 1;
      
      const normalizedX = rect.x / imageWidth;
      const normalizedY = rect.y / imageHeight;
      const normalizedWidth = rect.w / imageWidth;
      const normalizedHeight = rect.h / imageHeight;
      
      const distance = calculateObjectDistance(
        item.object.toLowerCase(),
        normalizedWidth,
        normalizedHeight
      );
      
      return {
        id: index + 1,
        label: item.object,
        confidence: item.confidence,
        bbox: {
          x: normalizedX,
          y: normalizedY,
          width: normalizedWidth,
          height: normalizedHeight,
        },
        distance
      };
    })
    .filter(obj => 
      obj.confidence >= DETECTION_CONFIG.confidenceThreshold && 
      obj.distance <= DETECTION_CONFIG.maxDistanceThreshold &&
      (obj.bbox.width * obj.bbox.height) >= DETECTION_CONFIG.minObjectSize
    );
  } catch (error) {
    console.error('Error calling Azure Computer Vision API:', error);
    return [];
  }
};

const callDeepseekApi = async (
  imageData: string
): Promise<DetectedObject[]> => {
  try {
    if (!API_CONFIG.deepseekApiUrl || !API_CONFIG.deepseekApiKey) {
      console.error('DeepSeek API URL or key not configured');
      return [];
    }
    
    const localDetections = await useLocalModel(imageData);
    
    if (localDetections.length === 0) {
      return [];
    }
    
    return localDetections;
  } catch (error) {
    console.error('Error with DeepSeek processing:', error);
    return [];
  }
};

const useLocalModel = async (
  imageData: string,
  isMobile: boolean = false
): Promise<DetectedObject[]> => {
  try {
    if (!model) {
      model = await loadModel();
    }
    
    const img = new Image();
    const src = `data:image/jpeg;base64,${imageData}`;
    
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = src;
    });
    
    await new Promise(resolve => setTimeout(resolve, 10));

    const detectionConfig = isMobile 
      ? getMobileDetectionSettings() 
      : DETECTION_CONFIG;
    
    const predictions = await model.detect(
      img, 
      detectionConfig.maxDetections
    );
    
    return predictions
      .filter(prediction => prediction.score >= (isMobile ? detectionConfig.confidenceThreshold : DETECTION_CONFIG.confidenceThreshold))
      .map((prediction, index) => {
        const [x, y, width, height] = prediction.bbox;
        
        const normalizedX = x / img.width;
        const normalizedY = y / img.height;
        const normalizedWidth = width / img.width;
        const normalizedHeight = height / img.height;
        
        const minSize = isMobile ? detectionConfig.minObjectSize : DETECTION_CONFIG.minObjectSize;
        
        if ((normalizedWidth * normalizedHeight) < minSize) {
          return null;
        }
        
        const distance = calculateObjectDistance(
          prediction.class.toLowerCase(),
          normalizedWidth,
          normalizedHeight
        );
        
        return {
          id: index + 1,
          label: prediction.class,
          confidence: prediction.score,
          bbox: {
            x: normalizedX,
            y: normalizedY,
            width: normalizedWidth,
            height: normalizedHeight,
          },
          distance
        };
      })
      .filter(item => item !== null) as DetectedObject[];
  } catch (error) {
    console.error('Error using local model:', error);
    return [];
  }
};

const callCloudApi = async (
  imageData: string
): Promise<DetectedObject[]> => {
  try {
    if (!API_CONFIG.cloudApiUrl || !API_CONFIG.cloudApiKey) {
      console.error('Cloud API URL or key not configured');
      return [];
    }
    
    const response = await fetch(API_CONFIG.cloudApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.cloudApiKey}`
      },
      body: JSON.stringify({
        image: imageData,
        options: {
          confidenceThreshold: DETECTION_CONFIG.confidenceThreshold,
          maxDetections: DETECTION_CONFIG.maxDetections
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Cloud API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.objects || !Array.isArray(data.objects)) {
      console.warn('No objects detected by Cloud API');
      return [];
    }
    
    return data.objects.map((item: any, index: number) => {
      const rect = item.bbox;
      
      const distance = item.distance || calculateObjectDistance(
        item.class.toLowerCase(),
        rect.width,
        rect.height
      );
      
      return {
        id: index + 1,
        label: item.class,
        confidence: item.confidence,
        bbox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        distance
      };
    })
    .filter((obj: DetectedObject) => 
      obj.confidence >= DETECTION_CONFIG.confidenceThreshold && 
      obj.distance <= DETECTION_CONFIG.maxDistanceThreshold &&
      (obj.bbox.width * obj.bbox.height) >= DETECTION_CONFIG.minObjectSize
    );
  } catch (error) {
    console.error('Error calling Cloud API:', error);
    return [];
  }
};

export const saveAzureApiKey = (apiKey: string): boolean => {
  try {
    localStorage.setItem('azure_api_key', apiKey);
    API_CONFIG.azureApiKey = apiKey;
    console.log('Azure API key saved');
    return true;
  } catch (error) {
    console.error('Error saving Azure API key:', error);
    return false;
  }
};

export const saveDeepseekApiKey = (apiKey: string): boolean => {
  try {
    localStorage.setItem('deepseek_api_key', apiKey);
    API_CONFIG.deepseekApiKey = apiKey;
    console.log('DeepSeek API key saved');
    return true;
  } catch (error) {
    console.error('Error saving DeepSeek API key:', error);
    return false;
  }
};

export const saveCloudApiKey = (apiKey: string): boolean => {
  try {
    localStorage.setItem('cloud_api_key', apiKey);
    API_CONFIG.cloudApiKey = apiKey;
    console.log('Cloud API key saved');
    return true;
  } catch (error) {
    console.error('Error saving Cloud API key:', error);
    return false;
  }
};

export const saveCloudApiUrl = (url: string): boolean => {
  try {
    localStorage.setItem('cloud_api_url', url);
    API_CONFIG.cloudApiUrl = url;
    console.log('Cloud API URL saved');
    return true;
  } catch (error) {
    console.error('Error saving Cloud API URL:', error);
    return false;
  }
};

export const saveApiConfig = (settings: {
  useCloudDetection?: boolean;
  cloudApiUrl?: string;
  preferredProvider?: 'azure' | 'deepseek' | 'cloud';
  azureApiUrl?: string;
}): boolean => {
  try {
    const currentConfig = { ...API_CONFIG };
    const updatedConfig = {
      ...currentConfig,
      ...settings
    };
    
    localStorage.setItem('vision_api_config', JSON.stringify(updatedConfig));
    Object.assign(API_CONFIG, updatedConfig);
    
    console.log('API config saved');
    return true;
  } catch (error) {
    console.error('Error saving API config:', error);
    return false;
  }
};

export const saveCloudDetectionSettings = (settings: {
  useCloudDetection: boolean;
  cloudApiUrl?: string;
  cloudApiKey?: string;
}): boolean => {
  try {
    const updatedConfig = {
      ...API_CONFIG,
      useCloudDetection: settings.useCloudDetection,
      ...(settings.cloudApiUrl && { cloudApiUrl: settings.cloudApiUrl }),
      ...(settings.cloudApiKey && { cloudApiKey: settings.cloudApiKey })
    };
    
    localStorage.setItem('vision_api_config', JSON.stringify({
      useCloudDetection: updatedConfig.useCloudDetection,
      cloudApiUrl: updatedConfig.cloudApiUrl,
      preferredProvider: updatedConfig.preferredProvider
    }));
    
    if (settings.cloudApiKey) {
      localStorage.setItem('cloud_api_key', settings.cloudApiKey);
    }
    
    if (settings.cloudApiUrl) {
      localStorage.setItem('cloud_api_url', settings.cloudApiUrl);
    }
    
    Object.assign(API_CONFIG, updatedConfig);
    
    console.log('Cloud detection settings saved');
    return true;
  } catch (error) {
    console.error('Error saving cloud detection settings:', error);
    return false;
  }
};

export const detectObjects = async (
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  options?: {
    focusOnNearObjects?: boolean;
    useExternalApi?: boolean;
    useCloudDetection?: boolean;
    isMobile?: boolean;
  }
): Promise<DetectedObject[]> => {
  try {
    const imageData = getImageDataFromElement(imageSource);
    const isMobile = options?.isMobile || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let detections: DetectedObject[] = [];
    
    if (options?.useCloudDetection && API_CONFIG.cloudApiKey) {
      detections = await callCloudApi(imageData);
      if (detections.length > 0) {
        return detections;
      }
    }
    
    if (options?.useExternalApi) {
      if (API_CONFIG.preferredProvider === 'azure' && API_CONFIG.azureApiKey) {
        detections = await callAzureApi(imageData);
        if (detections.length > 0) {
          return detections;
        }
      } else if (API_CONFIG.preferredProvider === 'deepseek' && API_CONFIG.deepseekApiKey) {
        detections = await callDeepseekApi(imageData);
        if (detections.length > 0) {
          return detections;
        }
      }
    }
    
    const localDetections = await useLocalModel(imageData, isMobile);
    return localDetections;
  } catch (error) {
    console.error('Error detecting objects:', error);
    return [];
  }
};

export const detectObjectsWithSource = async (
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  preferredProvider: 'local' | 'azure' | 'cloud' | 'deepseek' = 'local',
  isMobile: boolean = false
): Promise<{ 
  detections: DetectedObject[], 
  source: 'local' | 'azure' | 'cloud' | 'deepseek' 
}> => {
  try {
    const imageData = getImageDataFromElement(imageSource);
    
    if (preferredProvider === 'azure' && API_CONFIG.azureApiKey) {
      const azureDetections = await callAzureApi(imageData);
      if (azureDetections.length > 0) {
        return { detections: azureDetections, source: 'azure' };
      }
    } else if (preferredProvider === 'cloud' && API_CONFIG.useCloudDetection && API_CONFIG.cloudApiKey) {
      const cloudDetections = await callCloudApi(imageData);
      if (cloudDetections.length > 0) {
        return { detections: cloudDetections, source: 'cloud' };
      }
    } else if (preferredProvider === 'deepseek' && API_CONFIG.deepseekApiKey) {
      const deepseekDetections = await callDeepseekApi(imageData);
      if (deepseekDetections.length > 0) {
        return { detections: deepseekDetections, source: 'deepseek' };
      }
    }
    
    const localDetections = await useLocalModel(imageData, isMobile);
    return { detections: localDetections, source: 'local' };
  } catch (error) {
    console.error('Error detecting objects:', error);
    return { detections: [], source: 'local' };
  }
};
