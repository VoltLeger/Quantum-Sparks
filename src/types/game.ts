/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClanId = 'titans' | 'astral_guardians' | 'technocrats' | 'shadow_walkers' | 'syndicate_of_chaos';

export type CardStarTier = 1 | 2 | 3 | 4 | 5 | 6;

export type StarLimitTier = 22 | 25 | 33 | 999; // 999 = Безлимитный режим (Unlimited)

export type AbilityTiming = 'defensive' | 'offensive' | 'passive';

export type AbilityCategory = 
  | 'basic'        // Базовые (+/- Power, Damage, Attack)
  | 'victory'      // При победе (+Life, +Sparks, etc.)
  | 'defeat'       // При поражении (+Life, +Sparks, Poison, Heal)
  | 'conditional'  // Courage, Reprisal, Confidence, Revenge, Killshot, Growth
  | 'counter';     // Stop Ability, Stop Bonus, Protection, Copy, Cancel Modif

export type AbilityEffectType =
  // Базовые (работают всегда)
  | 'power_plus'
  | 'damage_plus'
  | 'power_damage_plus'
  | 'opp_power_minus'
  | 'opp_damage_minus'
  | 'opp_power_damage_minus'
  // При победе (Victory)
  | 'win_life_plus'
  | 'win_sparks_plus'
  | 'win_life_sparks_plus'
  | 'win_life_per_damage'
  | 'win_sparks_per_damage'
  | 'win_opp_life_minus'
  | 'win_opp_sparks_minus'
  // При поражении (Defeat)
  | 'defeat_life_plus'
  | 'defeat_sparks_plus'
  | 'defeat_opp_life_minus'
  | 'defeat_opp_sparks_minus'
  | 'poison'
  | 'heal'
  // Условные и позиционные
  | 'courage'
  | 'reprisal'
  | 'confidence'
  | 'revenge'
  | 'killshot'
  | 'growth'
  // Особые и контр-способности
  | 'stop_opp_ability'
  | 'stop_opp_bonus'
  | 'protection_power'
  | 'protection_damage'
  | 'copy_opp_power'
  | 'copy_opp_damage'
  | 'copy_opp_bonus'
  | 'cancel_opp_modifiers'
  | 'custom';

export interface CardAbility {
  id: string;
  name: string;
  category?: AbilityCategory;
  effectType?: AbilityEffectType;
  value?: number;
  secondaryValue?: number;
  min?: number;
  max?: number;
  description: string;
  timing: AbilityTiming;
  mathFormulaDescription: string;
}

export interface Card {
  id: string;
  name: string;
  clanId: ClanId;
  stars: CardStarTier;
  basePower: number;  // Сила (HP / Защита)
  baseDamage: number; // Урон (Атака)
  ability: CardAbility;
  artworkKeyword: string;
  imageUrl?: string;
  lore: string;
}

export interface Clan {
  id: ClanId;
  name: string;
  motto: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  description: string;
  mathBonusDescription: string;
  illustrationUrl?: string;
}

export interface Deck {
  id: string;
  name: string;
  cardIds: string[]; // 6 to 11 cards
  battleCardIds: string[]; // Exactly 4 selected cards for the match
  starLimit: StarLimitTier;
}

export interface PlayerProfile {
  id: string;
  username: string;
  ratingElo: number;
  unlockedCardIds: string[];
  decks: Deck[];
  activeDeckId: string;
  stats: {
    matchesPlayed: number;
    victories: number;
    draws: number;
    defeats: number;
    totalSparksInvested: number;
    perfectRounds: number;
  };
}

// 5-Phase Resolution Audit Log
export interface ResolutionStep {
  phase: number;
  title: string;
  p1Effect: string;
  p2Effect: string;
  p1State: { power: number; damage: number };
  p2State: { power: number; damage: number };
}

export interface RoundResolutionResult {
  roundNumber: number;
  // Initial Snapshot
  p1Card: Card;
  p2Card: Card;
  p1SparksInvested: number;
  p2SparksInvested: number;

  // Final calculated stats before clash
  p1FinalPower: number;
  p1FinalDamage: number;
  p2FinalPower: number;
  p2FinalDamage: number;

  // Residual HP after simultaneous damage
  p1SurvivingPower: number;
  p2SurvivingPower: number;

  p1Alive: boolean;
  p2Alive: boolean;

  // Winner of this specific round
  winner: 'player1' | 'player2' | 'draw';
  summary: string;

  // Step-by-step audit for transparency
  steps: ResolutionStep[];

  // Bonus resources refund or spark vampirism
  p1SparkRefund?: number;
  p2SparkRefund?: number;
  p1LifeChange?: number;
  p2LifeChange?: number;
  p1BonusActive?: boolean;
  p2BonusActive?: boolean;
}

export type GameMode = 'ai' | 'pvp_local' | 'tutorial' | 'sandbox';
export type AiDifficulty = 'easy' | 'tactical' | 'grandmaster';
