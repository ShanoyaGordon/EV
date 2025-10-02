
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  useEffect(() => {
    // Read privacy policy aloud when page loads
    const privacyIntro = "Privacy Policy for EchoVision. This document explains how we collect, use, and protect your personal information.";
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(privacyIntro));
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-primary">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <p className="mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">1. Introduction</h2>
            <p className="mb-4">
              EchoVision ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our EchoVision application.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">2. Information We Collect</h2>
            <p className="mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Personal information (name, email address, phone number, date of birth, age, address, occupation)</li>
              <li>Account credentials</li>
              <li>Camera data (images and video captured through your device's camera)</li>
              <li>Voice data (audio captured through your device's microphone)</li>
              <li>Device information (device type, operating system, unique device identifiers)</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">3. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Providing and maintaining the EchoVision service</li>
              <li>Processing object detection and providing navigation assistance</li>
              <li>Responding to your requests and inquiries</li>
              <li>Improving and developing new features</li>
              <li>Ensuring the security of our services</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">4. Data Processing and Third-Party Services</h2>
            <p className="mb-4">
              To provide our object detection and voice assistance services, we process image and audio data using:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Meta's Detectron2 for object detection</li>
              <li>DeepSeek API for language processing</li>
              <li>Google Text-to-Speech for voice output</li>
            </ul>
            <p className="mb-4">
              These third-party services may have access to the data we process, and their use of this data is governed by their respective privacy policies.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">5. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to provide you with our services and as required by law. Camera and voice data is processed in real-time and is not permanently stored unless specifically required for troubleshooting or service improvement purposes.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">6. Your Rights</h2>
            <p className="mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate or incomplete information</li>
              <li>Deletion of your personal information</li>
              <li>Restriction or objection to processing</li>
              <li>Data portability</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">7. Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information. However, no electronic transmission or storage system is 100% secure, and we cannot guarantee absolute security.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">8. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at privacy@echovision.com.
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

export default Privacy;
