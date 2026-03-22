import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ className, variant = 'dark' }) => {
  const orange = "#FF6A00";
  const dark = variant === 'light' ? "#FFFFFF" : "#111111";
  const secondaryDark = variant === 'light' ? "rgba(255,255,255,0.8)" : "#000000";

  return (
    <div className={cn("flex items-center", className)}>
      <svg
        width="200"
        height="60"
        viewBox="0 0 220 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 md:h-12 w-auto"
      >
        {/* Left Bracket < */}
        <path
          d="M15 25L5 35L15 45"
          stroke={dark}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* DEV (Bold Orange, Italic) */}
        <text
          x="22"
          y="46"
          fill={orange}
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 900,
            fontSize: '42px',
            fontStyle: 'italic',
            letterSpacing: '-0.02em'
          }}
        >
          DEV
        </text>

        {/* Slash / */}
        <line
          x1="112"
          y1="18"
          x2="92"
          y2="58"
          stroke={dark}
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* ansh (Regular Orange) */}
        <text
          x="112"
          y="46"
          fill={orange}
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            fontSize: '36px',
            letterSpacing: '-0.01em'
          }}
        >
          ansh
        </text>

        {/* EDU-TECH (Small Black, Bold) */}
        <text
          x="115"
          y="62"
          fill={secondaryDark}
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '0.05em'
          }}
        >
          EDU-TECH
        </text>

        {/* Right Bracket > */}
        <path
          d="M205 25L215 35L205 45"
          stroke={dark}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
