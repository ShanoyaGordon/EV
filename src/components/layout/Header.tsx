
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-[#1a4fd1]">EchoVision</span>
        </Link>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full" 
          aria-label="Settings"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
