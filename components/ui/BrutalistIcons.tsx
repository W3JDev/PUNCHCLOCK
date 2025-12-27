import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const PunchClockLogo: React.FC<IconProps> = ({ size = 48, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="5" y="5" width="80" height="80" rx="12" fill="#FFD700" stroke="black" strokeWidth="6" />
    <rect x="15" y="15" width="80" height="80" rx="12" fill="white" stroke="black" strokeWidth="6" />
    <circle cx="55" cy="55" r="25" fill="white" stroke="black" strokeWidth="6" />
    <path d="M55 38V55H70" stroke="black" strokeWidth="6" strokeLinecap="square" />
    <path d="M10 10L30 30" stroke="black" strokeWidth="2" />
  </svg>
);

export const KioskIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="10" y="10" width="70" height="70" rx="8" fill="white" stroke="black" strokeWidth="5" />
    <rect x="20" y="20" width="70" height="70" rx="8" fill="#3B82F6" stroke="black" strokeWidth="5" />
    <path d="M35 45C35 40 40 35 55 35C70 35 75 40 75 45V55C75 60 70 65 55 65C40 65 35 60 35 55V45Z" fill="white" stroke="black" strokeWidth="4" />
    <path d="M45 45H50M60 45H65" stroke="black" strokeWidth="4" strokeLinecap="round" />
    <path d="M25 15V85" stroke="#FFD700" strokeWidth="2" strokeDasharray="4 4" />
  </svg>
);

export const VaultIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="45" cy="45" r="35" fill="white" stroke="black" strokeWidth="5" />
    <circle cx="55" cy="55" r="35" fill="#10B981" stroke="black" strokeWidth="5" />
    <text x="35" y="70" fill="black" style={{ font: 'bold 28px Inter, sans-serif' }}>RM</text>
    <path d="M60 35L75 20" stroke="black" strokeWidth="4" strokeLinecap="square" />
  </svg>
);

export const ComplianceShield: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M15 15H75V65C75 80 45 95 45 95C45 95 15 80 15 65V15Z" fill="white" stroke="black" strokeWidth="5" />
    <path d="M25 25H85V75C85 90 55 105 55 105C55 105 25 90 25 75V25Z" fill="#EF4444" stroke="black" strokeWidth="5" />
    <path d="M42 65L52 75L72 55" stroke="white" strokeWidth="8" strokeLinecap="square" />
  </svg>
);
