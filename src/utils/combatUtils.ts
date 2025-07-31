/**
 * @file src/utils/combatUtils.ts
 * Utility functions for the combat system.
 */
import { CombatAction, CombatCharacter, Position, CharacterStats, Ability } from '../types/combat';
import { PlayerCharacter, Monster, MonsterData } from '../types';
import { CLASSES_DATA } from '../constants';
import { MONSTERS_DATA } from '../data/monsters';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getActionMessage(action: CombatAction, character: CombatCharacter): string {
  switch (action.type) {
    case 'move':
      return `${character.name} moves to (${action.targetPosition?.x}, ${action.targetPosition?.y})`;
    case 'ability':
      const ability = character.abilities.find(a => a.id === action.abilityId);
      return `${character.name} uses ${ability?.name || 'an ability'}`;
    case 'end_turn':
      return `${character.name} ends their turn`;
    default:
      return `${character.name} performs an action`;
  }
}

export function getDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  // Use Chebyshev distance (moves on a grid)
  return Math.max(Math.abs(dx), Math.abs(dy));
}

/**
 * A simple damage calculation placeholder.
 * @param baseDamage The base damage of the ability.
 * @param caster The character using the ability.
 * @param target The character being targeted.
 * @returns The calculated damage number.
 */
export function calculateDamage(baseDamage: number, caster: CombatCharacter, target: CombatCharacter): number {
    // For now, a very simple implementation.
    // A full implementation would check for resistances, vulnerabilities, defense stats, etc.
    // This is just to satisfy the call from useAbilitySystem.
    return baseDamage;
}


/**
 * Converts a PlayerCharacter from the main game state into a CombatCharacter for the battle map.
 * @param player - The PlayerCharacter object.
 * @returns A CombatCharacter object.
 */
export function createPlayerCombatCharacter(player: PlayerCharacter): CombatCharacter {
    const stats: CharacterStats = {
        strength: player.finalAbilityScores.Strength,
        dexterity: player.finalAbilityScores.Dexterity,
        constitution: player.finalAbilityScores.Constitution,
        intelligence: player.finalAbilityScores.Intelligence,
        wisdom: player.finalAbilityScores.Wisdom,
        charisma: player.finalAbilityScores.Charisma,
        baseInitiative: Math.floor((player.finalAbilityScores.Dexterity - 10) / 2),
        speed: player.speed,
        cr: 'N/A', // Player characters don't have a CR.
    };
    
    // Placeholder abilities - this should be derived from class/level in a full implementation
    const abilities: Ability[] = [
        { id: 'melee_attack', name: 'Attack', description: 'A basic melee strike.', type: 'attack', cost: { type: 'action' }, targeting: 'single_enemy', range: 1, effects: [{type: 'damage', value: 5, damageType: 'physical'}], icon: '⚔️' },
        { id: 'quick_strike', name: 'Quick Strike', description: 'A swift jab.', type: 'attack', cost: { type: 'bonus' }, targeting: 'single_enemy', range: 1, effects: [{type: 'damage', value: 2, damageType: 'physical'}], icon: '🗡️' },
    ];

    return {
        id: player.id || `player_${player.name.toLowerCase().replace(' ', '_')}`,
        name: player.name,
        class: player.class,
        position: {x: 0, y: 0}, // Position will be set later
        stats,
        abilities,
        team: 'player',
        currentHP: player.hp,
        maxHP: player.maxHp,
        initiative: 0,
        statusEffects: [],
        actionEconomy: {
            action: { used: false, remaining: 1 },
            bonusAction: { used: false, remaining: 1 },
            reaction: { used: false, remaining: 1 },
            movement: { used: 0, total: stats.speed },
            freeActions: 1,
        },
        spellbook: player.spellbook,
        spellSlots: player.spellSlots,
    };
}

/**
 * Converts a Monster from the encounter generator into a CombatCharacter for the battle map.
 * @param monster - The Monster object from the generated encounter.
 * @param index - A unique index for this monster instance.
 * @returns A CombatCharacter object representing an enemy.
 */
export function createEnemyFromMonster(monster: Monster, index: number): CombatCharacter {
    const monsterId = monster.name.toLowerCase().replace(/\s+/g, '_');
    const monsterData = MONSTERS_DATA[monsterId];

    if (!monsterData) {
        console.warn(`No data found for monster: ${monster.name}. Creating a generic enemy.`);
        // Fallback to a generic monster if data is not found
        const fallbackStats: CharacterStats = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10, baseInitiative: 0, speed: 30, cr: monster.cr || '1/4' };
        return {
            id: `enemy_${monsterId}_${index}`,
            name: `${monster.name} ${index + 1}`,
            class: CLASSES_DATA['fighter'], // Generic fallback
            position: {x: 0, y: 0},
            stats: fallbackStats,
            abilities: [{ id: 'basic_attack', name: 'Attack', description: 'A basic attack.', type: 'attack', cost: { type: 'action' }, targeting: 'single_enemy', range: 1, effects: [{type: 'damage', value: 4, damageType: 'physical'}], icon: '⚔️' }],
            team: 'enemy',
            maxHP: 10,
            currentHP: 10,
            initiative: 0,
            statusEffects: [],
            actionEconomy: {
                action: { used: false, remaining: 1 },
                bonusAction: { used: false, remaining: 1 },
                reaction: { used: false, remaining: 1 },
                movement: { used: 0, total: 30 },
                freeActions: 1,
            },
        };
    }
    
    return {
        id: `enemy_${monsterId}_${index}`,
        name: `${monsterData.name} ${index + 1}`,
        class: CLASSES_DATA['fighter'], // Still needs a class for structure, could be a "Monster" class
        position: {x: 0, y: 0}, // Will be set by spawner
        stats: monsterData.baseStats,
        abilities: monsterData.abilities,
        team: 'enemy',
        maxHP: monsterData.maxHP,
        currentHP: monsterData.maxHP,
        initiative: 0, // Will be rolled at start of combat
        statusEffects: [],
        actionEconomy: {
            action: { used: false, remaining: 1 },
            bonusAction: { used: false, remaining: 1 },
            reaction: { used: false, remaining: 1 },
            movement: { used: 0, total: monsterData.baseStats.speed },
            freeActions: 1,
        },
    };
}