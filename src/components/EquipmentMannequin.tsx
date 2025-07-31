/**
 * @file EquipmentMannequin.tsx
 * This component displays a visual representation of character equipment slots.
 * It now uses DynamicMannequinSlotIcon for empty slots and shows proficiency mismatch warnings.
 */
import React from 'react';
import { PlayerCharacter, EquipmentSlotType, Item, ArmorProficiencyLevel, ArmorCategory } from '../types';
import Tooltip from './Tooltip'; 

// Import default icon components
import HeadIcon from '../assets/icons/HeadIcon';
import NeckIcon from '../assets/icons/NeckIcon';
import TorsoIcon from '../assets/icons/TorsoIcon';
import CloakIcon from '../assets/icons/CloakIcon';
import BeltIcon from '../assets/icons/BeltIcon';
import MainHandIcon from '../assets/icons/MainHandIcon';
import OffHandIcon from '../assets/icons/OffHandIcon';
import WristsIcon from '../assets/icons/WristsIcon';
import RingIcon from '../assets/icons/RingIcon';
import FeetIcon from '../assets/icons/FeetIcon';

// Import the new dynamic icon component
import DynamicMannequinSlotIcon from './DynamicMannequinSlotIcon';
import { getCharacterMaxArmorProficiency, getArmorCategoryHierarchy, getAbilityModifierValue } from '../utils/characterUtils';


interface EquipmentMannequinProps {
  character: PlayerCharacter;
  onSlotClick?: (slot: EquipmentSlotType, item?: Item) => void; 
}

interface SlotDisplayInfo {
  id: EquipmentSlotType;
  label: string;
  defaultIcon: JSX.Element;
  gridArea: string; 
  isArmorSlot?: boolean; 
  isShieldSlot?: boolean;
}

const equipmentSlots: SlotDisplayInfo[] = [
  { id: 'Head',     label: 'Head',     defaultIcon: <HeadIcon />,     gridArea: 'head',     isArmorSlot: true },
  { id: 'Neck',     label: 'Neck',     defaultIcon: <NeckIcon />,     gridArea: 'neck' },
  { id: 'Torso',    label: 'Torso',    defaultIcon: <TorsoIcon />,    gridArea: 'torso',    isArmorSlot: true },
  { id: 'Cloak',    label: 'Cloak',    defaultIcon: <CloakIcon />,    gridArea: 'cloak' },
  { id: 'Belt',     label: 'Belt',     defaultIcon: <BeltIcon />,     gridArea: 'belt' },
  { id: 'MainHand', label: 'Main Hand',defaultIcon: <MainHandIcon />, gridArea: 'mainhand' },
  { id: 'OffHand',  label: 'Off Hand', defaultIcon: <OffHandIcon />,  gridArea: 'offhand',  isShieldSlot: true },
  { id: 'Wrists',   label: 'Wrists',   defaultIcon: <WristsIcon />,   gridArea: 'wrists',   isArmorSlot: true },
  { id: 'Ring1',    label: 'Ring 1',   defaultIcon: <RingIcon />,     gridArea: 'ring1' },
  { id: 'Ring2',    label: 'Ring 2',   defaultIcon: <RingIcon />,     gridArea: 'ring2' },
  { id: 'Feet',     label: 'Feet',     defaultIcon: <FeetIcon />,     gridArea: 'feet',     isArmorSlot: true },
];

