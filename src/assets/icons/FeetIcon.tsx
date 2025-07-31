import React from 'react';

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

const FeetIcon: React.FC<SvgIconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" {...props}>
    <path d="M20 19V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v14H3v2h18v-2h-1zm-10-6H8v-2h2v2zm0-4H8V7h2v2zm4 4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
  </svg>
);

export default FeetIcon;
