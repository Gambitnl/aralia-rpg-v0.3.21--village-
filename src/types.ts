/**
 * @file src/types.ts
 * This file contains all the core TypeScript type definitions and interfaces
 * used throughout the Aralia RPG application. It defines the structure of
 * game entities such as PlayerCharacter, Race, Class, Item, Location, NPC,
 * as well as game state and actions.
 * Combat-related types have been moved to `src/types/combat.ts`.
 */
import { CombatCharacter, CharacterStats } from './types/combat';

export enum GamePhase {
  MAIN_MENU,
  CHARACTER_CREATION,
  PLAYING,
  GAME_OVER,
  BATTLE_MAP_DEMO,
  LOAD_TRANSITION,
  VILLAGE_VIEW,
}

export type { CombatCharacter };

// --- NEW ---
export enum SuspicionLevel {
  Unaware,
  Suspicious,
  Alert,
}

export enum GoalStatus {
  Unknown = 'Unknown',
  Active = 'Active',
  Completed = 'Completed',
  Failed = 'Failed',
}

export interface GoalUpdatePayload {
  npcId: string;
  goalId: string;
  newStatus: GoalStatus;
}

export interface Goal {
  id: string; // A unique identifier for the goal, e.g., "find_lost_lore"
  description: string; // A player-facing description, e.g., "Wants to find the lost volume of arcane lore."
  status: GoalStatus;
}

// This new interface provides a structured way to store memories/facts for an NPC.
// It's the foundation of the Gossip & Witness system.
export interface KnownFact {
  id: string; // Unique ID for the fact, e.g., using crypto.randomUUID()
  text: string; // The fact itself, e.g., "Player persuaded the guard."
  source: 'direct' | 'gossip'; // Did the NPC witness this or hear it as a rumor?
  sourceNpcId?: string; // If 'gossip', the ID of the NPC who told them.
  isPublic: boolean; // Can this fact be spread as gossip?
  timestamp: number; // In-game time (as a number) when the fact was learned.
  strength: number; // Value from 1-10 indicating the fact's significance.
  lifespan: number; // In-game days until this fact might be forgotten (if low strength).
  sourceDiscoveryId?: string; // Optional ID of the DiscoveryEntry that spawned this fact.
}

export interface DiscoveryResidue {
  text: string; // The fact that will be learned, e.g., "Someone forced the lock on the chest."
  discoveryDc: number; // The Perception DC to find the residue.
  discovererNpcId: string; // The ID of the NPC who is likely to discover this.
}
// --- END NEW ---

// Core D&D Attributes
export type AbilityScoreName =
  | 'Strength'
  | 'Dexterity'
  | 'Constitution'
  | 'Intelligence'
  | 'Wisdom'
  | 'Charisma';

export interface AbilityScores {
  Strength: number;
  Dexterity: number;
  Constitution: number;
  Intelligence: number;
  Wisdom: number;
  Charisma: number;
}

export interface Skill {
  id: string;
  name: string;
  ability: AbilityScoreName;
}

export interface RacialAbilityBonus {
  ability: AbilityScoreName;
  bonus: number;
}

export type ElvenLineageType = 'drow' | 'high_elf' | 'wood_elf';

export interface ElvenLineageBenefit {
  level: number;
  description?: string;
  cantripId?: string;
  spellId?: string; // For higher-level spells gained via lineage
  speedIncrease?: number;
  darkvisionRange?: number; // Specific for Drow to set 120ft
  canSwapCantrip?: boolean; // For High Elf
  swappableCantripSource?: 'wizard'; // For High Elf
}

export interface ElvenLineage {
  id: ElvenLineageType;
  name: string;
  description: string;
  benefits: ElvenLineageBenefit[];
}

export type GnomeSubraceType = 'forest_gnome' | 'rock_gnome' | 'deep_gnome'; // Note: This 'deep_gnome' is for the subrace of standard Gnome. The new Deep Gnome is a separate base race.

export interface GnomeSubrace {
  id: GnomeSubraceType;
  name: string;
  description: string;
  traits: string[]; // Includes ASI description and other text-based traits
  grantedCantrip?: { id: string; spellcastingAbilitySource: 'subrace_choice' };
  grantedSpell?: {
    id: string;
    spellcastingAbilitySource: 'subrace_choice';
    usesDescription: string;
    level: number;
  };
  superiorDarkvision?: boolean; // If true, sets Darkvision to 120ft
}

