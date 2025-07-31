import React from 'react';

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

const WristsIcon: React.FC<SvgIconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" {...props}>
    <path d="M20.5 4c.83 0 1.5-.67 1.5-1.5S21.33 1 20.5 1H3.5C2.67 1 2 1.67 2 2.5S2.67 4 3.5 4H4v16H3.5c-.83 0-1.5.67-1.5 1.5S2.67 23 3.5 23h17c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5H20V4h.5zM18 20H6V4h12v16z"/>
  </svg>
);

export default WristsIcon;
