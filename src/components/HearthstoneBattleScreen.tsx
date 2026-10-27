/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Shield, 
  Clock, 
  Settings, 
  Flag, 
  Star, 
  Check, 
  Plus, 
  Minus, 
  RotateCcw, 
  Swords, 
  Trophy, 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Link2,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import { Card, Deck, ClanId, RoundResolutionResult } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { resolve_round, isClanBonusActive } from '../logic/resolver';
import { chooseAiAction } from '../logic/ai';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';
import { CardView } from './CardView';

export const ASSETS = {
  floatingCityBg: '/assets/images/floating_city_backdrop_1792750526802.jpg',
  opponentAvatar: '/assets/images/avatar_opponent_legend_1792750526470.jpg',
  playerAvatar: '/assets/images/avatar_player_hero_1792750526736.jpg',
};

interface HearthstoneBattleScreenProps {
  playerDeck: Deck;
  onOpenDeckBuilder?: () => void;
  onOpenDocs?: () => void;
  onBackToHub?: () => void;
  combatSpeed?: 'normal' | 'fast';
}

export const HearthstoneBattleScreen: React.FC<HearthstoneBattleScreenProps> = ({
  playerDeck,
  onOpenDeckBuilder,
  onBackToHub,
  combatSpeed = 'normal',
}) => {
  // Landscape / Portrait Mode toggle
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(true);

  // Match state (4 rounds)
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy'>('enemy');
  const [lastRoundWinner, setLastRoundWinner] = useState<'player1' | 'player2' | 'draw' | null>(null);

  // Timers
  const [matchSecondsRemaining, setMatchSecondsRemaining] = useState<number>(720);
  const [turnSecondsRemaining, setTurnSecondsRemaining] = useState<number>(60);

  // Resources: Player
  const [playerHp, setPlayerHp] = useState<number>(14);
  const [playerSparksReserve, setPlayerSparksReserve] = useState<number>(12);
  const [selectedSparks, setSelectedSparks] = useState<number>(0);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Resources: Opponent (Clear named rival)
  const opponentName = 'Майор Бастиона Торк';
  const [enemyHp, setEnemyHp] = useState<number>(14);
  const [enemySparksReserve, setEnemySparksReserve] = useState<number>(12);

  // Played card IDs
  const [playedCardIds, setPlayedCardIds] = useState<string[]>([]);

  // Player hand (4 cards from playerDeck.battleCardIds)
  const [playerCards, setPlayerCards] = useState<Card[]>(() => {
    const list = CARDS.filter(c => playerDeck.battleCardIds.includes(c.id));
    if (list.length >= 4) return list.slice(0, 4);
    const defaults = ['omurtag', 'tervel', 'phase_cleaver', 'chrono_inverter'];
    return defaults.map(id => CARDS.find(c => c.id === id) || CARDS[0]);
  });

  // Sync when deck changes
  useEffect(() => {
    const list = CARDS.filter(c => playerDeck.battleCardIds.includes(c.id));
    if (list.length >= 4) {
      setPlayerCards(list.slice(0, 4));
    }
  }, [playerDeck.battleCardIds]);

  // Enemy hand (4 varied tactical cards)
  const [enemyCards, setEnemyCards] = useState<Card[]>(() => {
    const defaults = ['lord_oon_ld', 'raaz', 'wilo_ld', 'fomalhaut_ld'];
    return defaults.map(id => CARDS.find(c => c.id === id) || CARDS[1]);
  });

  // Modals & state
  const [showSurrenderModal, setShowSurrenderModal] = useState<boolean>(false);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [floatingDamage, setFloatingDamage] = useState<{ target: 'player' | 'enemy'; amount: number } | null>(null);

  // Clash Animation State
  const [clashState, setClashState] = useState<{
    stage: 'confrontation' | 'clash' | 'damage' | 'summary';
    playerCard: Card;
    enemyCard: Card;
    playerSparks: number;
    enemySparks: number;
    playerTotalAttack: number;
    enemyTotalAttack: number;
    damageDealt: number;
    winner: 'player1' | 'player2' | 'draw';
    logMessage: string;
  } | null>(null);

  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<'player' | 'enemy' | 'draw' | null>(null);

  // Timer tick
  useEffect(() => {
    if (isMatchOver) return;

    const timer = setInterval(() => {
      setMatchSecondsRemaining(prev => Math.max(0, prev - 1));
      setTurnSecondsRemaining(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isMatchOver]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectPlayerCard = (card: Card) => {
    if (clashState !== null || playedCardIds.includes(card.id)) return;
    sound.playCardSelect();
    setSelectedCardId(card.id);
    if (selectedSparks > playerSparksReserve) {
      setSelectedSparks(0);
    }
  };

  // Spark controls
  const handleSetSparks = (num: number) => {
    sound.playCardSelect();
    setSelectedSparks(Math.min(playerSparksReserve, Math.max(0, num)));
  };

  const activeSelectedCard = playerCards.find(c => c.id === selectedCardId);

  // Predicted Attack formula: Power * (1 + Sparks)
  const predictedPlayerAttack = activeSelectedCard
    ? activeSelectedCard.basePower * (1 + selectedSparks)
    : 0;

  // Execute Combat Clash
  const handleCommitRound = () => {
    if (!selectedCardId || clashState !== null) return;
    const playerCard = playerCards.find(c => c.id === selectedCardId);
    if (!playerCard) return;

    const availableEnemyCards = enemyCards.filter(c => !playedCardIds.includes(c.id));
    if (availableEnemyCards.length === 0) return;

    const aiAction = chooseAiAction(
      availableEnemyCards,
      enemySparksReserve,
      roundNumber,
      'tactical',
      playerCard
    );

    const enemyCard = aiAction.card;
    const enemySparks = Math.min(aiAction.sparks, enemySparksReserve);
    const p1Sparks = Math.min(selectedSparks, playerSparksReserve);

    // Resolver call
    const result = resolve_round(
      playerCard,
      p1Sparks,
      enemyCard,
      enemySparks,
      roundNumber,
      {
        player1Hand: playerCards,
        player2Hand: enemyCards,
        player1AttacksFirst: currentTurn === 'player',
        previousRoundWinner: lastRoundWinner,
        player1Life: playerHp,
        player2Life: enemyHp,
      }
    );

    // CRITICAL: Strict Damage Rule
    // Attack = Power * (1 + Sparks)
    // Damage = Winning card's Damage stat (or modified by ability)
    // Sparks do NOT multiply damage!
    const p1Attack = result.p1FinalPower * (1 + p1Sparks);
    const p2Attack = result.p2FinalPower * (1 + enemySparks);
    const winner = result.winner;

    let damage = 0;
    let logMsg = '';

    if (winner === 'player1') {
      damage = result.p1FinalDamage;
      logMsg = `Вы выиграли раунд! Атака ${p1Attack} превзошла ${p2Attack}. Нанесено ровно ${damage} урона оппоненту!`;
    } else if (winner === 'player2') {
      damage = result.p2FinalDamage;
      logMsg = `Противник выиграл раунд! Атака врага ${p2Attack} превзошла вашу ${p1Attack}. Вы получили ${damage} урона!`;
    } else {
      logMsg = `Ничья! Равная Атака ${p1Attack} = ${p2Attack}. Никто не получает урон.`;
    }

    sound.playClash();

    const speedDelay = combatSpeed === 'fast' ? 0.6 : 1.0;

    // Stage 1: Confrontation
    setClashState({
      stage: 'confrontation',
      playerCard,
      enemyCard,
      playerSparks: p1Sparks,
      enemySparks,
      playerTotalAttack: p1Attack,
      enemyTotalAttack: p2Attack,
      damageDealt: damage,
      winner,
      logMessage: logMsg,
    });

    // Stage 2: Attack clash comparison
    setTimeout(() => {
      setClashState(prev => prev ? { ...prev, stage: 'clash' } : null);
    }, 1000 * speedDelay);

    // Stage 3: Damage impact
    setTimeout(() => {
      setClashState(prev => prev ? { ...prev, stage: 'damage' } : null);
      if (winner === 'player1') {
        sound.playDamage();
        setFloatingDamage({ target: 'enemy', amount: damage });
      } else if (winner === 'player2') {
        sound.playDamage();
        setFloatingDamage({ target: 'player', amount: damage });
      } else {
        sound.playShieldBlock();
      }
    }, 2000 * speedDelay);

    // Stage 4: Resolution & Next Round / Match End
    setTimeout(() => {
      setFloatingDamage(null);

      const damageToP1 = winner === 'player2' ? damage : 0;
      const damageToP2 = winner === 'player1' ? damage : 0;

      const newPlayerHp = Math.max(0, playerHp - damageToP1);
      const newEnemyHp = Math.max(0, enemyHp - damageToP2);

      const newPlayerSparks = Math.max(0, playerSparksReserve - p1Sparks);
      const newEnemySparks = Math.max(0, enemySparksReserve - enemySparks);

      setPlayerHp(newPlayerHp);
      setEnemyHp(newEnemyHp);
      setPlayerSparksReserve(newPlayerSparks);
      setEnemySparksReserve(newEnemySparks);
      setLastRoundWinner(winner);

      setPlayedCardIds(prev => [...prev, playerCard.id, enemyCard.id]);
      setSelectedCardId('');
      setSelectedSparks(0);
      setClashState(null);

      // K.O. check or Round 4 end
      if (newPlayerHp <= 0 || newEnemyHp <= 0 || roundNumber >= 4) {
        setIsMatchOver(true);
        let win: 'player' | 'enemy' | 'draw' = 'draw';
        if (newEnemyHp <= 0 || newPlayerHp > newEnemyHp) {
          win = 'player';
          sound.playVictory();
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#38bdf8', '#a855f7'],
          });
        } else if (newPlayerHp <= 0 || newEnemyHp > newPlayerHp) {
          win = 'enemy';
        }
        setMatchWinner(win);
      } else {
        setRoundNumber(prev => prev + 1);
        setCurrentTurn(prev => (prev === 'player' ? 'enemy' : 'player'));
        setTurnSecondsRemaining(60);
      }
    }, 3600 * speedDelay);
  };

  const handleRestartMatch = () => {
    setRoundNumber(1);
    setCurrentTurn('enemy');
    setLastRoundWinner(null);
    setPlayerHp(14);
    setEnemyHp(14);
    setPlayerSparksReserve(12);
    setEnemySparksReserve(12);
    setSelectedCardId('');
    setSelectedSparks(0);
    setPlayedCardIds([]);
    setIsMatchOver(false);
    setMatchWinner(null);
    setClashState(null);
    setTurnSecondsRemaining(60);
  };

  const handleSurrender = () => {
    setShowSurrenderModal(false);
    setIsMatchOver(true);
    setMatchWinner('enemy');
    setPlayerHp(0);
  };

  return (
    <div className={`relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between ${
      isLandscapeMode ? 'max-w-6xl mx-auto' : 'max-w-md mx-auto'
    } p-3 sm:p-5 select-none transition-all`}>
      {/* =========================================================================
          TOP BAR: BACK BUTTON, TIME, OPPONENT HUD, CONTROLS
      ========================================================================== */}
      <header className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md">
        {/* Back to Hub button (ALWAYS AVAILABLE) */}
        {onBackToHub && (
          <button
            type="button"
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Вернуться в главное меню / Хаб"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Назад в Хаб</span>
          </button>
        )}

        {/* Round & Match Timer */}
        <div className="flex items-center gap-3">
          <div className="text-center font-mono">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Раунд</span>
            <span className="text-sm font-black text-amber-400">{roundNumber} / 4</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <div className="text-center font-mono">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Ход</span>
            <span className="text-xs font-black text-cyan-300">{formatTime(turnSecondsRemaining)}</span>
          </div>
        </div>

        {/* Action Controls: Orientation toggle, Surrender, Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLandscapeMode(!isLandscapeMode)}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isLandscapeMode ? 'Переключить в портретный режим' : 'Переключить в широкий режим (Landscape)'}
          >
            {isLandscapeMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSurrenderModal(true)}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Сдаться в матче"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          OPPONENT ZONE (TOP)
          - Opponent Name, Avatar, HP Bar, Sparks Reserve, 4 Cards Face Down
      ========================================================================== */}
      <section className="mt-3 p-3.5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Opponent Identity */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-rose-500/80 shadow-md shadow-rose-500/10 bg-slate-950">
              <img
                src={ASSETS.opponentAvatar}
                alt={opponentName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] font-black text-rose-400 text-center font-mono">
                БОТ
              </span>
            </div>

            <div>
              <div className="text-xs font-black text-white">{opponentName}</div>
              <div className="text-[10px] text-slate-400 font-mono">Тактический ИИ • Ветеран</div>
            </div>
          </div>

          {/* Opponent Health & Sparks */}
          <div className="flex items-center gap-3">
            {/* Sparks */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs"
              title="Запас Квантовых Искр оппонента"
            >
              <Sparkles className="w-3.5 h-3.5 fill-cyan-400 text-cyan-300" />
              <span className="tabular-nums">{enemySparksReserve}</span>
            </div>

            {/* Health Bar */}
            <div className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-rose-500/60 text-rose-300 font-mono font-black text-sm shadow-sm">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-400 animate-pulse" />
              <span className="tabular-nums">{enemyHp}</span>
              <span className="text-[10px] text-slate-500 font-normal">/ 14</span>

              {floatingDamage && floatingDamage.target === 'enemy' && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-mono font-black text-xs animate-bounce shadow-lg">
                  -{floatingDamage.amount} HP
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Opponent 4 Cards Hand (Face Down / Played Status) */}
        <div className="grid grid-cols-4 gap-2">
          {enemyCards.map((card, idx) => {
            const isPlayed = playedCardIds.includes(card.id);
            return (
              <div
                key={card.id}
                className={`aspect-[3/4] rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${
                  isPlayed
                    ? 'bg-slate-950/40 border-slate-800 opacity-30 grayscale'
                    : 'bg-gradient-to-br from-slate-900 to-slate-950 border-rose-500/40 shadow-inner'
                }`}
              >
                {isPlayed ? (
                  <span className="text-[10px] font-bold text-slate-500">Сыграна</span>
                ) : (
                  <div className="space-y-1">
                    <Shield className="w-5 h-5 text-rose-400 mx-auto" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 block">Карта #{idx + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          CENTER CLASH ARENA: CONFRONTATION & DAMAGE CALCULATION
      ========================================================================== */}
      <section className="my-4 min-h-[220px] rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 p-4 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
        {clashState ? (
          <div className="w-full flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
            {/* Showdown Header */}
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                Фаза Столкновения
              </span>
              <p className="text-xs text-slate-300 font-medium">{clashState.logMessage}</p>
            </div>

            {/* Duelists Cards & Attacks */}
            <div className="w-full grid grid-cols-2 gap-4 items-center">
              {/* Player Card in Duel */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-36 sm:w-44">
                  <CardView card={clashState.playerCard} size="urban" />
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-cyan-400 text-center w-full max-w-[180px]">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Атака Игрока</div>
                  <div className="text-lg font-black font-mono text-cyan-300">
                    {clashState.playerTotalAttack}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {clashState.playerCard.basePower} × (1 + {clashState.playerSparks})
                  </div>
                </div>
              </div>

              {/* Enemy Card in Duel */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-36 sm:w-44">
                  <CardView card={clashState.enemyCard} size="urban" />
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-rose-500 text-center w-full max-w-[180px]">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Атака Врага</div>
                  <div className="text-lg font-black font-mono text-rose-400">
                    {clashState.enemyTotalAttack}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {clashState.enemyCard.basePower} × (1 + {clashState.enemySparks})
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Neutral Arena Prompt when preparing card */
          <div className="w-full text-center space-y-3 py-2">
            <div className="flex items-center justify-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Выберите карту и вложите Квантовые Искры
              </h3>
            </div>

            {activeSelectedCard ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-400/60 max-w-lg mx-auto text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{activeSelectedCard.name}</span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">{activeSelectedCard.stars}★</span>
                </div>

                {/* Calculation preview */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/40">
                    <span className="text-[10px] text-slate-400 block">Прогнозируемая Атака:</span>
                    <strong className="text-cyan-300 font-mono text-sm">
                      {predictedPlayerAttack} АТАКА
                    </strong>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {activeSelectedCard.basePower} × (1 + {selectedSparks} искр)
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900 border border-rose-500/40">
                    <span className="text-[10px] text-slate-400 block">Урон при победе:</span>
                    <strong className="text-rose-400 font-mono text-sm">
                      -{activeSelectedCard.baseDamage} HP
                    </strong>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Снимет ровно {activeSelectedCard.baseDamage} HP у оппонента
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">
                    {activeSelectedCard.ability.description}
                  </span>
                  <button
                    type="button"
                    onClick={handleCommitRound}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wide shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-105 shrink-0"
                  >
                    В Бой!
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Нажмите на одну из доступных карт в руке внизу экрана, выберите количество искр и нажмите «В Бой!».
              </p>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          PLAYER ZONE (BOTTOM): SPARKS SELECTOR & HAND OF 4 CARDS
      ========================================================================== */}
      <footer className="space-y-3">
        {/* Sparks Controller Panel */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          {/* Player Identity & HP */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-950 shrink-0">
              <img src={ASSETS.playerAvatar} alt="Player" className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="text-xs font-black text-white">Вы (Игрок)</div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span>{playerHp} / 14 HP</span>
              </div>
            </div>
          </div>

          {/* Quantum Sparks Quick Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-400 text-cyan-300 font-mono font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 fill-cyan-400 text-cyan-300" />
              <span>Осталось: {playerSparksReserve}</span>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleSetSparks(selectedSparks - 1)}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                title="Уменьшить на 1"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {[0, 1, 2, 3, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSetSparks(val)}
                  disabled={val > playerSparksReserve}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                    selectedSparks === val
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : val > playerSparksReserve
                      ? 'text-slate-700 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {val}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleSetSparks(playerSparksReserve)}
                className={`px-2 h-7 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                  selectedSparks === playerSparksReserve && playerSparksReserve > 0
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                MAX
              </button>

              <button
                type="button"
                onClick={() => handleSetSparks(selectedSparks + 1)}
                disabled={selectedSparks >= playerSparksReserve}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Увеличить на 1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Player 4 Cards Hand */}
        <div className="grid grid-cols-4 gap-2">
          {playerCards.map((card) => {
            const isPlayed = playedCardIds.includes(card.id);
            const isSelected = selectedCardId === card.id;

            return (
              <div key={card.id} className="relative">
                <CardView
                  card={card}
                  isSelected={isSelected}
                  isPlayed={isPlayed}
                  onClick={() => handleSelectPlayerCard(card)}
                  size={isLandscapeMode ? 'urban' : 'compact'}
                />
              </div>
            );
          })}
        </div>
      </footer>

      {/* =========================================================================
          MATCH OVER MODAL (VICTORY / DEFEAT / K.O.)
      ========================================================================== */}
      {isMatchOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg bg-amber-500/20 text-amber-400 border border-amber-400">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
                Матч Завершен
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {matchWinner === 'player'
                  ? 'ПОБЕДА (НОКАУТ)!'
                  : matchWinner === 'enemy'
                  ? 'ПОРАЖЕНИЕ'
                  : 'БОЕВАЯ НИЧЬЯ'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Итоговый счет: Вы <strong>{playerHp} HP</strong> vs Оппонент <strong>{enemyHp} HP</strong>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around text-xs font-mono font-bold">
              <div className="text-amber-300">+250 Кредитов</div>
              <div className="text-cyan-300">+45 ELO</div>
              <div className="text-purple-300">+5 Кристаллов</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRestartMatch}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wide cursor-pointer shadow-md transition-all"
              >
                Сыграть Снова
              </button>

              {onBackToHub && (
                <button
                  type="button"
                  onClick={onBackToHub}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
                >
                  Вернуться в Хаб
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Surrender Confirmation Modal */}
      {showSurrenderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-5 max-w-xs w-full text-center space-y-3">
            <h4 className="font-bold text-sm text-white">Признать поражение?</h4>
            <p className="text-xs text-slate-400">
              Вы уверены, что хотите сдаться? Победа будет автоматически присуждена оппоненту.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSurrender}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Сдаться
              </button>
              <button
                type="button"
                onClick={() => setShowSurrenderModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