export type GiantAncestryType = 'Cloud' | 'Fire' | 'Frost' | 'Hill' | 'Stone' | 'Storm';

export interface GiantAncestryBenefit {
  id: GiantAncestryType;
  name: string; // e.g., "Cloud's Jaunt"
  description: string;
  // Future: Add more structured data, e.g., damageType for Fire's Burn, condition for Hill's Tumble
}

export type FiendishLegacyType = 'abyssal' | 'chthonic' | 'infernal';

export interface FiendishLegacy {
  id: FiendishLegacyType;
  name: string;
  description: string;
  level1Benefit: {
    resistanceType: string; // e.g., "Poison", "Necrotic", "Fire"
    cantripId: string;
  };
  level3SpellId: string;
  level5SpellId: string;
}

// Configuration for a data-driven racial spell choice
export interface RacialSpellChoiceConfig {
  traitName: string;
  traitDescription: string;
}

export interface Race {
  id: string;
  name: string;
  description: string;
  abilityBonuses?: RacialAbilityBonus[];
  traits: string[];
  elvenLineages?: ElvenLineage[];
  gnomeSubraces?: GnomeSubrace[];
  giantAncestryChoices?: GiantAncestryBenefit[]; // For Goliaths
  fiendishLegacies?: FiendishLegacy[]; // For Tieflings
  imageUrl?: string; // Optional URL or Base64 data string for race image
  racialSpellChoice?: RacialSpellChoiceConfig; // Optional configuration for spell choice
}

export type DraconicAncestorType =
  | 'Black'
  | 'Blue'
  | 'Brass'
  | 'Bronze'
  | 'Copper'
  | 'Gold'
  | 'Green'
  | 'Red'
  | 'Silver'
  | 'White';
export type DraconicDamageType =
  | 'Acid'
  | 'Lightning'
  | 'Fire'
  | 'Poison'
  | 'Cold';

export interface DraconicAncestryInfo {
  type: DraconicAncestorType;
  damageType: DraconicDamageType;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 for cantrip
  description: string;
  // Potentially add school, casting time, range, components, duration
}

export interface ClassFeature {
  id: string; // Added ID property
  name: string;
  description: string;
  levelAvailable: number;
}

export interface FightingStyle extends ClassFeature {}

export interface DivineOrderOption {
  id: 'Protector' | 'Thaumaturge';
  name: string;
  description: string;
}

export interface PrimalOrderOption {
  id: 'Magician' | 'Warden';
  name: string;
  description: string;
}

export interface WarlockPatronOption {
  id: string; // e.g., 'the_fiend', 'the_great_old_one'
  name: string;
  description: string;
}

export type ArmorProficiencyLevel = 'unarmored' | 'light' | 'medium' | 'heavy';

export interface Class {
  id: string;
  name: string;
  description: string;
  hitDie: number; // e.g., 6 for d6, 8 for d8, etc.
  primaryAbility: AbilityScoreName[];
  savingThrowProficiencies: AbilityScoreName[];
  skillProficienciesAvailable: string[]; // List of skill IDs to choose from
  numberOfSkillProficiencies: number;
  armorProficiencies: string[]; // e.g., "Light Armor", "Shields"
  weaponProficiencies: string[]; // e.g., "Simple weapons", "Martial weapons"
  weaponMasterySlots?: number; // How many weapon masteries this class can choose
  startingEquipment?: string[]; // Simplified
  features: ClassFeature[]; // General class features by level
  
  // Class-specific choices at level 1
  fightingStyles?: FightingStyle[]; // For Fighters
  divineOrders?: DivineOrderOption[]; // For Clerics
  primalOrders?: PrimalOrderOption[]; // For Druids
  warlockPatrons?: WarlockPatronOption[]; // For Warlocks
  spellcasting?: {
    ability: AbilityScoreName;
    knownCantrips: number;
    knownSpellsL1: number;
    spellList: string[]; // IDs of spells available to this class
  };

