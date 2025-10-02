
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Play, ArrowLeft } from 'lucide-react';

const Demo = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Layout hideFooter>
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#1a4fd1]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">EchoVision</h1>
          <p className="text-white/80 mb-12 px-6 max-w-md mx-auto">
            AI-driven vision assistant that helps navigate indoor spaces with confidence
          </p>
          
          <button 
            onClick={() => navigate('/camera')}
            className="bg-white text-[#1a4fd1] font-medium px-8 py-3 rounded-full mb-4 w-64 flex items-center justify-center"
          >
            <span className="mr-2">Start Camera</span>
          </button>
          
          <button 
            onClick={handleBack}
            className="bg-[#1a4fd1] text-white border border-white/30 font-medium px-8 py-3 rounded-full w-64"
          >
            Back to Home
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Demo;
