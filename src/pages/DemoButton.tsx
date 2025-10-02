import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DemoButton = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Button
        onClick={() => navigate('/camera')}
        className="w-64 h-64 rounded-full text-4xl font-bold shadow-2xl hover:scale-105 transition-transform"
        size="lg"
      >
        Press
      </Button>
    </div>
  );
};

export default DemoButton;