  // Stat Recommender fields
  statRecommendationFocus?: AbilityScoreName[]; // Key abilities to prioritize
  statRecommendationDetails?: string; // Textual tip for stat allocation
  recommendedPointBuyPriorities?: AbilityScoreName[]; // Order of abilities for recommended point buy
}

export type EquipmentSlotType = 
  | 'Head' | 'Neck' | 'Torso' | 'Cloak' | 'Belt' 
  | 'MainHand' | 'OffHand' | 'Wrists' | 'Ring1' | 'Ring2' | 'Feet';

// --- NEW TYPES FOR SPELLCASTING & LIMITED USES ---
export interface ResourceVial {
  current: number;
  max: number;
}

export type SpellSlots = Record<`level_${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`, ResourceVial>;

export interface SpellbookData {
  knownSpells: string[]; // All spells a Wizard has in their book or a Sorcerer knows
  preparedSpells: string[]; // The subset a Wizard/Cleric has prepared for the day
  cantrips: string[]; // Array of spell IDs from src/data/spells.ts
}

export type ResetCondition = 'short_rest' | 'long_rest' | 'daily' | 'combat';

export interface LimitedUseAbility {
  name: string;
  current: number;
  max: number | 'proficiency_bonus' | 'charisma_mod' | 'strength_mod' | 'dexterity_mod' | 'constitution_mod' | 'intelligence_mod' | 'wisdom_mod';
  resetOn: ResetCondition;
}

export type LimitedUses = Record<string, LimitedUseAbility>;
// --- END NEW TYPES ---

// --- NEW GENERIC RACIAL SELECTION TYPE ---
export interface RacialSelectionData {
  // For single choices from a list like Elven Lineage, Draconic Ancestry, etc.
  choiceId?: string;
  // For spellcasting ability choices made for racial traits.
  spellAbility?: AbilityScoreName;
  // For single or multiple skill choices like Human's Skillful, Centaur's Natural Affinity, or Changeling's Instincts.
  skillIds?: string[];
}
// --- END NEW ---

export type TransportMode = 'foot' | 'mounted';

export interface PlayerCharacter {
  id?: string; // Optional unique ID for party management
  name: string;
  level?: number; // Optional level property
  proficiencyBonus?: number;
  race: Race;
  class: Class;
  abilityScores: AbilityScores;
  finalAbilityScores: AbilityScores;
  skills: Skill[];
  hp: number;
  maxHp: number;
  armorClass: number;
  speed: number;
  darkvisionRange: number;
  selectedWeaponMasteries?: string[]; // IDs of weapons mastered
  transportMode: TransportMode;

  // Spellcasting Properties
  spellcastingAbility?: 'intelligence' | 'wisdom' | 'charisma';
  spellSlots?: SpellSlots;
  spellbook?: SpellbookData;

  // Limited Use Abilities
  limitedUses?: LimitedUses;

  // Class specific selections
  selectedFightingStyle?: FightingStyle;
  selectedDivineOrder?: 'Protector' | 'Thaumaturge';
  selectedDruidOrder?: 'Magician' | 'Warden';
  selectedWarlockPatron?: string;
  
  // --- NEW GENERIC RACIAL SELECTIONS ---
  racialSelections?: Record<string, RacialSelectionData>;
  
  equippedItems: Partial<Record<EquipmentSlotType, Item>>; 
}

export interface CanEquipResult {
  can: boolean;
  reason?: string;
}

export type ArmorCategory = 'Light' | 'Medium' | 'Heavy' | 'Shield';

export interface Mastery {
  id: string;
  name: string;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory' | 'clothing' | 'consumable' | 'potion' | 'food_drink' | 'poison_toxin' | 'tool' | 'light_source' | 'ammunition' | 'trap' | 'note' | 'book' | 'map' | 'scroll' | 'key' | 'spell_component' | 'crafting_material' | 'treasure';
  icon?: string; // Optional: Emoji or SVG path data for UI
  slot?: EquipmentSlotType; // e.g., 'MainHand', 'Torso', 'Head'
  effect?: string; // e.g., "heal_25", "strength_plus_1"
  mastery?: string; // Key for MASTERY_DATA
  category?: string; // e.g., "Simple Melee", "Martial Ranged"

