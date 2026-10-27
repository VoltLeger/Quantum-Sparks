/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClanId, Deck } from '../types/game';
import { CARDS } from '../data/cards';

export interface PlayerStats {
  battles: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface PlayerRecord {
  id: string;
  email: string;
  username: string;
  password?: string;
  nickname: string;
  avatarUrl: string;
  starterClan: ClanId | null;
  elo: number;
  rankTitle: string;
  credits: number;
  crystals: number;
  unlockedCardIds: string[];
  currentDeck: Deck;
  stats: PlayerStats;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_DB = 'quantum_sparks_players_v1';
const STORAGE_KEY_ACTIVE_ID = 'quantum_sparks_active_player_id_v1';

export const STARTER_AVATARS = [
  '/assets/images/avatar_player_hero_1792750526736.jpg',
  '/assets/images/card_cyber_brawler_1793011672137.jpg',
  '/assets/images/card_plasma_sniper_1793011673233.jpg',
  '/assets/images/card_neon_rogue_1793011674518.jpg',
  '/assets/images/card_quantum_archmage_1793011674690.jpg',
  '/assets/images/avatar_opponent_legend_1792750526470.jpg',
];

export function getRankTitle(elo: number): string {
  if (elo >= 2400) return 'Grandmaster Олимпа';
  if (elo >= 2000) return 'Legend';
  if (elo >= 1700) return 'Мастер Квантов';
  if (elo >= 1400) return 'Алмазный Стратег';
  if (elo >= 1200) return 'Ветеран Арены';
  if (elo >= 1000) return 'Офицер Кланов';
  return 'Рекрут Олимпа';
}

export function getStarterDeckForClan(clanId: ClanId): { starterCards: string[]; battleCards: string[]; deckName: string } {
  const clanCards = CARDS.filter(c => c.clanId === clanId);
  const clanCardIds = clanCards.map(c => c.id);

  const clanNames: Record<ClanId, string> = {
    titans: 'Бастион Титанов (Старт)',
    astral_guardians: 'Астральный Клинок (Старт)',
    technocrats: 'Кибернетика Техно (Старт)',
    shadow_walkers: 'Сумрачный Синдикат (Старт)',
    syndicate_of_chaos: 'Легион Энтропии (Старт)',
  };

  // Pick up to 4 battle cards with balanced stars
  const battleCards = clanCardIds.slice(0, 4);
  return {
    starterCards: clanCardIds,
    battleCards: battleCards.length === 4 ? battleCards : clanCardIds.slice(0, 4),
    deckName: clanNames[clanId] || 'Стартовая Колода',
  };
}

const DEFAULT_PLAYER: PlayerRecord = {
  id: 'usr_taldanok_default',
  email: 'taldanok.tactics@gmail.com',
  username: 'taldanok',
  password: 'password123',
  nickname: 'Taldanok',
  avatarUrl: STARTER_AVATARS[0],
  starterClan: 'titans',
  elo: 1340,
  rankTitle: 'Ветеран Арены',
  credits: 28500,
  crystals: 145,
  unlockedCardIds: [
    'cerebrah',
    'dark_nunavik',
    'omurtag',
    'tervel',
    'chrono_inverter',
    'phase_cleaver',
    'harmonic_resonator',
    'goliath_vanguard',
    'bastion_recruit',
    'hammer_crusher',
    'lord_oon_ld',
  ],
  currentDeck: {
    id: 'deck_olympus_core',
    name: 'Элита Олимпа (EFC)',
    cardIds: [
      'cerebrah',
      'dark_nunavik',
      'omurtag',
      'tervel',
      'chrono_inverter',
      'phase_cleaver',
      'harmonic_resonator',
      'goliath_vanguard',
    ],
    battleCardIds: [
      'cerebrah',
      'dark_nunavik',
      'omurtag',
      'tervel',
    ],
    starLimit: 25,
  },
  stats: {
    battles: 42,
    wins: 29,
    losses: 13,
    winRate: 69,
  },
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: new Date().toISOString(),
};

export class PlayerDatabase {
  private static loadDb(): Record<string, PlayerRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DB);
      if (!raw) {
        const initialDb = { [DEFAULT_PLAYER.id]: DEFAULT_PLAYER };
        localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(initialDb));
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, DEFAULT_PLAYER.id);
        return initialDb;
      }
      return JSON.parse(raw);
    } catch {
      return { [DEFAULT_PLAYER.id]: DEFAULT_PLAYER };
    }
  }

  private static saveDb(db: Record<string, PlayerRecord>): void {
    try {
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save players DB to localStorage', e);
    }
  }

  public static getActivePlayerId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || DEFAULT_PLAYER.id;
  }

  public static setActivePlayerId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  }

  public static getActivePlayer(): PlayerRecord {
    const db = this.loadDb();
    const activeId = this.getActivePlayerId();
    if (db[activeId]) {
      return db[activeId];
    }
    // Fallback to first existing player or default
    const firstKey = Object.keys(db)[0];
    if (firstKey) {
      this.setActivePlayerId(firstKey);
      return db[firstKey];
    }
    return DEFAULT_PLAYER;
  }

  public static getAllPlayers(): PlayerRecord[] {
    const db = this.loadDb();
    return Object.values(db);
  }

  public static savePlayer(player: PlayerRecord): void {
    const db = this.loadDb();
    player.rankTitle = getRankTitle(player.elo);
    player.updatedAt = new Date().toISOString();
    db[player.id] = player;
    this.saveDb(db);
  }

  public static updatePlayerNickname(playerId: string, newNickname: string): PlayerRecord {
    const db = this.loadDb();
    const player = db[playerId] || this.getActivePlayer();
    player.nickname = newNickname.trim() || player.nickname;
    player.updatedAt = new Date().toISOString();
    db[player.id] = player;
    this.saveDb(db);
    return player;
  }

  public static updatePlayerData(playerId: string, partial: Partial<PlayerRecord>): PlayerRecord {
    const db = this.loadDb();
    const player = db[playerId] || this.getActivePlayer();
    const updated: PlayerRecord = {
      ...player,
      ...partial,
      stats: {
        ...player.stats,
        ...(partial.stats || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    if (partial.elo !== undefined) {
      updated.rankTitle = getRankTitle(updated.elo);
    }
    db[player.id] = updated;
    this.saveDb(db);
    return updated;
  }

  public static registerPlayer(params: {
    email: string;
    username: string;
    password?: string;
    nickname: string;
    starterClan: ClanId;
  }): PlayerRecord {
    const db = this.loadDb();
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const starterInfo = getStarterDeckForClan(params.starterClan);

    const newPlayer: PlayerRecord = {
      id: newId,
      email: params.email.trim(),
      username: params.username.trim(),
      password: params.password || '123456',
      nickname: params.nickname.trim() || params.username.trim(),
      avatarUrl: STARTER_AVATARS[Math.floor(Math.random() * STARTER_AVATARS.length)],
      starterClan: params.starterClan,
      elo: 1200,
      rankTitle: getRankTitle(1200),
      credits: 10000,
      crystals: 50,
      unlockedCardIds: starterInfo.starterCards,
      currentDeck: {
        id: `deck_${newId}`,
        name: starterInfo.deckName,
        cardIds: starterInfo.starterCards,
        battleCardIds: starterInfo.battleCards,
        starLimit: 25,
      },
      stats: {
        battles: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db[newId] = newPlayer;
    this.saveDb(db);
    this.setActivePlayerId(newId);
    return newPlayer;
  }

  public static loginPlayer(loginOrEmail: string, pass: string): PlayerRecord | null {
    const db = this.loadDb();
    const search = loginOrEmail.trim().toLowerCase();
    const found = Object.values(db).find(
      p => (p.email.toLowerCase() === search || p.username.toLowerCase() === search) &&
           (!p.password || p.password === pass)
    );
    if (found) {
      this.setActivePlayerId(found.id);
      return found;
    }
    return null;
  }

  public static selectStarterClan(playerId: string, clanId: ClanId): PlayerRecord {
    const db = this.loadDb();
    const player = db[playerId] || this.getActivePlayer();
    const starterInfo = getStarterDeckForClan(clanId);

    player.starterClan = clanId;
    player.unlockedCardIds = starterInfo.starterCards;
    player.currentDeck = {
      id: `deck_${player.id}_${clanId}`,
      name: starterInfo.deckName,
      cardIds: starterInfo.starterCards,
      battleCardIds: starterInfo.battleCards,
      starLimit: 25,
    };
    player.updatedAt = new Date().toISOString();

    db[player.id] = player;
    this.saveDb(db);
    return player;
  }

  public static exportDatabase(): string {
    const db = this.loadDb();
    return JSON.stringify(db, null, 2);
  }

  public static exportToJson(): string {
    return this.exportDatabase();
  }

  public static importDatabase(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object' && parsed !== null) {
        localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(parsed));
        const firstId = Object.keys(parsed)[0];
        if (firstId) {
          localStorage.setItem(STORAGE_KEY_ACTIVE_ID, firstId);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public static importFromJson(jsonStr: string): boolean {
    return this.importDatabase(jsonStr);
  }

  public static deletePlayer(playerId: string): void {
    const db = this.loadDb();
    delete db[playerId];
    this.saveDb(db);
    const remaining = Object.keys(db);
    if (remaining.length > 0) {
      this.setActivePlayerId(remaining[0]);
    } else {
      db[DEFAULT_PLAYER.id] = DEFAULT_PLAYER;
      this.saveDb(db);
      this.setActivePlayerId(DEFAULT_PLAYER.id);
    }
  }
}
