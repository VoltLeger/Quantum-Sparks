/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Shield, 
  Sword, 
  Clock, 
  Settings, 
  MessageSquare, 
  Flag, 
  Star, 
  Check, 
  Plus, 
  Minus, 
  RotateCcw, 
  Swords, 
  Trophy, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Link2,
  Zap
} from 'lucide-react';
import { Card, Deck, ClanId, RoundResolutionResult } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { resolve_round, isClanBonusActive } from '../logic/resolver';
import { chooseAiAction } from '../logic/ai';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';

export const ASSETS = {
  floatingCityBg: '/src/assets/images/floating_city_backdrop_1792750526802.jpg',
  opponentAvatar: '/src/assets/images/avatar_opponent_legend_1792750526470.jpg',
  playerAvatar: '/src/assets/images/avatar_player_hero_1792750526736.jpg',
};

interface HearthstoneBattleScreenProps {
  playerDeck: Deck;
  onOpenDeckBuilder?: () => void;
  onOpenDocs?: () => void;
  onBackToHub?: () => void;
}

export const HearthstoneBattleScreen: React.FC<HearthstoneBattleScreenProps> = ({
  playerDeck,
  onOpenDeckBuilder,
  onBackToHub,
}) => {
  // Переключатель ориентации: Альбомная (Landscape) / Портретная
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(true);

  // Состояние матча (4 раунда)
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy'>('enemy');
  const [lastRoundWinner, setLastRoundWinner] = useState<'player1' | 'player2' | 'draw' | null>(null);

  // Таймеры матча
  const [matchSecondsRemaining, setMatchSecondsRemaining] = useState<number>(743); // 12:23
  const [turnSecondsRemaining, setTurnSecondsRemaining] = useState<number>(89);    // 01:29

  // Ресурсы Игрока
  const [playerHp, setPlayerHp] = useState<number>(14);
  const [playerSparksReserve, setPlayerSparksReserve] = useState<number>(13);
  const [selectedSparks, setSelectedSparks] = useState<number>(0);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Ресурсы Оппонента
  const [enemyHp, setEnemyHp] = useState<number>(14);
  const [enemySparksReserve, setEnemySparksReserve] = useState<number>(13);

  // Список сыгранных карт (по id)
  const [playedCardIds, setPlayedCardIds] = useState<string[]>([]);

  // Рука игрока (загружается непосредственно из созданной игроком боевой четверки playerDeck.battleCardIds)
  const [playerCards, setPlayerCards] = useState<Card[]>(() => {
    const list = CARDS.filter(c => playerDeck.battleCardIds.includes(c.id));
    if (list.length >= 4) return list.slice(0, 4);
    const defaults = ['cerebrah', 'dark_nunavik', 'omurtag', 'tervel'];
    return defaults.map(id => CARDS.find(c => c.id === id) || CARDS[0]);
  });

  // Автосинхронизация при изменении колоды в конструкторе
  useEffect(() => {
    const list = CARDS.filter(c => playerDeck.battleCardIds.includes(c.id));
    if (list.length >= 4) {
      setPlayerCards(list.slice(0, 4));
    }
  }, [playerDeck.battleCardIds]);

  // Рука оппонента (4 карты из оригинального матча EFC)
  const [enemyCards, setEnemyCards] = useState<Card[]>(() => {
    const defaults = ['lord_oon_ld', 'raaz', 'wilo_ld', 'fomalhaut_ld'];
    return defaults.map(id => CARDS.find(c => c.id === id) || CARDS[1]);
  });

  // Модальные окна
  const [showSurrenderModal, setShowSurrenderModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [activeChatMessage, setActiveChatMessage] = useState<string | null>(null);

  // Состояние боевого столкновения (Clash)
  const [clashState, setClashState] = useState<{
    stage: 'idle' | 'confrontation' | 'damage' | 'victory';
    playerCard: Card;
    enemyCard: Card;
    playerSparks: number;
    enemySparks: number;
    damageToP1: number;
    damageToP2: number;
    result: RoundResolutionResult;
  } | null>(null);

  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<'player' | 'enemy' | 'draw' | null>(null);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  // Таймер обратного отсчета
  useEffect(() => {
    if (isMatchOver) return;

    const timer = setInterval(() => {
      setMatchSecondsRemaining(prev => Math.max(0, prev - 1));
      setTurnSecondsRemaining(prev => {
        if (prev <= 1) return 90;
        return prev - 1;
      });
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

    const damageToP1 = result.winner === 'player2' ? result.p2FinalDamage : 0;
    const damageToP2 = result.winner === 'player1' ? result.p1FinalDamage : 0;
    const lifeChangeP1 = result.p1LifeChange || 0;
    const lifeChangeP2 = result.p2LifeChange || 0;

    sound.playClash();

    // 1. Стадия конфронтации
    setClashState({
      stage: 'confrontation',
      playerCard,
      enemyCard,
      playerSparks: p1Sparks,
      enemySparks,
      damageToP1,
      damageToP2,
      result,
    });

    // 2. Стадия урона
    setTimeout(() => {
      setClashState(prev => prev ? { ...prev, stage: 'damage' } : null);
      if (result.winner === 'player1') {
        sound.playDamage();
      } else if (result.winner === 'player2') {
        sound.playDamage();
      } else {
        sound.playShieldBlock();
      }
    }, 1200);

    // 3. Легкая анимация победы
    setTimeout(() => {
      setClashState(prev => prev ? { ...prev, stage: 'victory' } : null);
      if (result.winner === 'player1') {
        sound.playVictory();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#38bdf8', '#a855f7'],
        });
      }
    }, 2400);

    // 4. Завершение раунда
    setTimeout(() => {
      const newPlayerHp = Math.max(0, playerHp - damageToP1 + lifeChangeP1);
      const newEnemyHp = Math.max(0, enemyHp - damageToP2 + lifeChangeP2);
      const refundP1 = result.p1SparkRefund || 0;
      const refundP2 = result.p2SparkRefund || 0;

      const newPlayerSparks = Math.max(0, playerSparksReserve - p1Sparks + refundP1);
      const newEnemySparks = Math.max(0, enemySparksReserve - enemySparks + refundP2);

      setPlayerHp(newPlayerHp);
      setEnemyHp(newEnemyHp);
      setPlayerSparksReserve(newPlayerSparks);
      setEnemySparksReserve(newEnemySparks);
      setLastRoundWinner(result.winner);

      setPlayedCardIds(prev => [...prev, playerCard.id, enemyCard.id]);
      setSelectedCardId('');
      setSelectedSparks(0);
      setClashState(null);

      if (newPlayerHp <= 0 || newEnemyHp <= 0 || roundNumber >= 4) {
        setIsMatchOver(true);
        let win: 'player' | 'enemy' | 'draw' = 'draw';
        if (newPlayerHp > newEnemyHp) win = 'player';
        else if (newEnemyHp > newPlayerHp) win = 'enemy';
        else win = 'draw';
        setMatchWinner(win);
      } else {
        setRoundNumber(prev => prev + 1);
        setCurrentTurn(prev => prev === 'player' ? 'enemy' : 'player');
        setTurnSecondsRemaining(90);
      }
    }, 4400);
  };

  const handleRestartMatch = () => {
    setRoundNumber(1);
    setCurrentTurn('enemy');
    setLastRoundWinner(null);
    setPlayerHp(14);
    setEnemyHp(14);
    setPlayerSparksReserve(13);
    setEnemySparksReserve(13);
    setSelectedCardId('');
    setSelectedSparks(0);
    setPlayedCardIds([]);
    setIsMatchOver(false);
    setMatchWinner(null);
    setClashState(null);
    setTurnSecondsRemaining(90);
  };

  const handleSurrender = () => {
    setShowSurrenderModal(false);
    setIsMatchOver(true);
    setMatchWinner('enemy');
    setPlayerHp(0);
  };

  const sendEmote = (text: string) => {
    setActiveChatMessage(text);
    setShowChatModal(false);
    setTimeout(() => setActiveChatMessage(null), 3000);
  };

  const activeSelectedCard = playerCards.find(c => c.id === selectedCardId);

  // Рендер увеличенной карточки с четким аватаром и подвалом умения/бонуса
  const renderCardSlot = (card: Card, isPlayer: boolean) => {
    const isPlayed = playedCardIds.includes(card.id);
    const isSelected = isPlayer && selectedCardId === card.id;
    const clan = CLANS[card.clanId];

    // Динамический расчет статов с учетом искр
    const effectivePower = card.basePower + (isSelected ? selectedSparks : 0);
    const effectiveDamage = card.baseDamage + (isSelected ? selectedSparks * 2 : 0);

    return (
      <div 
        key={card.id}
        onClick={isPlayer ? () => handleSelectPlayerCard(card) : () => setInspectedCard(card)}
        className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between ${
          isPlayed 
            ? 'opacity-35 grayscale scale-95 border-slate-800 cursor-not-allowed'
            : isSelected
            ? 'border-amber-400 ring-4 ring-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.65)] scale-[1.04] -translate-y-2 z-20'
            : 'border-slate-700/80 hover:border-amber-400/80 hover:scale-[1.02] shadow-xl'
        } ${isLandscapeMode ? 'h-[250px] sm:h-[280px] md:h-[320px]' : 'h-[210px] sm:h-[240px]'}`}
        style={{
          borderColor: isSelected ? '#f59e0b' : isPlayed ? '#334155' : clan?.color || '#3b82f6',
        }}
      >
        {/* ================= ФОНОВОЕ ИЗОБРАЖЕНИЕ АВАТАРА (УВЕЛИЧЕНО) ================= */}
        <div className="absolute inset-0 bg-slate-950 overflow-hidden">
          <img 
            src={card.imageUrl} 
            alt={card.name} 
            className="w-full h-full object-cover object-top filter contrast-105 brightness-105"
          />
          {/* Градиенты для безупречной читаемости текста сверху и снизу */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-slate-950/90 to-transparent" />
        </div>

        {/* ================= ВЕРХНЯЯ ШАПКА КАРТЫ ================= */}
        <div className="relative z-10 flex items-center justify-between p-1.5 sm:p-2 bg-slate-950/75 backdrop-blur-xs border-b border-white/10">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-slate-950 shadow-sm shrink-0 border border-white/30"
            style={{ backgroundColor: clan?.color || '#3b82f6' }}
            title={`Клан: ${clan?.name}`}
          >
            {card.clanId === 'titans' && 'T'}
            {card.clanId === 'astral_guardians' && 'A'}
            {card.clanId === 'technocrats' && 'TC'}
            {card.clanId === 'shadow_walkers' && 'S'}
            {card.clanId === 'syndicate_of_chaos' && 'C'}
          </div>

          <div className="font-black text-xs sm:text-sm text-white uppercase tracking-tight truncate px-1 drop-shadow-md">
            {card.name}
          </div>

          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* ================= ЛЕВАЯ ПЛАШКА: СИЛА И УРОН ================= */}
        <div className="relative z-10 flex flex-col items-start gap-1 p-2 self-start mt-auto mb-1">
          {/* Сила (Щит) */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-black text-xs sm:text-sm shadow-lg border border-blue-400/40">
            <Shield className="w-3.5 h-3.5 fill-current" />
            <span>{effectivePower}</span>
          </div>

          {/* Урон (Меч) */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-mono font-black text-xs sm:text-sm shadow-lg border border-rose-400/40">
            <Sword className="w-3.5 h-3.5 fill-current" />
            <span>{effectiveDamage}</span>
          </div>
        </div>

        {/* ================= ПОДВАЛ КАРТЫ: УМЕНИЕ И БОНУС КЛАНА ================= */}
        <div className="relative z-10 p-2 bg-slate-950/95 backdrop-blur-md border-t border-white/10 space-y-1">
          {/* Звезды карты */}
          <div className="flex items-center justify-between pb-0.5 border-b border-slate-800/80">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: card.stars }).map((_, s) => (
                <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[9px] font-mono font-bold text-amber-300">
              {clan?.name}
            </span>
          </div>

          {/* Строка 1: Умение карты */}
          <div className="text-[9px] sm:text-[10px] text-slate-200 leading-tight line-clamp-1">
            <span className="font-extrabold text-amber-400 flex items-center gap-0.5 inline">
              <Zap className="w-2.5 h-2.5 inline fill-amber-400" /> {card.ability.name}:
            </span>{' '}
            <span className="text-slate-300">{card.ability.description}</span>
          </div>

          {/* Строка 2: Бонус Клана с проверкой правила ≥2 карт клана в руке */}
          {(() => {
            const handCards = isPlayer ? playerCards : enemyCards;
            const clanCount = handCards.filter(c => c.clanId === card.clanId).length;
            const isBonusActive = clanCount >= 2;
            return (
              <div
                className={`text-[8px] sm:text-[9px] leading-tight line-clamp-1 font-mono flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  isBonusActive
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 shadow-xs'
                    : 'text-slate-500 bg-slate-900/80 border border-slate-800'
                }`}
                title={isBonusActive ? `Бонус клана активен (${clanCount} карт клана в руке)` : `Бонус клана НЕ активен (${clanCount} из 4). Для активации нужно минимум 2 карты этого клана в руке!`}
              >
                <Link2 className={`w-2.5 h-2.5 shrink-0 ${isBonusActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                <span className="truncate">
                  {isBonusActive ? `Бонус (${clanCount}/4): ${clan?.mathBonusDescription}` : `Бонус выкл (${clanCount}/4): нужно ≥2`}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Оверлей если карта сыграна */}
        {isPlayed && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-black text-slate-400 uppercase tracking-widest">
              Сыграна
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="relative w-full min-h-[92vh] flex flex-col justify-between overflow-hidden select-none bg-slate-950 font-sans"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(15, 23, 42, 0.45) 0%, rgba(2, 6, 23, 0.92) 100%), url(${ASSETS.floatingCityBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/80 pointer-events-none" />

      {/* =====================================================================
          1. ВЕРХНЯЯ ПАНЕЛЬ ОППОНЕНТА
      ====================================================================== */}
      <header className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-2 bg-slate-950/75 backdrop-blur-md border-b border-white/10 shadow-lg">
        {/* Слева: Оппонент */}
        <div className="flex items-center gap-2">
          {onBackToHub && (
            <button
              onClick={onBackToHub}
              className="px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer mr-1"
              title="Хаб"
            >
              ← Хаб
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-full px-2.5 py-1 shadow-md">
            <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] bg-slate-950">
              <img src={ASSETS.opponentAvatar} alt="Nordiman" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-xs text-white">nordiman</span>
            <span className="text-[10px] text-slate-400">🇷🇺</span>
            <span className="text-[10px] font-bold text-slate-300">Legend</span>
            <span className="text-[10px] font-mono text-slate-400">--OLYMP--</span>
          </div>
        </div>

        {/* По центру: Ресурсы оппонента */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-rose-500/40 rounded-full px-3 py-1 shadow-md">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
            <span className="text-sm font-black font-mono text-white tabular-nums">{enemyHp}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-purple-500/50 rounded-full px-3 py-1 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Sparkles className="w-4 h-4 fill-purple-400 text-purple-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-sm font-black font-mono text-purple-200 tabular-nums">{enemySparksReserve}</span>
          </div>
        </div>

        {/* Справа: Управление ориентацией, таймер, настройки, чат, кнопка сдаться */}
        <div className="flex items-center gap-2">
          {/* Переключатель альбомной / портретной ориентации */}
          <button
            type="button"
            onClick={() => setIsLandscapeMode(!isLandscapeMode)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isLandscapeMode 
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md' 
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Переключить альбомную / компактную ориентацию экрана"
          >
            {isLandscapeMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isLandscapeMode ? 'Альбомная' : 'Компактная'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900/90 border border-amber-500/40 rounded-full px-2.5 py-1 text-xs font-mono text-amber-300 font-bold">
            <span>☀️</span>
            <span>{formatTime(matchSecondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowChatModal(!showChatModal)}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => setShowSurrenderModal(true)}
            className="px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-rose-900/60 border border-slate-700 text-xs font-bold text-slate-200 hover:text-rose-200 transition-colors cursor-pointer"
          >
            Сдаться
          </button>
        </div>
      </header>

      {/* Всплывающее облачко реплики чата */}
      {activeChatMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-400 text-cyan-300 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-bounce">
          💬 {activeChatMessage}
        </div>
      )}

      {/* Боковая плашка слева: "‹ Рейтинг EFC" */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center">
        <div className="bg-slate-900/80 backdrop-blur-md border-y border-r border-slate-700 px-2 py-4 rounded-r-xl shadow-lg flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-800 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
          <span 
            className="text-[11px] font-black uppercase tracking-widest text-amber-400 font-mono"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Рейтинг EFC
          </span>
        </div>
      </div>

      {/* =====================================================================
          2. ВЕРХНИЙ РЯД: 4 КАРТЫ ПРОТИВНИКА (УВЕЛИЧЕННЫЕ С АВАТАРОМ И ПОДВАЛОМ)
      ====================================================================== */}
      <div className={`relative z-10 px-3 sm:px-6 pt-2 pb-1 mx-auto w-full ${isLandscapeMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {enemyCards.map((card) => renderCardSlot(card, false))}
        </div>
      </div>

      {/* =====================================================================
          3. ЦЕНТРАЛЬНАЯ ПАНЕЛЬ РАУНДА
      ====================================================================== */}
      <div className="relative z-20 my-auto py-1 flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-1.5 rounded-full border border-slate-700 shadow-[0_0_25px_rgba(0,0,0,0.6)]">
          <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white">
            РАУНД {roundNumber} / 4
          </span>

          <span className="text-slate-600 font-bold">•</span>

          <span className={`font-black text-xs sm:text-sm uppercase tracking-wider ${
            currentTurn === 'player'
              ? 'text-cyan-400 animate-pulse'
              : 'text-amber-400'
          }`}>
            {currentTurn === 'player' ? 'ВАШ ХОД' : 'ХОД ПРОТИВНИКА'}
          </span>

          <span className="text-slate-600 font-bold">•</span>

          <span className="font-mono text-xs sm:text-sm font-black text-amber-300 tabular-nums">
            {formatTime(turnSecondsRemaining)}
          </span>

          {onOpenDeckBuilder && (
            <>
              <span className="text-slate-600 font-bold hidden sm:inline">•</span>
              <button
                type="button"
                onClick={onOpenDeckBuilder}
                className="text-[11px] font-mono text-amber-400 hover:underline hidden sm:inline cursor-pointer"
                title="Настроить свою колоду под этот режим"
              >
                Моя Колода ⚙️
              </button>
            </>
          )}
        </div>
      </div>

      {/* =====================================================================
          4. НИЖНИЙ РЯД: 4 КАРТЫ ИГРОКА (УВЕЛИЧЕННЫЕ С АВАТАРОМ И ПОДВАЛОМ)
      ====================================================================== */}
      <div className={`relative z-10 px-3 sm:px-6 pt-1 pb-2 mx-auto w-full ${isLandscapeMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {playerCards.map((card) => renderCardSlot(card, true))}
        </div>
      </div>

      {/* =====================================================================
          ИНТЕРАКТИВНЫЙ ИНЖЕКТОР ИСКР
      ====================================================================== */}
      {activeSelectedCard && clashState === null && (
        <div className="relative z-30 mx-auto w-full max-w-2xl px-4 pb-2 animate-fadeIn">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-amber-400 p-3 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-black text-white uppercase flex items-center gap-2">
                  <span>Вложить Квантовые Искры:</span>
                  <span className="text-amber-400 font-mono text-sm">{selectedSparks} ✨</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  +1 Силы и +2 Урона за искру (Останется: {playerSparksReserve - selectedSparks} ✨)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSparks(0)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                disabled={selectedSparks <= 0}
                onClick={() => setSelectedSparks(prev => Math.max(0, prev - 1))}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={selectedSparks >= playerSparksReserve}
                onClick={() => setSelectedSparks(prev => Math.min(playerSparksReserve, prev + 1))}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedSparks(playerSparksReserve)}
                className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
              >
                МАКС
              </button>

              <button
                type="button"
                onClick={handleCommitRound}
                className="ml-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/50 cursor-pointer transition-transform hover:scale-105"
              >
                В БОЙ ✦
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. НИЖНЯЯ ПАНЕЛЬ ИГРОКА
      ====================================================================== */}
      <footer className="relative z-30 flex items-center justify-end px-3 sm:px-6 py-2 bg-slate-950/75 backdrop-blur-md border-t border-white/10 shadow-lg gap-2.5">
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-purple-500/50 rounded-full px-3 py-1 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
          <Sparkles className="w-4 h-4 fill-purple-400 text-purple-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-sm font-black font-mono text-purple-200 tabular-nums">{playerSparksReserve}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-rose-500/40 rounded-full px-3 py-1 shadow-md">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
          <span className="text-sm font-black font-mono text-white tabular-nums">{playerHp}</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-full px-2.5 py-1 shadow-md">
          <span className="font-extrabold text-xs text-white">taldanok</span>
          <span className="text-[10px] text-slate-400">🇷🇺</span>
          <span className="text-[10px] font-bold text-slate-300">Eternal</span>
          <span className="text-[10px] font-mono text-slate-400">--OLYMP--</span>
          <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-slate-300">
            <span className="text-xs">⋮</span>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          6. БОЕВОЕ СТОЛКНОВЕНИЕ (CLASH ARENA)
      ====================================================================== */}
      {clashState && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="mb-4 text-center">
            <span className="text-xs font-mono font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-400/40 px-3 py-1 rounded-full">
              СТОЛКНОВЕНИЕ РАУНДА {roundNumber}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-2xl w-full relative">
            {/* КАРТА ИГРОКА */}
            <div className={`relative flex flex-col items-center transition-all duration-300 ${
              clashState.result.winner === 'player1' && clashState.stage === 'victory'
                ? 'scale-105 ring-4 ring-amber-400 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.8)]'
                : ''
            }`}>
              <div className="w-40 sm:w-48 rounded-2xl overflow-hidden border-2 border-cyan-400 bg-slate-900 shadow-2xl relative" style={{ aspectRatio: '3 / 4.4' }}>
                <img src={clashState.playerCard.imageUrl} alt={clashState.playerCard.name} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                
                <div className="absolute top-0 inset-x-0 p-1.5 bg-slate-950/80 text-center font-black text-xs text-white uppercase truncate">
                  {clashState.playerCard.name}
                </div>

                <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white flex items-center gap-1">
                    <Shield className="w-3 h-3 fill-current" /> {clashState.result.p1FinalPower}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                    <Sword className="w-3 h-3 fill-current" /> {clashState.result.p1FinalDamage}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold">
                <Sparkles className="w-3 h-3" /> +{clashState.playerSparks} искр
              </div>

              {(clashState.stage === 'damage' || clashState.stage === 'victory') && (
                <div className="absolute -top-6 right-2 z-20 animate-bounce">
                  {clashState.damageToP1 > 0 ? (
                    <div className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-sm shadow-[0_0_15px_rgba(244,63,94,0.8)] border border-rose-300 font-mono">
                      -{clashState.damageToP1} HP 💥
                    </div>
                  ) : (
                    <div className="px-2.5 py-0.5 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-md border border-cyan-300 font-mono">
                      0 УРОНА 🛡️
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* VS ИНДИКАТОР */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse">
                VS
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-2">
                Сила: {clashState.result.p1FinalPower} vs {clashState.result.p2FinalPower}
              </div>
            </div>

            {/* КАРТА ОППОНЕНТА */}
            <div className={`relative flex flex-col items-center transition-all duration-300 ${
              clashState.result.winner === 'player2' && clashState.stage === 'victory'
                ? 'scale-105 ring-4 ring-rose-400 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.8)]'
                : ''
            }`}>
              <div className="w-40 sm:w-48 rounded-2xl overflow-hidden border-2 border-purple-400 bg-slate-900 shadow-2xl relative" style={{ aspectRatio: '3 / 4.4' }}>
                <img src={clashState.enemyCard.imageUrl} alt={clashState.enemyCard.name} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                
                <div className="absolute top-0 inset-x-0 p-1.5 bg-slate-950/80 text-center font-black text-xs text-white uppercase truncate">
                  {clashState.enemyCard.name}
                </div>

                <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white flex items-center gap-1">
                    <Shield className="w-3 h-3 fill-current" /> {clashState.result.p2FinalPower}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                    <Sword className="w-3 h-3 fill-current" /> {clashState.result.p2FinalDamage}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-purple-400 text-purple-300 text-xs font-mono font-bold">
                <Sparkles className="w-3 h-3" /> +{clashState.enemySparks} искр
              </div>

              {(clashState.stage === 'damage' || clashState.stage === 'victory') && (
                <div className="absolute -top-6 left-2 z-20 animate-bounce">
                  {clashState.damageToP2 > 0 ? (
                    <div className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-sm shadow-[0_0_15px_rgba(244,63,94,0.8)] border border-rose-300 font-mono">
                      -{clashState.damageToP2} HP 💥
                    </div>
                  ) : (
                    <div className="px-2.5 py-0.5 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-md border border-cyan-300 font-mono">
                      0 УРОНА 🛡️
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ЛЕГКАЯ АНИМАЦИЯ ПОБЕДЫ В РАУНДЕ */}
          {clashState.stage === 'victory' && (
            <div className="mt-6 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.8)] animate-bounce flex items-center gap-2">
              <Trophy className="w-5 h-5 fill-current" />
              <span>
                {clashState.result.winner === 'player1'
                  ? `✦ ПОБЕДА В РАУНДЕ ${roundNumber}! ✦`
                  : clashState.result.winner === 'player2'
                  ? `РАУНД ${roundNumber} ПРОИГРАН`
                  : `НИЧЬЯ В РАУНДЕ ${roundNumber}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          7. МОДАЛЬНОЕ ОКНО ОКОНЧАНИЯ МАТЧА
      ====================================================================== */}
      {isMatchOver && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.5)]">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Trophy className="w-8 h-8 fill-current" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              {matchWinner === 'player' ? 'ПОБЕДА В МАТЧЕ!' : matchWinner === 'enemy' ? 'ПОРАЖЕНИЕ' : 'БОЕВАЯ НИЧЬЯ'}
            </h2>

            <p className="text-xs text-slate-400 mb-6 font-mono">
              Счет по жизням: Игрок {playerHp} HP — Оппонент {enemyHp} HP
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleRestartMatch}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Реванш (Новый бой)
              </button>

              {onOpenDeckBuilder && (
                <button
                  type="button"
                  onClick={onOpenDeckBuilder}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Настроить колоду
                </button>
              )}

              {onBackToHub && (
                <button
                  type="button"
                  onClick={onBackToHub}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Вернуться в Хаб
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. МОДАЛЬНОЕ ОКНО "СДАТЬСЯ"
      ====================================================================== */}
      {showSurrenderModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
            <h3 className="font-bold text-base text-white mb-2">Сдаться в этом матче?</h3>
            <p className="text-xs text-slate-400 mb-4">
              Оппонент получит техническую победу со счетом 14:0.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowSurrenderModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleSurrender}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
              >
                Да, сдаться
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. МОДАЛЬНОЕ ОКНО ЧАТА / ЭМОЦИЙ
      ====================================================================== */}
      {showChatModal && (
        <div className="absolute top-16 right-6 z-40 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 w-48 animate-fadeIn">
          <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Быстрые реплики:</div>
          {['Приветствую!', 'Отличный ход!', 'Квантовый перегруз!', 'Удачи в бою!'].map((phrase) => (
            <button
              key={phrase}
              onClick={() => sendEmote(phrase)}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {/* =====================================================================
          10. ДЕТАЛЬНЫЙ ПРОСМОТР КАРТЫ
      ====================================================================== */}
      {inspectedCard && (
        <div 
          onClick={() => setInspectedCard(null)}
          className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 max-w-xs w-full shadow-2xl relative"
          >
            <button 
              onClick={() => setInspectedCard(null)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className="text-center font-bold text-white text-base mb-1">{inspectedCard.name}</div>
            <div className="text-xs font-mono text-amber-400 text-center mb-3">
              Клан: {CLANS[inspectedCard.clanId]?.name} · {inspectedCard.stars}★
            </div>
            <div className="flex justify-around my-2 font-mono text-xs">
              <span className="text-blue-400 font-bold">Сила: {inspectedCard.basePower}</span>
              <span className="text-rose-400 font-bold">Урон: {inspectedCard.baseDamage}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 text-xs text-slate-300 mt-2 space-y-1">
              <div>
                <span className="font-bold text-amber-300">Умение: </span>
                <span>{inspectedCard.ability.description}</span>
              </div>
              <div className="text-cyan-400 font-mono text-[10px]">
                <span className="font-bold">Бонус Клана: </span>
                <span>{CLANS[inspectedCard.clanId]?.mathBonusDescription}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