  // Armor-specific properties
  armorCategory?: ArmorCategory;
  baseArmorClass?: number;          // For armor: e.g., 11 for Padded, 16 for Chain Mail
  addsDexterityModifier?: boolean;  // For armor: true if Dex mod is added to AC
  maxDexterityBonus?: number;     // For armor: e.g., 2 for Medium Armor, undefined for Light, 0 for Heavy
  strengthRequirement?: number;   // For armor: e.g., 13 for Chain Mail, 15 for Plate
  stealthDisadvantage?: boolean;  // For armor: true if imposes disadvantage on Stealth
  armorClassBonus?: number;       // For Shields (+2) or other AC-enhancing items
  
  // Weapon-specific properties
  damageDice?: string; // e.g., "1d8"
  damageType?: string; // e.g., "Slashing", "Piercing", "Bludgeoning"
  properties?: string[]; // e.g., ["Finesse", "Light", "Two-Handed"]
  isMartial?: boolean; // True if martial weapon, false if simple

  donTime?: string;               // Time to put on armor (e.g., "1 minute", "10 minutes")
  doffTime?: string;              // Time to take off armor (e.g., "1 minute", "5 minutes")
  weight?: number;                // Weight in pounds
  cost?: string;                  // Cost in GP (e.g., "50 GP")
  
  // Spell Component Specific
  costInGp?: number;
  isConsumed?: boolean;
  substitutable?: boolean;
}

export interface LocationDynamicNpcConfig {
  possibleNpcIds: string[]; // Pool of NPC IDs that can spawn
  maxSpawnCount: number;    // Maximum number of NPCs to spawn from the pool
  baseSpawnChance: number;  // Chance (0.0 to 1.0) that any dynamic NPCs will spawn
}

export interface Location {
  id: string;
  name: string;
  baseDescription: string; // Fallback or initial description
  exits: { [direction: string]: string }; // e.g., { "North": "forest_path_id" }
  itemIds?: string[]; // item IDs potentially found here
  npcIds?: string[]; // Static NPC IDs present here
  dynamicNpcConfig?: LocationDynamicNpcConfig; // Configuration for dynamic NPCs
  mapCoordinates: { x: number; y: number }; // Coordinates on the world map - Now non-optional
  biomeId: string; // ID of the biome this location is primarily in - Now non-optional
  gossipLinks?: string[]; 
}

export interface TTSVoiceOption {
  name: string; // The voice_name identifier used by the API
  characteristic: string; // A descriptive characteristic (e.g., "Bright", "Firm")
}


export interface NPC {
  id: string;
  name: string;
  baseDescription: string;
  initialPersonalityPrompt: string;
  role: 'merchant' | 'quest_giver' | 'guard' | 'civilian' | 'unique';
  faction?: string;
  dialoguePromptSeed?: string;
  voice?: TTSVoiceOption;
  // This is for defining initial goals in the static data.
  // The dynamic, stateful version of goals is in GameState.npcMemory.
  goals?: Goal[];
}

export interface GameMessage {
  id: number;
  text: string;
  sender: 'system' | 'player' | 'npc';
  timestamp: Date;
}

export interface Biome {
  id: string;
  name: string;
  color: string; // Tailwind CSS color class, e.g., 'bg-green-700'
  icon?: string; // Emoji or SVG path data
  description: string;
  passable: boolean;
  impassableReason?: string; // Optional: Message explaining why it's impassable
}

export interface MapTile {
  x: number;
  y: number;
  biomeId: string;
  locationId?: string; // ID of a predefined Location at this tile
  discovered: boolean;
  isPlayerCurrent: boolean;
}

export interface MapData {
  gridSize: { rows: number; cols: number };
  tiles: MapTile[][]; // tiles[row][col]
  activeSeededFeatures?: Array<{ x: number; y: number; config: SeededFeatureConfig; actualSize: number }>;
  pathDetails?: PathDetails;
}

export interface GeminiLogEntry {
  timestamp: Date;
  functionName: string; // e.g., 'generateTileInspectionDetails', 'generateNPCResponse'
  prompt: string;
  response: string;
}

