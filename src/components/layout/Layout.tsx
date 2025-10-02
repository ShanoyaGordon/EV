
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/30">
      <Header />
      <main className="pt-20 pb-24 px-4 max-w-screen-sm mx-auto min-h-screen">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
