
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const Terms = () => {
  useEffect(() => {
    // Read terms and conditions aloud when page loads
    const termsIntro = "Terms of Service for EchoVision. This document outlines the terms and conditions for using the EchoVision application.";
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(termsIntro));
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-primary">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using the EchoVision application ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">2. Description of Service</h2>
            <p className="mb-4">
              EchoVision is an assistive technology application designed to help visually impaired individuals navigate their surroundings using object detection and voice guidance.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">3. User Registration</h2>
            <p className="mb-4">
              To use certain features of the App, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">4. Privacy Policy</h2>
            <p className="mb-4">
              Your use of the App is also governed by our Privacy Policy, which is incorporated by reference into these Terms of Service. Please review our Privacy Policy to understand our practices.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">5. Camera and Microphone Access</h2>
            <p className="mb-4">
              The App requires access to your device's camera and microphone to function properly. By using the App, you grant permission for these features to be used for object detection and voice interaction purposes.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">6. Data Processing</h2>
            <p className="mb-4">
              The App processes image data from your camera to detect objects and provide navigation assistance. This data is processed both on-device and through external API services. By using the App, you consent to this data processing.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">7. Limitation of Liability</h2>
            <p className="mb-4">
              The App is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, and hereby disclaim all warranties, including without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p className="mb-4">
              We do not guarantee the accuracy, completeness, or reliability of the object detection and navigation assistance provided by the App. Users should exercise caution and not rely solely on the App for navigation in potentially dangerous situations.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">8. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will provide notice of any material changes through the App or by other means. Your continued use of the App after such modifications will constitute your acknowledgment of the modified Terms.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">9. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at support@echovision.com.
            </p>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button asChild className="min-w-[150px]">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
