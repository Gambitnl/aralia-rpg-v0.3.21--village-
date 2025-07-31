/**
 * @file CharacterToken.tsx
 * Component to display a character's token on the battle map.
 */
import React from 'react';
import { CombatCharacter } from '../../types/combat';
import { TILE_SIZE_PX } from '../../config/mapConfig';
import Tooltip from '../Tooltip';

interface CharacterTokenProps {
  character: CombatCharacter;
  position: { x: number; y: number };
  isSelected: boolean;
  isTargetable: boolean;
  isTurn: boolean;
  onClick: () => void;
}

const getClassIcon = (classId: string) => {
    switch (classId) {
        case 'fighter': return '⚔️';
        case 'wizard': return '🧙';
        case 'cleric': return '✝️';
        default: return '●';
    }
};

const CharacterToken: React.FC<CharacterTokenProps> = ({ character, position, isSelected, isTargetable, isTurn, onClick }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x * TILE_SIZE_PX}px`,
    top: `${position.y * TILE_SIZE_PX}px`,
    width: `${TILE_SIZE_PX}px`,
    height: `${TILE_SIZE_PX}px`,
    transition: 'all 0.2s ease-in-out',
    zIndex: 10,
    cursor: 'pointer',
  };
  
  let borderColor = '#6B7280'; // gray-500 default
  if(character.team === 'player') borderColor = '#3B82F6'; // blue-500 for player team
  else borderColor = '#991B1B'; // red-800 for enemy team

  if (isTargetable) {
    borderColor = '#EF4444'; // red-500 for targetable
  }
  if (isSelected) {
    borderColor = '#FBBF24'; // amber-400 for selected
  }


  const tokenStyle: React.CSSProperties = {
    width: '80%',
    height: '80%',
    borderRadius: '50%',
    border: `3px solid ${borderColor}`,
    backgroundColor: '#1F2937', // gray-800
    boxShadow: isSelected ? '0 0 10px #FBBF24, 0 0 20px #FBBF24' : (isTargetable ? '0 0 10px #EF4444' : '0 2px 4px rgba(0,0,0,0.5)'),
    transform: isSelected ? 'scale(1.1)' : 'scale(1.0)',
    animation: isTurn ? 'pulseTurn 2s infinite' : 'none',
  };

  const icon = getClassIcon(character.class.id);

  return (
    <div style={style} className="flex items-center justify-center pointer-events-auto" onClick={onClick}>
      <Tooltip content={`${character.name} (AC: ${character.class.id === 'fighter' ? 18 : 12}, HP: ${character.currentHP}/${character.maxHP})`}>
        <div
          style={tokenStyle}
          className="flex items-center justify-center font-bold text-white text-lg"
          aria-label={`Select ${character.name}`}
        >
          {icon}
        </div>
      </Tooltip>
    </div>
  );
};

export default CharacterToken;