export type ActionType =
  | 'move'
  | 'look_around'
  | 'talk'
  | 'take_item'
  | 'use_item'
  | 'custom' // For general custom UI-driven actions
  | 'ask_oracle'
  | 'toggle_map'
  | 'toggle_submap_visibility' 
  | 'gemini_custom_action'
  | 'save_game'
  | 'go_to_main_menu' 
  | 'inspect_submap_tile'
  | 'toggle_dev_menu' 
  | 'toggle_party_editor'
  | 'toggle_party_overlay'
  | 'toggle_gemini_log_viewer'
  | 'TOGGLE_NPC_TEST_MODAL'
  | 'UPDATE_INSPECTED_TILE_DESCRIPTION'
  | 'TOGGLE_DISCOVERY_LOG'
  | 'TOGGLE_GLOSSARY_VISIBILITY'
  | 'TOGGLE_LOGBOOK'
  | 'ADD_MET_NPC'
  | 'EQUIP_ITEM' 
  | 'UNEQUIP_ITEM' 
  | 'DROP_ITEM'
  | 'SET_LOADING'
  | 'GENERATE_ENCOUNTER'
  | 'SHOW_ENCOUNTER_MODAL'
  | 'HIDE_ENCOUNTER_MODAL'
  | 'START_BATTLE_MAP_ENCOUNTER'
  | 'END_BATTLE'
  | 'CAST_SPELL'
  | 'USE_LIMITED_ABILITY'
  | 'LONG_REST'
  | 'SHORT_REST'
  | 'TOGGLE_PREPARED_SPELL'
  | 'UPDATE_NPC_GOAL_STATUS'
  | 'PROCESS_GOSSIP_UPDATES'
  | 'ADD_LOCATION_RESIDUE'
  | 'REMOVE_LOCATION_RESIDUE'
  | 'QUICK_TRAVEL'
  | 'ENTER_VILLAGE'
  | 'ENTER_TOWN';
  

export enum DiscoveryType {
  LOCATION_DISCOVERY = 'Location Discovery',
  NPC_INTERACTION = 'NPC Interaction',
  ITEM_ACQUISITION = 'Item Acquired',
  ITEM_USED = 'Item Used',
  ITEM_EQUIPPED = 'Item Equipped',
  ITEM_UNEQUIPPED = 'Item Unequipped',
  ITEM_DROPPED = 'Item Dropped',
  LORE_DISCOVERY = 'Lore Uncovered',
  QUEST_UPDATE = 'Quest Update',
  MISC_EVENT = 'Miscellaneous Event',
  ACTION_DISCOVERED = 'Past Action Discovered',
}

export interface DiscoveryFlag {
  key: string;
  value: string | number | boolean;
  label?: string; // Optional user-friendly label for the flag
}

export interface DiscoverySource {
  type: 'LOCATION' | 'NPC' | 'ITEM' | 'SYSTEM' | 'PLAYER_ACTION';
  id?: string; // ID of the source entity (e.g., locationId, npcId)
  name?: string; // Name of the source entity
}

export interface DiscoveryEntry {
  id: string; // Unique ID for the entry
  timestamp: number; // Timestamp of discovery (Date.now())
  gameTime: string; // In-game time string when discovered
  type: DiscoveryType;
  title: string;
  content: string; // Detailed description or notes
  source: DiscoverySource;
  flags: DiscoveryFlag[]; // For filtering, linking, e.g., [{key: "relatedCharacter", value: "npc_hermit"}]
  isRead: boolean;
  isQuestRelated?: boolean; // Optional: true if this entry is part of a quest
  questId?: string; // Optional: ID of the associated quest
  questStatus?: string; // Optional: Current status of the associated quest part
  worldMapCoordinates?: { x: number; y: number }; // Optional: World map coords if relevant
  associatedLocationId?: string; // Optional: Specific location ID
}

// ---- Encounter Generator Types ----
export interface Monster {
  name: string;
  quantity: number;
  cr: string;
  description: string;
}

// --- NEW MONSTER DATA ---
export interface MonsterData {
  id: string;
  name: string;
  baseStats: CharacterStats;
  maxHP: number;
  abilities: CombatCharacter['abilities'];
  tags: string[];
}
// ---

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface StartGameSuccessPayload {
    character: PlayerCharacter;
    mapData: MapData;
    dynamicLocationItemIds: Record<string, string[]>;
    initialLocationDescription: string;
    initialSubMapCoordinates: { x: number; y: number };
    initialActiveDynamicNpcIds: string[] | null;
    startingInventory: Item[];
}

