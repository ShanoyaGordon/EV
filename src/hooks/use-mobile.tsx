
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export interface DeviceInfo {
  isMobile: boolean;
  isHighEndDevice: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  browserName: string;
  isIOS: boolean;
  isAndroid: boolean;
  needsCloudProcessing: boolean;
  cpuCores: number;
  memoryEstimate?: number;
  effectiveType?: string;
  rtt?: number;
  connectionType?: string;
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>({
    isMobile: false,
    isHighEndDevice: false,
    deviceType: 'desktop',
    orientation: 'landscape',
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 1,
    browserName: '',
    isIOS: false,
    isAndroid: false,
    needsCloudProcessing: false,
    cpuCores: 2
  })

  React.useEffect(() => {
    // Detect browser
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    
    // Determine browser name
    let browserName = 'Unknown';
    if (ua.indexOf('Chrome') > -1) browserName = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browserName = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browserName = 'Firefox';
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browserName = 'IE';
    else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browserName = 'Edge';
    
    // Determine device type
    const isMobileDevice = isIOS || isAndroid || /Mobi|Android/i.test(ua);
    const isTablet = (isMobileDevice && window.innerWidth >= 600) || /Tablet|iPad/i.test(ua);
    const deviceType = isTablet ? 'tablet' : (isMobileDevice ? 'mobile' : 'desktop');
    
    // Determine high-end device based on hardware concurrency, memory, and connection
    const cpuCores = navigator.hardwareConcurrency || 2;
    
    // Try to estimate available memory (not supported in all browsers)
    let memoryEstimate: number | undefined = undefined;
    if ('deviceMemory' in navigator) {
      memoryEstimate = (navigator as any).deviceMemory;
    }
    
    // Get network connection information if available
    let effectiveType: string | undefined = undefined;
    let rtt: number | undefined = undefined;
    let connectionType: string | undefined = undefined;
    
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        effectiveType = conn.effectiveType;
        rtt = conn.rtt;
        connectionType = conn.type;
      }
    }
    
    // Determine if cloud processing is needed based on device capabilities
    const needsCloudProcessing = (
      (isMobileDevice && cpuCores <= 4) || 
      (memoryEstimate !== undefined && memoryEstimate < 4) ||
      (effectiveType !== undefined && (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g')) ||
      (rtt !== undefined && rtt > 300)
    );
    
    const isHighEndDevice = cpuCores >= 6 && 
      (memoryEstimate === undefined || memoryEstimate >= 4) &&
      (!isMobileDevice || browserName === 'Chrome');
    
    // Get screen information
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Get orientation
    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
    
    setDeviceInfo({
      isMobile: isMobileDevice,
      isHighEndDevice,
      deviceType,
      orientation,
      screenWidth,
      screenHeight,
      devicePixelRatio,
      browserName,
      isIOS,
      isAndroid,
      needsCloudProcessing,
      cpuCores,
      memoryEstimate,
      effectiveType,
      rtt,
      connectionType
    });
    
    // Update on resize
    const handleResize = () => {
      setDeviceInfo(prev => ({
        ...prev,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}

// Hook for managing cloud offloading state
export function useCloudOffload(): {
  isCloudEnabled: boolean;
  cloudApiUrl: string;
  setCloudSettings: (settings: { enabled: boolean; apiUrl?: string }) => void;
} {
  const [isCloudEnabled, setIsCloudEnabled] = React.useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('vision_api_config');
      return stored ? JSON.parse(stored).useCloudDetection || false : false;
    } catch (e) {
      return false;
    }
  });
  
  const [cloudApiUrl, setCloudApiUrl] = React.useState<string>(() => {
    try {
      const stored = localStorage.getItem('vision_api_config');
      return stored ? JSON.parse(stored).cloudApiUrl || '' : '';
    } catch (e) {
      return '';
    }
  });
  
  const setCloudSettings = React.useCallback((settings: { enabled: boolean; apiUrl?: string }) => {
    setIsCloudEnabled(settings.enabled);
    if (settings.apiUrl) {
      setCloudApiUrl(settings.apiUrl);
    }
    
    try {
      const stored = localStorage.getItem('vision_api_config');
      const config = stored ? JSON.parse(stored) : {};
      
      localStorage.setItem('vision_api_config', JSON.stringify({
        ...config,
        useCloudDetection: settings.enabled,
        ...(settings.apiUrl ? { cloudApiUrl: settings.apiUrl } : {})
      }));
    } catch (e) {
      console.error('Failed to save cloud settings to localStorage', e);
    }
  }, []);
  
  return { isCloudEnabled, cloudApiUrl, setCloudSettings };
}
