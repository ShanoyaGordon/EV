
import React from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="glass-card rounded-full px-6 py-4 mx-auto max-w-screen-sm flex items-center justify-center bg-[#1a4fd1]/80 backdrop-blur-xl border border-white/10">
        <Link to="/camera" className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-white text-[#1a4fd1] shadow-lg">
            <Camera className="h-6 w-6" />
          </div>
          <span className="text-xs mt-1 text-white">Camera</span>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
