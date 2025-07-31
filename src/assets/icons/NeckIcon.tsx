import React from 'react';

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

const NeckIcon: React.FC<SvgIconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" {...props}>
    <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm-7-9.5c0-1.18.31-2.27.84-3.22L12 14.5l6.16-5.22c.53.95.84 2.04.84 3.22C19 16.97 15.87 20 12 20s-7-3.03-7-7.5z"/>
  </svg>
);

export default NeckIcon;
