import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface BrandingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PRIMARY_LOGO = "AIISlogo.png";
const SECONDARY_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Coat_of_arms_of_Eswatini.svg/250px-Coat_of_arms_of_Eswatini.svg.png";

export const NationalBranding: React.FC<BrandingProps> = ({ size = 'md', className = '' }) => {
  const [loadStep, setLoadStep] = useState<0 | 1 | 2>(0); // 0: Local Primary, 1: Global Secondary, 2: Digital Seal

  const dimensions = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-16 h-16 rounded-2xl',
    lg: 'w-24 h-24 rounded-[2rem]',
    xl: 'w-32 h-32 rounded-[2.5rem]'
  }[size];

  const iconSize = { sm: 20, md: 32, lg: 48, xl: 64 }[size];

  return (
    <div className={`relative flex items-center justify-center overflow-hidden transition-all duration-500 bg-white shadow-xl border border-emerald-50 ${dimensions} ${className}`}>
      {loadStep === 0 && (
        <img 
          src={PRIMARY_LOGO} 
          alt="Ministry Logo" 
          className="w-full h-full object-contain p-2"
          onError={() => {
            console.warn(`Primary logo (${PRIMARY_LOGO}) not found. Falling back to secondary.`);
            setLoadStep(1);
          }}
        />
      )}
      
      {loadStep === 1 && (
        <img 
          src={SECONDARY_LOGO} 
          alt="National Seal" 
          className="w-full h-full object-contain p-2 animate-pulse-slow"
          onError={() => setLoadStep(2)}
        />
      )}

      {loadStep === 2 && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-[#1B4D3E] to-[#0f2e25] text-[#FBBF24] animate-fade-in">
          <Shield size={iconSize} strokeWidth={2.5} className="drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
          {(size === 'lg' || size === 'xl') && (
            <span className="text-[10px] font-black mt-2 uppercase tracking-[0.3em] text-white">AIIS</span>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};