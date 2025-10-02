
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Info, Cloud, Server, Check, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { compressImageForCloudAPI, mockCloudDetection } from '@/utils/mobileDetectionHelper';
import { useDeviceInfo } from '@/hooks/use-mobile';

interface CloudDetectionSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: {
    cloudApiUrl: string;
    cloudApiKey: string;
    useCloudDetection: boolean;
  };
  onSettingsChange: (settings: Partial<CloudDetectionSettingsProps['settings']>) => void;
  onSave: () => void;
}

const CloudDetectionSettings: React.FC<CloudDetectionSettingsProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onSave
}) => {
  const deviceInfo = useDeviceInfo();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const testConnection = async () => {
    if (!settings.cloudApiUrl || settings.cloudApiUrl.includes('your-cloud-api')) {
      toast({
        title: "Configuration Required",
        description: "Please enter a valid cloud API URL first",
        variant: "destructive",
      });
      return;
    }
    
    setIsTestingConnection(true);
    
    try {
      // For development without a real endpoint, use mock
      if (settings.cloudApiUrl.includes('your-cloud-api')) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        toast({
          title: "Connection Successful",
          description: "Using development mock cloud detection",
        });
        setIsTestingConnection(false);
        return;
      }
      
      // Try to use a real endpoint if provided
      const testImage = document.createElement('canvas');
      testImage.width = 100;
      testImage.height = 100;
      const ctx = testImage.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'gray';
        ctx.fillRect(0, 0, 100, 100);
      }
      
      const imageData = await compressImageForCloudAPI(testImage);
      
      const response = await fetch(settings.cloudApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.cloudApiKey && { 'Authorization': `Bearer ${settings.cloudApiKey}` })
        },
        body: JSON.stringify({
          image: imageData,
          options: {
            confidenceThreshold: 0.1,
            maxDetections: 1
          }
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Cloud detection service is working properly",
        });
      } else {
        toast({
          title: "Connection Error",
          description: `Received status ${response.status} from cloud service`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing cloud connection:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to cloud detection service. Using development mode.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-purple-500" />
            <span>Cloud Detection Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-3 rounded-lg flex items-start space-x-3 text-sm">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Why use cloud detection?</p>
              <p className="text-muted-foreground mt-1">
                Cloud-based object detection offloads the heavy computation from your device, 
                improving performance dramatically on mobile phones.
              </p>
              {deviceInfo.needsCloudProcessing && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                  <p className="font-semibold">Recommended for your device</p>
                  <p>Your device may struggle with local processing. Cloud detection is strongly recommended.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="use-cloud-detection"
              checked={settings.useCloudDetection}
              onCheckedChange={(checked) => 
                onSettingsChange({ useCloudDetection: checked })
              }
            />
            <Label htmlFor="use-cloud-detection">Enable cloud-based detection</Label>
          </div>

          {settings.useCloudDetection && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="cloud-api-url">Cloud API Endpoint URL</Label>
                <Input
                  id="cloud-api-url"
                  placeholder="https://your-cloud-detection-api.com/detect"
                  value={settings.cloudApiUrl}
                  onChange={(e) => 
                    onSettingsChange({ cloudApiUrl: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your cloud object detection service
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cloud-api-key">Cloud API Key</Label>
                <Input
                  id="cloud-api-key"
                  type="password"
                  placeholder="Your Cloud API Key"
                  value={settings.cloudApiKey}
                  onChange={(e) => 
                    onSettingsChange({ cloudApiKey: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is stored securely in your browser only
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={testConnection}
                disabled={isTestingConnection}
                className="w-full"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-500">
                <div className="flex gap-2">
                  <Server className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Connect to Supabase for better security</p>
                    <p className="mt-1">
                      For production use, we recommend connecting to Supabase to securely store your API keys.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Development Note:</p>
                <p>
                  If you don't have a cloud service set up yet, you can leave the default URL
                  and the app will use mock detection data for demonstration purposes.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloudDetectionSettings;
