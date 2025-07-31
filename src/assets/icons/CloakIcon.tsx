import React from 'react';

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

const CloakIcon: React.FC<SvgIconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" {...props}>
    <path d="M12 2c-4 0-7 3-7 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-4-3-7-7-7zm0 2c2.76 0 5 2.24 5 5v1H7V9c0-2.76 2.24-5 5-5zM5 20V11h14v9H5z"/>
  </svg>
);

export default CloakIcon;
