import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Volume2, Wifi, Battery, HardDrive, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const Settings = () => {
  const [volume, setVolume] = useState(80);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isBatterySaver, setIsBatterySaver] = useState(false);
  const [isHighPerformance, setIsHighPerformance] = useState(true);
  const [isLocationServices, setIsLocationServices] = useState(true);
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">App Settings</h1>
          <p className="text-muted-foreground">
            Configure app settings and preferences
          </p>
        </div>
        
        <Card className="glass-card border-white/10 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Volume2 className="h-5 w-5 mr-2 text-primary" />
              Audio Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Voice Volume</span>
                <span className="text-sm text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(vals) => setVolume(vals[0])}
                className="cursor-pointer"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Text-to-Speech Voice</span>
                <p className="text-xs text-muted-foreground">
                  Choose the voice for spoken instructions
                </p>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Speech Recognition</span>
                <p className="text-xs text-muted-foreground">
                  Adjust speech recognition sensitivity
                </p>
              </div>
              <Button variant="outline" size="sm">Calibrate</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/10 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="h-5 w-5 mr-2 text-primary" />
              Connectivity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Offline Mode</span>
                <p className="text-xs text-muted-foreground">
                  Use the app without internet connection
                </p>
              </div>
              <Switch 
                checked={isOfflineMode} 
                onCheckedChange={setIsOfflineMode} 
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Location Services</span>
                <p className="text-xs text-muted-foreground">
                  Allow app to access your location
                </p>
              </div>
              <Switch 
                checked={isLocationServices} 
                onCheckedChange={setIsLocationServices} 
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Server Region</span>
                <p className="text-xs text-muted-foreground">
                  Choose the nearest server for better performance
                </p>
              </div>
              <Button variant="outline" size="sm">Auto-select</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/10 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Battery className="h-5 w-5 mr-2 text-primary" />
              Power & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Battery Level</span>
              <div className="flex items-center gap-2">
                <Progress value={72} className="h-2" />
                <span className="text-sm text-muted-foreground">72%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Battery Saver</span>
                <p className="text-xs text-muted-foreground">
                  Reduce feature set to conserve battery
                </p>
              </div>
              <Switch 
                checked={isBatterySaver} 
                onCheckedChange={setIsBatterySaver} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">High Performance Mode</span>
                <p className="text-xs text-muted-foreground">
                  Maximize detection accuracy (uses more battery)
                </p>
              </div>
              <Switch 
                checked={isHighPerformance} 
                onCheckedChange={setIsHighPerformance} 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/10 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="h-5 w-5 mr-2 text-primary" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">App Storage</span>
                <span className="text-sm text-muted-foreground">245 MB</span>
              </div>
              <Progress value={24} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cache</span>
                <span className="text-sm text-muted-foreground">83 MB</span>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">Clear Cache</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Saved Data</span>
                <span className="text-sm text-muted-foreground">112 MB</span>
              </div>
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">Manage Data</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Manage Saved Data</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all saved user preferences, history, and cached detection models. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground">
                        Delete All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Version</span>
                <span className="text-sm text-muted-foreground">1.0.0 (build 132)</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Last Updated</span>
                <span className="text-sm text-muted-foreground">May 15, 2023</span>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" className="w-full">Check for Updates</Button>
              </div>
              
              <div className="pt-2 flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground">
                  EchoVision • AI Vision Assistant
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  © 2023 EchoVision. All rights reserved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
