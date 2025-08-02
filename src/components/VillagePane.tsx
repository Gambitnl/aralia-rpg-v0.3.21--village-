
import React from 'react';
import { VillageLayout } from '../services/villageGenerationService';

interface VillagePaneProps {
  layout: VillageLayout;
  onBuildingClick: (buildingId: string, buildingType: string) => void;
}

const VillagePane: React.FC<VillagePaneProps> = ({ layout, onBuildingClick }) => {
  const TILE_SIZE = 16; // Visual scale factor

  return (
    <div className="relative w-full h-full bg-green-800">
      {/* Render Roads */}
      <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        {layout.roads.map(road => (
          <polyline
            key={road.id}
            points={road.pathPoints.map(p => `${p.x * TILE_SIZE},${p.y * TILE_SIZE}`).join(' ')}
            fill="none"
            stroke="#a18069"
            strokeWidth="3"
          />
        ))}
      </svg>

      {/* Render Buildings */}
      {layout.buildings.map(building => (
        <div
          key={building.id}
          className="absolute bg-yellow-900 border-2 border-yellow-700 cursor-pointer hover:bg-yellow-800"
          style={{
            left: `${building.polygon[0].x * TILE_SIZE}px`,
            top: `${building.polygon[0].y * TILE_SIZE}px`,
            width: `${(building.polygon[1].x - building.polygon[0].x) * TILE_SIZE}px`,
            height: `${(building.polygon[1].y - building.polygon[0].y) * TILE_SIZE}px`,
          }}
          onClick={() => onBuildingClick(building.id, building.type)}
        >
          <div className="w-full h-full flex items-center justify-center text-white text-xs">
            {building.type}
          </div>
        </div>
      ))}

      {/* Debug Grid (Optional) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ pointerEvents: 'none' }}>
        {layout.grid.map((row, y) => (
          <div key={y} className="flex">
            {row.map((tileName, x) => (
              <div
                key={`${x}-${y}`}
                className="w-4 h-4 border-r border-b border-gray-500"
                title={`${x},${y}: ${tileName}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VillagePane;
