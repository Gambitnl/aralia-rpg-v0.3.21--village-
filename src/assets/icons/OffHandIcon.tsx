import React from 'react';

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

const OffHandIcon: React.FC<SvgIconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" {...props}>
    <path d="M18 2H9C7.9 2 7 .9 7 0v6h2V2h9v10H9v-2H7v6c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 6V0H5v6H3V0H1v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V6H7z"/>
  </svg>
);

export default OffHandIcon;