const EquipmentMannequin: React.FC<EquipmentMannequinProps> = ({ character, onSlotClick }) => {
  const characterMaxProficiencyLevel = getCharacterMaxArmorProficiency(character);
  const charMaxProficiencyValue = getArmorCategoryHierarchy(characterMaxProficiencyLevel.charAt(0).toUpperCase() + characterMaxProficiencyLevel.slice(1) as ArmorCategory);


  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-inner border border-gray-600">
      <h3 className="text-xl font-semibold text-sky-300 mb-4 text-center">Equipment</h3>
      <div 
        className="grid gap-2 justify-center items-center"
        style={{
          gridTemplateAreas: `
            ". head ."
            "cloak torso neck"
            "wrists belt ."
            "mainhand . offhand"
            "ring1 . ring2"
            ". feet ."
          `,
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(6, auto)',
        }}
      >
        {equipmentSlots.map(slotInfo => {
          const equippedItem = character.equippedItems?.[slotInfo.id];
          let slotBorderClass = 'border-gray-500';
          let proficiencyMismatch = false;
          let mismatchReason = '';
          let damageDisplay: string | null = null;

          if (equippedItem) {
            if (equippedItem.type === 'armor') { // Type guard
              if (slotInfo.isShieldSlot && equippedItem.armorCategory === 'Shield') {
                if (!character.class.armorProficiencies.map(p => p.toLowerCase()).includes('shields')) {
                  proficiencyMismatch = true;
                  mismatchReason = 'Not proficient with shields.';
                }
              } else if (slotInfo.isArmorSlot && equippedItem.armorCategory) {
                const itemProficiencyValue = getArmorCategoryHierarchy(equippedItem.armorCategory);
                if (itemProficiencyValue > charMaxProficiencyValue) {
                  proficiencyMismatch = true;
                  mismatchReason = `Character max proficiency is ${characterMaxProficiencyLevel}, item requires ${equippedItem.armorCategory}.`;
                }
              }
            } else if (equippedItem.type === 'weapon' && equippedItem.damageDice) {
                const { finalAbilityScores } = character;
                const strMod = getAbilityModifierValue(finalAbilityScores.Strength);
                const dexMod = getAbilityModifierValue(finalAbilityScores.Dexterity);
                
                const isRanged = equippedItem.properties?.includes('Ammunition');
                const hasFinesse = equippedItem.properties?.includes('Finesse');
                
                let abilityMod = strMod;
                if (isRanged && !hasFinesse) {
                    abilityMod = dexMod;
                } else if (hasFinesse) {
                    abilityMod = Math.max(strMod, dexMod);
                }
                
                const bonusString = abilityMod !== 0 ? ` ${abilityMod > 0 ? '+' : '−'} ${Math.abs(abilityMod)}` : '';
                damageDisplay = `${equippedItem.damageDice}${bonusString}`;
            }

            slotBorderClass = proficiencyMismatch ? 'border-red-500 ring-2 ring-red-500 ring-offset-1 ring-offset-gray-700' : 'border-sky-500';
          }


          const buttonTitle = equippedItem 
            ? `${equippedItem.name} (In ${slotInfo.label})${proficiencyMismatch ? ` - Proficiency Mismatch! ${mismatchReason}` : ''}${damageDisplay ? ` | Damage: ${damageDisplay}`: ''}${onSlotClick ? ' - Click to Unequip' : ''}` 
            : `Empty ${slotInfo.label} Slot (Max Armor: ${characterMaxProficiencyLevel})`;

          return (
            <Tooltip key={slotInfo.id} content={buttonTitle}>
                <button
                onClick={() => onSlotClick?.(slotInfo.id, equippedItem)}
                style={{ gridArea: slotInfo.gridArea }}
                className={`
                    border-2 border-dashed 
                    ${slotBorderClass} 
                    hover:border-amber-400 
                    rounded-md p-2 w-20 h-20 flex flex-col items-center justify-center 
                    transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500
                    ${equippedItem ? 'bg-sky-900/30' : 'bg-gray-600/30'}
                    ${onSlotClick && equippedItem ? 'cursor-pointer' : 'cursor-default'}
                `}
                aria-label={equippedItem ? `Equipped in ${slotInfo.label}: ${equippedItem.name}.${proficiencyMismatch ? ` Proficiency mismatch: ${mismatchReason}` : ''}${onSlotClick ? ' Click to unequip.' : ''}` : `Empty ${slotInfo.label} slot. Character max armor proficiency for icon: ${characterMaxProficiencyLevel}.`}
                disabled={!onSlotClick && !equippedItem}
                >
                <div className={`flex flex-col items-center justify-center h-full w-full`}>
                    {equippedItem?.icon ? (
                         equippedItem.icon.startsWith('data:image/svg+xml') || equippedItem.icon.includes('<svg') || equippedItem.icon.endsWith('.svg') ? (
                            <img src={equippedItem.icon} alt={equippedItem.name} className="w-10 h-10 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                         ) : (
                            <span className="text-3xl">{equippedItem.icon}</span>
                         )
                    ) : equippedItem?.name ? (
                        <span className="text-xs font-semibold text-center break-words w-full px-1 line-clamp-3 text-gray-300">{equippedItem.name}</span>
                    ) : (
                       <DynamicMannequinSlotIcon 
                         characterProficiency={characterMaxProficiencyLevel}
                         slotType={slotInfo.id}
                         fallbackIcon={slotInfo.defaultIcon}
                       />
                    )}
                    {damageDisplay && (
                        <span className="text-xs font-bold text-amber-300 mt-1">{damageDisplay}</span>
                    )}
                    {equippedItem && !damageDisplay && <span className="text-[10px] text-gray-500 mt-0.5">({slotInfo.label})</span>}
                </div>
                </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default EquipmentMannequin;