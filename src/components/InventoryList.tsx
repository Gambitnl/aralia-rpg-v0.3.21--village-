/**
 * @file InventoryList.tsx
 * This component displays a list of inventory items with their details and actions.
 * It's used within the CharacterSheetModal.
 */
import React, { useMemo } from 'react';
import { PlayerCharacter, Item, Action } from '../types';
import { canEquipItem } from '../utils/characterUtils';
import Tooltip from './Tooltip';

interface InventoryListProps {
  inventory: Item[];
  character: PlayerCharacter;
  onAction: (action: Action) => void;
}

const getItemTooltipContent = (item: Item): React.ReactNode => {
  let details = `${item.description}\nType: ${item.type}`;
  if (item.slot) details += `\nSlot: ${item.slot}`;
  if (item.type === 'armor') {
      details += `\nCategory: ${item.armorCategory || 'N/A'}`;
      if (item.baseArmorClass) details += ` | Base AC: ${item.baseArmorClass}`;
      if (item.armorClassBonus) details += ` | AC Bonus: +${item.armorClassBonus}`;
      if (item.strengthRequirement) details += ` | Str Req: ${item.strengthRequirement}`;
      if (item.stealthDisadvantage) details += ` | Stealth Disadvantage`;
      if (item.addsDexterityModifier) details += ` | Adds Dex Mod (Max: ${item.maxDexterityBonus === undefined ? 'Unlimited' : item.maxDexterityBonus})`;
  } else if (item.type === 'weapon') {
      if (item.damageDice) details += `\nDamage: ${item.damageDice} ${item.damageType || ''}`;
      if (item.properties?.length) details += `\nProperties: ${item.properties.join(', ')}`;
  } else if (item.type === 'consumable' && item.effect) {
      details += `\nEffect: ${item.effect.replace(/_/g, ' ')}`;
  }
  if (item.weight) details += `\nWeight: ${item.weight} lbs`;
  if (item.cost) details += `\nCost: ${item.cost}`;
  return <pre className="text-xs whitespace-pre-wrap">{details}</pre>;
};

const InventoryList: React.FC<InventoryListProps> = ({ inventory, character, onAction }) => {
  const totalInventoryWeight = useMemo(() => {
    return inventory.reduce((total, item) => total + (item.weight || 0), 0).toFixed(2);
  }, [inventory]);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="text-xl font-semibold text-sky-400">Inventory</h3>
        <p className="text-xs text-gray-400">Total Weight: {totalInventoryWeight} lbs</p>
      </div>
      {inventory.length > 0 ? (
        <ul className="space-y-1.5 max-h-60 overflow-y-auto scrollable-content pr-1">
          {inventory.map(item => {
            const { can: canBeEquipped, reason: cantEquipReason } =
              (item.type === 'armor' || item.type === 'weapon') && item.slot ?
              canEquipItem(character, item) : { can: false, reason: undefined }; 

            return (
              <li key={item.id} className="p-2.5 bg-gray-700/70 rounded-md shadow-sm border border-gray-600/50 flex items-center justify-between hover:bg-gray-600/70 transition-colors">
                <div className="flex items-center flex-grow min-w-0"> {/* Ensure this div can shrink */}
                  {item.icon && <span className="text-xl mr-3 w-6 text-center flex-shrink-0">{item.icon}</span>}
                  <Tooltip content={getItemTooltipContent(item)}>
                    <span className="font-medium text-amber-200 text-sm cursor-help truncate" title={item.name}>{item.name}</span>
                  </Tooltip>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 ml-2">
                  {item.type === 'consumable' && (
                      <button onClick={() => onAction({ type: 'use_item', label: `Use ${item.name}`, payload: { itemId: item.id, characterId: character.id! }})}
                              className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded">Use</button>
                  )}
                  {(item.type === 'armor' || item.type === 'weapon') && item.slot && (
                    <Tooltip content={canBeEquipped ? `Equip ${item.name}` : (cantEquipReason || "Cannot equip")}>
                      <button onClick={() => onAction({ type: 'EQUIP_ITEM', label: `Equip ${item.name}`, payload: { itemId: item.id, characterId: character.id! }})}
                              disabled={!canBeEquipped}
                              className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">
                          Equip
                      </button>
                    </Tooltip>
                  )}
                  <button onClick={() => onAction({ type: 'DROP_ITEM', label: `Drop ${item.name}`, payload: { itemId: item.id, characterId: character.id! }})}
                          className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded">Drop</button>
                </div>
                {cantEquipReason && (item.type === 'armor' || item.type === 'weapon') && item.slot && !canBeEquipped &&
                  <p className="text-xs text-red-400 mt-0.5 italic w-full text-right -mr-2 -mb-1.5"> {/* To position below buttons roughly */}
                    {cantEquipReason}
                  </p>
                }
              </li>
            );
          })}
        </ul>
      ) : <p className="text-sm text-gray-500 italic">Inventory is empty.</p>}
    </div>
  );
};

export default InventoryList;