// This represents the memory state of a single NPC
export interface NpcMemory {
  disposition: number;
  knownFacts: KnownFact[];
  suspicion: SuspicionLevel;
  goals: Goal[];
  lastInteractionTimestamp?: number; // In-game time (as a number) of the last direct player interaction.
}

// This is the payload for the batch update action for gossip.
// It allows updating multiple NPCs' memories in a single, efficient operation.
export interface GossipUpdatePayload {
  [npcId: string]: {
    newFacts: KnownFact[];
    dispositionNudge: number;
  };
}

export interface GameState {
  phase: GamePhase;
  party: PlayerCharacter[];
  tempParty: TempPartyMember[] | null; // For the encounter/party editor
  inventory: Item[];
  currentLocationId: string; // Can be a predefined location ID or a world map tile ID "coord_X_Y"
  subMapCoordinates: { x: number; y: number } | null; // Player's coordinates within the submap of currentLocationId
  messages: GameMessage[];
  isLoading: boolean;
  loadingMessage: string | null; // For contextual loading messages
  isImageLoading: boolean;
  error: string | null;
  worldSeed: number; // The seed for the entire world's procedural generation for this game session
  mapData: MapData | null; 
  isMapVisible: boolean; 
  isSubmapVisible: boolean; 
  isPartyOverlayVisible: boolean;
  isNpcTestModalVisible: boolean;
  isLogbookVisible: boolean; // For the new logbook
  dynamicLocationItemIds: Record<string, string[]>; 
  currentLocationActiveDynamicNpcIds: string[] | null; // IDs of dynamic NPCs currently active
  geminiGeneratedActions: Action[] | null;
  characterSheetModal: { 
    isOpen: boolean;
    character: PlayerCharacter | null;
  };
  gameTime: Date; // For passage of time
  
  // Dev Mode specific state
  isDevMenuVisible: boolean;
  isPartyEditorVisible: boolean;
  isGeminiLogViewerVisible: boolean;
  geminiInteractionLog: GeminiLogEntry[];
  hasNewRateLimitError: boolean; // For notification badge
  devModelOverride: string | null; // For manual model selection

  // Encounter Modal State
  isEncounterModalVisible: boolean;
  generatedEncounter: Monster[] | null;
  encounterSources: GroundingChunk[] | null;
  encounterError: string | null;
  
  // Battle Map State
  currentEnemies: CombatCharacter[] | null;

  // Fields for save/load
  saveVersion?: string; // Version of the save game format
  saveTimestamp?: number; // Timestamp of when the game was saved

  // NPC interaction context
  lastInteractedNpcId: string | null;
  lastNpcResponse: string | null;

  inspectedTileDescriptions: Record<string, string>; 

  // Discovery Journal State
  discoveryLog: DiscoveryEntry[];
  unreadDiscoveryCount: number;
  isDiscoveryLogVisible: boolean;
  isGlossaryVisible: boolean; 
  selectedGlossaryTermForModal?: string; // Added for Glossary navigation

  // NPC Memory
  npcMemory: Record<string, NpcMemory>;
  
  // World State
  locationResidues: Record<string, DiscoveryResidue | null>;

  // Character Logbook
  metNpcIds: string[];
}

export interface InspectSubmapTilePayload {
  tileX: number;
  tileY: number;
  effectiveTerrainType: string;
  worldBiomeId: string;
  parentWorldMapCoords: { x: number; y: number };
  activeFeatureConfig?: { id: string; name?: string; icon: string; generatesEffectiveTerrainType?: string }; 
}

export interface UpdateInspectedTileDescriptionPayload { 
    tileKey: string; // e.g., "worldX_worldY_subX_subY"
    description: string;
}

export interface EquipItemPayload {
  itemId: string;
  characterId: string;
}
export interface UnequipItemPayload {
  slot: EquipmentSlotType;
  characterId: string;
}
export interface UseItemPayload {
  itemId: string;
  characterId: string;
}
export interface DropItemPayload {
  itemId: string;
  characterId: string;
}

export interface AddLocationResiduePayload {
  locationId: string;
  residue: DiscoveryResidue;
}

export interface RemoveLocationResiduePayload {
  locationId: string;
}

