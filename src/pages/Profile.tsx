
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { User, Settings, Bell, Eye, Volume2, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const Profile = () => {
  const [notifications, setNotifications] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [detailedDescriptions, setDetailedDescriptions] = useState(true);
  const [prioritizeHazards, setPrioritizeHazards] = useState(true);
  
  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">User Profile</h1>
          <p className="text-muted-foreground">
            Manage your preferences and settings
          </p>
        </div>
        
        <Card className="glass-card border-white/10 shadow-lg mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary to-blue-400"></div>
          <CardContent className="pt-0 -mt-12">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src="https://ui-avatars.com/api/?name=Sam+Smith&background=random" alt="User Avatar" />
                <AvatarFallback>SS</AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl font-bold mt-3">Sam Smith</h2>
              <p className="text-muted-foreground mb-4">sam.smith@example.com</p>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  Preferences
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/10 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Notifications</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive alerts about important events
                </p>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={setNotifications} 
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Voice Guidance</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive voice instructions while navigating
                </p>
              </div>
              <Switch 
                checked={voiceGuidance} 
                onCheckedChange={setVoiceGuidance} 
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Detailed Descriptions</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide more detailed descriptions of surroundings
                </p>
              </div>
              <Switch 
                checked={detailedDescriptions} 
                onCheckedChange={setDetailedDescriptions} 
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Prioritize Hazards</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Prioritize information about potential hazards
                </p>
              </div>
              <Switch 
                checked={prioritizeHazards} 
                onCheckedChange={setPrioritizeHazards} 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between group card-hover p-2 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-medium">Voice Speed</span>
                  <p className="text-xs text-muted-foreground">
                    Control the speed of voice instructions
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">Medium</span>
                  <Button variant="outline" size="sm">Adjust</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between group card-hover p-2 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-medium">Verbosity Level</span>
                  <p className="text-xs text-muted-foreground">
                    Amount of detail in voice guidance
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">High</span>
                  <Button variant="outline" size="sm">Adjust</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between group card-hover p-2 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-medium">Detection Range</span>
                  <p className="text-xs text-muted-foreground">
                    Maximum distance for object detection
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">5 meters</span>
                  <Button variant="outline" size="sm">Adjust</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between group card-hover p-2 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-medium">Language</span>
                  <p className="text-xs text-muted-foreground">
                    Language for voice instructions
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">English</span>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
