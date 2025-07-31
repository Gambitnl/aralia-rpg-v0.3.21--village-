import React from 'react';

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

const BeltIcon: React.FC<SvgIconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" {...props}>
    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10H5V8h14v8zM9 15h6v-2H9v2z"/>
  </svg>
);

export default BeltIcon;