export interface SetLoadingPayload { // For the SET_LOADING action
  isLoading: boolean;
  message?: string | null;
}

export interface ShowEncounterModalPayload {
  encounter?: Monster[];
  sources?: GroundingChunk[];
  error?: string;
  partyUsed?: TempPartyMember[]; // To show which party was used for generation
}

export interface StartBattleMapEncounterPayload {
    monsters: Monster[];
}

export interface QuickTravelPayload {
  destination: { x: number; y: number };
  durationSeconds: number;
}

export interface Action {
  type: ActionType;
  label: string; // Text on the button
  targetId?: string; // ID of location, NPC, item, coordinate string like "coord_X_Y", or direction string for submap moves.
  payload?: {
    query?: string; // For 'ask_oracle'
    geminiPrompt?: string; // For 'gemini_custom_action'
    check?: string; // For social skill checks
    targetNpcId?: string; // For social skill checks
    isEgregious?: boolean; // For immediate gossip trigger
    inspectTileDetails?: InspectSubmapTilePayload; // For 'inspect_submap_tile'
    itemId?: string; // For EQUIP_ITEM, USE_ITEM, DROP_ITEM
    slot?: EquipmentSlotType; // For UNEQUIP_ITEM
    initialTermId?: string; // For TOGGLE_GLOSSARY_VISIBILITY
    characterId?: string; // For item interactions
    spellId?: string; // For TOGGLE_PREPARED_SPELL
    spellLevel?: number; // For CAST_SPELL
    abilityId?: string; // For USE_LIMITED_ABILITY
    encounterData?: ShowEncounterModalPayload; // For SHOW_ENCOUNTER_MODAL
    startBattleMapEncounterData?: StartBattleMapEncounterPayload; // For START_BATTLE_MAP_ENCOUNTER
    npcId?: string; // For ADD_MET_NPC
    residue?: AddLocationResiduePayload;
    locationId?: string;
    quickTravel?: QuickTravelPayload; // For QUICK_TRAVEL
    [key: string]: any; // Allow other payload properties
  };
}

// GlossaryItem is used by GlossaryDisplay
export interface GlossaryDisplayItem { 
  icon: string;
  meaning: string;
  category?: string;
}

// GlossaryEntry is for the new file-based glossary index from context
// This is now the primary definition of a glossary entry's structure.
export interface GlossaryEntry {
  id: string;
  title: string;
  category: string;
  tags?: string[];
  excerpt?: string; 
  aliases?: string[]; 
  seeAlso?: string[]; 
  filePath: string; 
  subEntries?: GlossaryEntry[]; // For hierarchical navigation
}

// Centralized type for submap seeded features.
export interface SeededFeatureConfig {
  id: string;
  name?: string;
  icon: string;
  color: string;
  sizeRange: [number, number];
  numSeedsRange: [number, number];
  adjacency?: {
    icon?: string;
    color?: string;
  };
  zOffset?: number;
  scatterOverride?: Array<{ icon: string; density: number; color?: string; allowedOn?: string[] }>;
  generatesEffectiveTerrainType?: string;
  shapeType?: 'circular' | 'rectangular';
}

// New types for Submap visual configuration
export interface MicroFeatureVisual {
  icon: string;
  color?: string;
  density: number;
  allowedOn?: string[];
}

export interface BiomeVisuals {
  baseColors: string[];
  pathColor: string;
  pathIcon?: string;
  pathAdjacency?: {
    color?: string;
    scatter?: MicroFeatureVisual[];
  };
  seededFeatures?: SeededFeatureConfig[];
  scatterFeatures: MicroFeatureVisual[];
}

export interface PathDetails {
  mainPathCoords: Set<string>;
  pathAdjacencyCoords: Set<string>;
}

export interface GlossaryTooltipProps {
  termId: string;
  children: React.ReactElement<any>;
  onNavigateToGlossary?: (termId: string) => void;
}

// A simplified representation for our local party editor state
export interface TempPartyMember {
  id: string; // A unique ID for React keys, e.g., using crypto.randomUUID()
  level: number;
  classId: string; // e.g., 'fighter', 'cleric'
}

// A simple structure for the selectable classes dropdown
export interface SelectableClass {
  id: string;
  name: string;
}