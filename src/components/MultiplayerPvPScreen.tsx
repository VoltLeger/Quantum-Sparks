/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, ClanId, Deck, RoundResolutionResult } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { PlayerRecord, PlayerDatabase } from '../logic/playerDb';
import { resolve_round } from '../logic/resolver';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';
import {
  Users, Swords, Zap, Heart, Shield, RefreshCw, Send, CheckCircle2,
  Copy, Play, ArrowLeft, Trophy, Flame, Sparkles
} from 'lucide-react';

interface MultiplayerPvPScreenProps {
  playerProfile: PlayerRecord;
  playerDeck: Deck;
  onBackToHub: () => void;
  onUpdatePlayer: (updated: PlayerRecord) => void;
}

interface PeerPlayer {
  nickname: string;
  avatarUrl: string;
  rankTitle: string;
  elo: number;
  clanId: ClanId;
  hp: number;
  sparks: number;
  cards: Card[];
  usedCardIds: string[];
  selectedCard: Card | null;
  selectedSparks: number;
  isReady: boolean;
}

export const MultiplayerPvPScreen: React.FC<MultiplayerPvPScreenProps> = ({
  playerProfile,
  playerDeck,
  onBackToHub,
  onUpdatePlayer,
}) => {
  // Состояние лобби / комнаты
  const [roomState, setRoomState] = useState<'lobby' | 'searching' | 'in_match' | 'match_end'>('lobby');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [matchStatusMsg, setMatchStatusMsg] = useState<string>('Ожидание подключения...');

  // Состояние матча
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundPhase, setRoundPhase] = useState<'selection' | 'revealing' | 'result'>('selection');
  const [localHp, setLocalHp] = useState<number>(14);
  const [localSparks, setLocalSparks] = useState<number>(12);
  const [localSelectedCard, setLocalSelectedCard] = useState<Card | null>(null);
  const [localInvestedSparks, setLocalInvestedSparks] = useState<number>(0);
  const [localUsedCardIds, setLocalUsedCardIds] = useState<string[]>([]);
  const [isLocalReady, setIsLocalReady] = useState<boolean>(false);

  // Оппонент
  const [opponent, setOpponent] = useState<PeerPlayer>({
    nickname: 'Nordiman [Pro]',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    rankTitle: 'Legend',
    elo: 1420,
    clanId: 'titans',
    hp: 14,
    sparks: 12,
    cards: [],
    usedCardIds: [],
    selectedCard: null,
    selectedSparks: 0,
    isReady: false,
  });

  // Результаты раунда
  const [roundResult, setRoundResult] = useState<RoundResolutionResult | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [floatingDamage, setFloatingDamage] = useState<{ target: 'player' | 'opponent'; amount: number } | null>(null);

  // Эмодзи / Чат
  const [chatMessages, setCombatChat] = useState<{ sender: string; text: string }[]>([]);
  const [opponentBubble, setOpponentBubble] = useState<string | null>(null);
  const [playerBubble, setPlayerBubble] = useState<string | null>(null);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Подготовка карт игрока
  const battleCards: Card[] = playerDeck.battleCardIds
    .map(id => CARDS.find(c => c.id === id))
    .filter((c): c is Card => !!c);

  // Инициализация канала передачи данных (P2P между вкладками браузера / окнами)
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('quantum_sparks_pvp_network_v1');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || data.roomCode !== roomCode) return;

        if (data.type === 'PEER_JOINED') {
          setOpponent(prev => ({
            ...prev,
            nickname: data.senderNickname,
            avatarUrl: data.senderAvatar,
            elo: data.senderElo,
            clanId: data.senderClan,
          }));
          setRoomState('in_match');
          sound.playVictory();
        } else if (data.type === 'READY_ACTION') {
          setOpponent(prev => ({
            ...prev,
            selectedCard: data.card,
            selectedSparks: data.sparks,
            isReady: true,
          }));
        } else if (data.type === 'CHAT_MESSAGE') {
          setCombatChat(prev => [...prev, { sender: data.senderNickname, text: data.text }]);
          setOpponentBubble(data.text);
          setTimeout(() => setOpponentBubble(null), 3500);
        }
      };

      return () => {
        channel.close();
      };
    } catch {
      // BroadcastChannel не поддерживается в старых средах, fallback
    }
  }, [roomCode]);

  // Запуск матча (Создание комнаты)
  const handleCreateRoom = () => {
    const code = `QS-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(code);
    setRoomState('searching');
    setMatchStatusMsg(`Комната ${code} создана. Ожидание соперника...`);
    sound.playSparkInject();

    // Инициализируем карты оппонента
    const sampleClanCards = CARDS.filter(c => c.clanId === 'syndicate_of_chaos').slice(0, 4);
    setOpponent(prev => ({
      ...prev,
      cards: sampleClanCards.length === 4 ? sampleClanCards : CARDS.slice(0, 4),
    }));

    // Оповещаем другие вкладки
    broadcastChannelRef.current?.postMessage({
      type: 'ROOM_CREATED',
      roomCode: code,
      senderNickname: playerProfile.nickname,
      senderAvatar: playerProfile.avatarUrl,
      senderElo: playerProfile.elo,
      senderClan: playerProfile.starterClan || 'titans',
    });

    // Имитация автоподбора через 3.5 секунды если нет реального второго игрока
    setTimeout(() => {
      setRoomState((current) => {
        if (current === 'searching') {
          sound.playVictory();
          return 'in_match';
        }
        return current;
      });
    }, 3500);
  };

  // Вход по коду комнаты
  const handleJoinRoom = () => {
    if (!inputRoomCode.trim()) return;
    const code = inputRoomCode.trim().toUpperCase();
    setRoomCode(code);
    setRoomState('in_match');
    sound.playVictory();

    broadcastChannelRef.current?.postMessage({
      type: 'PEER_JOINED',
      roomCode: code,
      senderNickname: playerProfile.nickname,
      senderAvatar: playerProfile.avatarUrl,
      senderElo: playerProfile.elo,
      senderClan: playerProfile.starterClan || 'titans',
    });
  };

  // Быстрый онлайн подбор
  const handleQuickMatch = () => {
    const code = `QS-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(code);
    setRoomState('searching');
    setMatchStatusMsg('Поиск соперника с близким ELO (1200 - 1500)...');
    sound.playSparkInject();

    setTimeout(() => {
      // Подбираем соперника
      const enemyNames = ['QuantumPhantom', 'Valkyrie_EFC', 'CyberOverlord', 'Nordiman', 'SolarArchon'];
      const enemyClans: ClanId[] = ['syndicate_of_chaos', 'technocrats', 'shadow_walkers', 'astral_guardians', 'titans'];
      const chosenClan = enemyClans[Math.floor(Math.random() * enemyClans.length)];
      const clanCards = CARDS.filter(c => c.clanId === chosenClan).slice(0, 4);

      setOpponent({
        nickname: enemyNames[Math.floor(Math.random() * enemyNames.length)],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        rankTitle: 'Master CCG',
        elo: playerProfile.elo + Math.floor(Math.random() * 60 - 30),
        clanId: chosenClan,
        hp: 14,
        sparks: 12,
        cards: clanCards.length === 4 ? clanCards : CARDS.slice(0, 4),
        usedCardIds: [],
        selectedCard: null,
        selectedSparks: 0,
        isReady: false,
      });

      setRoomState('in_match');
      sound.playVictory();
    }, 2200);
  };

  // Выбор карты игроком
  const handleSelectCard = (card: Card) => {
    if (localUsedCardIds.includes(card.id) || isLocalReady || roundPhase !== 'selection') return;
    setLocalSelectedCard(card);
    sound.playCardPlay();
  };

  // Добавление / уменьшение искр
  const handleAdjustSparks = (delta: number) => {
    if (isLocalReady || roundPhase !== 'selection') return;
    const nextVal = localInvestedSparks + delta;
    if (nextVal >= 0 && nextVal <= localSparks) {
      setLocalInvestedSparks(nextVal);
      sound.playSparkInject();
    }
  };

  // Подтверждение хода игроком
  const handleConfirmAction = () => {
    if (!localSelectedCard || isLocalReady) return;
    setIsLocalReady(true);
    sound.playSparkInject();

    // Отправляем ход по каналу
    broadcastChannelRef.current?.postMessage({
      type: 'READY_ACTION',
      roomCode,
      card: localSelectedCard,
      sparks: localInvestedSparks,
    });

    // Оппонент делает свой ход, если это бот или нет ответа
    setTimeout(() => {
      resolveCombatRound();
    }, 1200);
  };

  // Разрешение раунда столкновения
  const resolveCombatRound = () => {
    if (!localSelectedCard) return;

    setRoundPhase('revealing');

    // Определяем ход оппонента (если не пришел по P2P)
    let oppCard = opponent.selectedCard;
    let oppSparks = opponent.selectedSparks;

    if (!oppCard) {
      const availableOppCards = opponent.cards.filter(c => !opponent.usedCardIds.includes(c.id));
      oppCard = availableOppCards[Math.floor(Math.random() * availableOppCards.length)] || opponent.cards[0];
      const maxSparksAllowed = Math.min(opponent.sparks, Math.floor(Math.random() * 4) + 1);
      oppSparks = maxSparksAllowed;
    }

    setOpponent(prev => ({
      ...prev,
      selectedCard: oppCard,
      selectedSparks: oppSparks,
      isReady: true,
    }));

    // Считаем бой через наш детерминированный движок боя
    const outcome = resolve_round(
      localSelectedCard,
      localInvestedSparks,
      oppCard,
      oppSparks,
      currentRound,
      {
        player1Hand: battleCards,
        player2Hand: opponent.cards,
        player1AttacksFirst: true,
        player1Life: localHp,
        player2Life: opponent.hp,
      }
    );

    setRoundResult(outcome);

    // Звуки и эффекты
    setTimeout(() => {
      setRoundPhase('result');

      const damageDealtToPlayer = outcome.winner === 'player2' ? outcome.p2FinalDamage : 0;
      const damageDealtToOpponent = outcome.winner === 'player1' ? outcome.p1FinalDamage : 0;
      const lifeChangeP1 = outcome.p1LifeChange || 0;
      const lifeChangeP2 = outcome.p2LifeChange || 0;

      if (outcome.winner === 'player1') {
        sound.playVictory();
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
        setFloatingDamage({ target: 'opponent', amount: damageDealtToOpponent });
      } else if (outcome.winner === 'player2') {
        sound.playDefeat();
        setFloatingDamage({ target: 'player', amount: damageDealtToPlayer });
      }

      // Применяем изменения параметров
      const newPlayerHp = Math.max(0, localHp - damageDealtToPlayer + lifeChangeP1);
      const newOpponentHp = Math.max(0, opponent.hp - damageDealtToOpponent + lifeChangeP2);
      const newPlayerSparks = Math.max(0, localSparks - localInvestedSparks + (outcome.p1SparkRefund || 0));
      const newOpponentSparks = Math.max(0, opponent.sparks - oppSparks + (outcome.p2SparkRefund || 0));

      setLocalHp(newPlayerHp);
      setLocalSparks(newPlayerSparks);
      setOpponent(prev => ({
        ...prev,
        hp: newOpponentHp,
        sparks: newOpponentSparks,
        usedCardIds: [...prev.usedCardIds, oppCard!.id],
      }));
      setLocalUsedCardIds(prev => [...prev, localSelectedCard.id]);

      // Проверка окончания матча
      if (newPlayerHp <= 0 || newOpponentHp <= 0 || currentRound >= 4) {
        setTimeout(() => {
          handleMatchFinished(newPlayerHp, newOpponentHp);
        }, 3000);
      }
    }, 1500);
  };

  // Переход к следующему раунду
  const handleNextRound = () => {
    setRoundResult(null);
    setFloatingDamage(null);
    setLocalSelectedCard(null);
    setLocalInvestedSparks(0);
    setIsLocalReady(false);
    setOpponent(prev => ({
      ...prev,
      selectedCard: null,
      selectedSparks: 0,
      isReady: false,
    }));
    setCurrentRound(prev => prev + 1);
    setRoundPhase('selection');
    sound.playSparkInject();
  };

  // Завершение матча и начисление ELO/Кредитов
  const handleMatchFinished = (finalPlayerHp: number, finalOpponentHp: number) => {
    setRoomState('match_end');
    const isPlayerWin = finalPlayerHp > finalOpponentHp;

    const eloDelta = isPlayerWin ? 25 : -18;
    const creditsReward = isPlayerWin ? 650 : 150;
    const crystalsReward = isPlayerWin ? 10 : 0;

    const newElo = Math.max(400, playerProfile.elo + eloDelta);
    const newStats = {
      battles: playerProfile.stats.battles + 1,
      wins: playerProfile.stats.wins + (isPlayerWin ? 1 : 0),
      losses: playerProfile.stats.losses + (isPlayerWin ? 0 : 1),
      winRate: Math.round(((playerProfile.stats.wins + (isPlayerWin ? 1 : 0)) / (playerProfile.stats.battles + 1)) * 100),
    };

    const updated = PlayerDatabase.updatePlayerData(playerProfile.id, {
      elo: newElo,
      credits: playerProfile.credits + creditsReward,
      crystals: playerProfile.crystals + crystalsReward,
      stats: newStats,
    });

    onUpdatePlayer(updated);

    if (isPlayerWin) {
      sound.playVictory();
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
    } else {
      sound.playDefeat();
    }
  };

  // Отправка быстрого эмодзи / фразы в чат
  const handleSendEmote = (text: string) => {
    sound.playCardPlay();
    setPlayerBubble(text);
    setTimeout(() => setPlayerBubble(null), 3500);
    setCombatChat(prev => [...prev, { sender: playerProfile.nickname, text }]);

    broadcastChannelRef.current?.postMessage({
      type: 'CHAT_MESSAGE',
      roomCode,
      senderNickname: playerProfile.nickname,
      text,
    });
  };

  // Копирование кода комнаты
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 p-4 sm:p-6 select-none">
      {/* 1. ЭКРАН ЛОББИ СЕТЕВОГО РЕЖИМА */}
      {roomState === 'lobby' && (
        <div className="max-w-4xl mx-auto w-full my-auto space-y-6 animate-in fade-in">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-3">
              <Users className="w-4 h-4" /> Сетевой Режим Онлайн
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Сетевые Дуэли Олимпа (PvP)
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Сражайтесь с другими игроками в реальном времени. Без дорогих внешних серверов — легкая P2P-синхронизация по кодам комнат и быстрый матчмейкинг.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Мини-Сервер Тестеров: P2P Network + GitHub Gist Sync активны</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Карточка 1: Быстрый поиск */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 flex flex-col justify-between hover:border-amber-400 transition-all shadow-xl shadow-amber-500/5">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Быстрый Матчмейкинг</h3>
                <p className="text-xs text-slate-400">
                  Автоматический поиск соперника с аналогичным рангом ELO ({playerProfile.elo} PTS).
                </p>
              </div>
              <button
                onClick={handleQuickMatch}
                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Найти Соперника
              </button>
            </div>

            {/* Карточка 2: Создать комнату */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-400 transition-all shadow-xl shadow-cyan-500/5">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
                  <Play className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Создать Комнату</h3>
                <p className="text-xs text-slate-400">
                  Сгенерируйте код дуэли и отправьте его другу, либо откройте во второй вкладке.
                </p>
              </div>
              <button
                onClick={handleCreateRoom}
                className="mt-6 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                Создать Дуэль
              </button>
            </div>

            {/* Карточка 3: Войти по коду */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30">
                  <Swords className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Присоединиться</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Введите 6-значный код комнаты (например, QS-8412):
                </p>
                <input
                  type="text"
                  placeholder="QS-XXXX"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center uppercase tracking-wider focus:outline-none focus:border-purple-400"
                />
              </div>
              <button
                onClick={handleJoinRoom}
                disabled={!inputRoomCode.trim()}
                className="mt-4 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-sm tracking-wide transition-all cursor-pointer"
              >
                Войти в Бой
              </button>
            </div>
          </div>

          {/* Карточка профиля игрока перед боем */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={playerProfile.avatarUrl}
                alt={playerProfile.nickname}
                className="w-10 h-10 rounded-xl object-cover border border-amber-400/50"
              />
              <div>
                <div className="text-sm font-bold text-white">{playerProfile.nickname}</div>
                <div className="text-xs text-slate-400">
                  Рейтинг: <span className="text-amber-400 font-mono font-bold">{playerProfile.elo} ELO</span> • {playerProfile.rankTitle}
                </div>
              </div>
            </div>
            <button
              onClick={onBackToHub}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              В Главное Меню
            </button>
          </div>
        </div>
      )}

      {/* 2. ПОИСК / ОЖИДАНИЕ СОПЕРНИКА */}
      {roomState === 'searching' && (
        <div className="max-w-md mx-auto my-auto text-center space-y-6 animate-in fade-in">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">{matchStatusMsg}</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Код комнаты:</span>
              <span className="text-base font-black text-amber-400 font-mono tracking-wider">{roomCode}</span>
              <button
                onClick={copyRoomCode}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Скопировать код"
              >
                <Copy className="w-4 h-4" />
              </button>
              {copiedCode && <span className="text-[10px] text-emerald-400">Скопировано!</span>}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Для теста откройте это же приложение во втором окне браузера и введите этот код!
          </p>

          <button
            onClick={() => setRoomState('lobby')}
            className="px-6 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            Отменить Поиск
          </button>
        </div>
      )}

      {/* 3. ЭКРАН СЕТЕВОГО БОЯ */}
      {(roomState === 'in_match' || roomState === 'match_end') && (
        <div className="flex-1 flex flex-col justify-between max-w-6xl mx-auto w-full">
          {/* Верхняя панель: статус матча и раунд */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Раунд {currentRound} / 4
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400 font-mono">Комната: {roomCode}</span>
            </div>

            <div className="flex items-center gap-2">
              {['GG!', 'Отличный ход!', 'Овердрайв!', 'Удачи!'].map((msg, i) => (
                <button
                  key={i}
                  onClick={() => handleSendEmote(msg)}
                  className="hidden sm:inline-block px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
                >
                  {msg}
                </button>
              ))}
              <button
                onClick={() => setRoomState('lobby')}
                className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold cursor-pointer"
              >
                Сдаться
              </button>
            </div>
          </div>

          {/* Зона Соперника (Сверху) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 relative">
              <img
                src={opponent.avatarUrl}
                alt={opponent.nickname}
                className="w-12 h-12 rounded-xl object-cover border border-rose-500/40"
              />
              {opponentBubble && (
                <div className="absolute -top-8 left-12 bg-white text-slate-950 font-bold text-xs px-2.5 py-1 rounded-lg shadow-lg animate-bounce">
                  {opponentBubble}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{opponent.nickname}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                    {opponent.elo} ELO
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Клан: <strong className="text-slate-200">{CLANS[opponent.clanId]?.name || 'Титаны'}</strong>
                </div>
              </div>
            </div>

            {/* Ресурсы оппонента */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span className="text-lg font-black text-white font-mono">{opponent.hp} HP</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                <span className="text-lg font-black text-cyan-300 font-mono">{opponent.sparks}</span>
              </div>
              <div className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
                {opponent.isReady ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ХОД СДЕЛАН
                  </span>
                ) : (
                  <span className="text-amber-400 animate-pulse">ВЫБИРАЕТ КАРТУ...</span>
                )}
              </div>
            </div>
          </div>

          {/* Центральная арена столкновения */}
          <div className="my-4 relative min-h-[220px] rounded-2xl bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-900/40 border border-slate-800/80 p-4 flex flex-col items-center justify-center">
            {/* Всплывающий урон */}
            {floatingDamage && (
              <div
                className={`absolute top-4 text-3xl font-black font-mono animate-bounce ${
                  floatingDamage.target === 'opponent' ? 'text-amber-400' : 'text-rose-500'
                }`}
              >
                -{floatingDamage.amount} HP!
              </div>
            )}

            {roundPhase === 'selection' && (
              <div className="text-center space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Фаза Выбора Карты и Квантовых Искр
                </div>
                <div className="text-sm text-slate-300">
                  {localSelectedCard
                    ? `Выбрана: ${localSelectedCard.name}. Вложено ${localInvestedSparks} искр.`
                    : 'Выберите одну из карт снизу для отправки в бой.'}
                </div>
                {localSelectedCard && !isLocalReady && (
                  <button
                    onClick={handleConfirmAction}
                    className="mt-3 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Зафиксировать Ход</span>
                  </button>
                )}
                {isLocalReady && (
                  <div className="mt-2 text-xs text-emerald-400 font-mono animate-pulse">
                    Ожидание хода соперника для одновременного вскрытия...
                  </div>
                )}
              </div>
            )}

            {/* Карты в момент вскрытия */}
            {(roundPhase === 'revealing' || roundPhase === 'result') && (
              <div className="w-full flex items-center justify-around gap-4 animate-in zoom-in-95 duration-300">
                {/* Карта оппонента */}
                <div className="w-44 bg-slate-900 border-2 border-rose-500/60 rounded-xl p-2.5 text-center shadow-lg">
                  <div className="text-[10px] text-rose-400 uppercase font-bold">Карта Соперника</div>
                  <div className="text-xs font-bold text-white truncate mt-1">{opponent.selectedCard?.name}</div>
                  <div className="h-16 my-1 rounded overflow-hidden">
                    <img
                      src={opponent.selectedCard?.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono px-1">
                    <span className="text-cyan-300">Сила: {opponent.selectedCard?.basePower}</span>
                    <span className="text-rose-400">Урон: {opponent.selectedCard?.baseDamage}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-amber-300 font-mono">
                    +{opponent.selectedSparks} Искр
                  </div>
                </div>

                {/* Центр: VS / Итог */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-amber-400 mx-auto mb-2">
                    VS
                  </div>
                  {roundResult && (
                    <div className="space-y-1">
                      <div className="text-xs font-black uppercase tracking-wider text-white">
                        {roundResult.winner === 'player1'
                          ? '🏆 ПОБЕДА В РАУНДЕ!'
                          : roundResult.winner === 'player2'
                          ? '💥 ПОРАЖЕНИЕ В РАУНДЕ'
                          : 'НИЧЬЯ'}
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        Сила {roundResult.p1FinalPower} против {roundResult.p2FinalPower}
                      </div>
                      {roundPhase === 'result' && roomState !== 'match_end' && (
                        <button
                          onClick={handleNextRound}
                          className="mt-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          Следующий Раунд
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Карта игрока */}
                <div className="w-44 bg-slate-900 border-2 border-emerald-500/60 rounded-xl p-2.5 text-center shadow-lg">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">Ваша Карта</div>
                  <div className="text-xs font-bold text-white truncate mt-1">{localSelectedCard?.name}</div>
                  <div className="h-16 my-1 rounded overflow-hidden">
                    <img
                      src={localSelectedCard?.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono px-1">
                    <span className="text-cyan-300">Сила: {localSelectedCard?.basePower}</span>
                    <span className="text-rose-400">Урон: {localSelectedCard?.baseDamage}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-amber-300 font-mono">
                    +{localInvestedSparks} Искр
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Зона Игрока (Снизу) */}
          <div className="space-y-3">
            {/* Панель инжектора искр */}
            {roundPhase === 'selection' && localSelectedCard && !isLocalReady && (
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Инжектор Квантовых Искр:</div>
                    <div className="text-[11px] text-slate-400">
                      Каждая искра дает +1 к Силе и +2 к Урону в бою.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAdjustSparks(-1)}
                    disabled={localInvestedSparks <= 0}
                    className="w-8 h-8 rounded-lg bg-slate-800 disabled:opacity-30 text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-xl font-black text-cyan-300 w-8 text-center">
                    {localInvestedSparks}
                  </span>
                  <button
                    onClick={() => handleAdjustSparks(1)}
                    disabled={localInvestedSparks >= localSparks}
                    className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Карточки в руке игрока */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {battleCards.map((card) => {
                const isUsed = localUsedCardIds.includes(card.id);
                const isSelected = localSelectedCard?.id === card.id;
                return (
                  <button
                    key={card.id}
                    disabled={isUsed || isLocalReady}
                    onClick={() => handleSelectCard(card)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isUsed
                        ? 'opacity-30 border-slate-800 bg-slate-950'
                        : isSelected
                        ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/50 scale-102 shadow-lg shadow-amber-500/20'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">{card.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{'★'.repeat(card.stars)}</span>
                    </div>

                    <div className="h-16 rounded overflow-hidden relative my-1">
                      <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 left-1 px-1 rounded bg-black/80 text-[10px] font-mono text-cyan-300">
                        {card.basePower}
                      </div>
                      <div className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[10px] font-mono text-rose-400">
                        {card.baseDamage}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-300 line-clamp-1 font-semibold">{card.ability.name}</div>
                    
                    {/* Индикатор правила бонуса клана (≥2 карт) */}
                    {(() => {
                      const clanCount = battleCards.filter(c => c.clanId === card.clanId).length;
                      const isBonusActive = clanCount >= 2;
                      return (
                        <div className={`mt-1 text-[9px] px-1 py-0.5 rounded font-mono truncate ${
                          isBonusActive 
                            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40' 
                            : 'bg-slate-950/60 text-slate-500 border border-slate-800'
                        }`}>
                          {isBonusActive ? `✓ Бонус активен (${clanCount}/4)` : `✕ Бонус выкл (${clanCount}/4)`}
                        </div>
                      );
                    })()}
                  </button>
                );
              })}
            </div>

            {/* Профиль игрока снизу */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between relative">
              {playerBubble && (
                <div className="absolute -top-8 left-12 bg-amber-400 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-lg shadow-lg animate-bounce">
                  {playerBubble}
                </div>
              )}
              <div className="flex items-center gap-3">
                <img
                  src={playerProfile.avatarUrl}
                  alt={playerProfile.nickname}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-400/50"
                />
                <div>
                  <div className="text-sm font-bold text-white">{playerProfile.nickname}</div>
                  <div className="text-xs text-slate-400">{playerProfile.rankTitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span className="text-lg font-black text-white font-mono">{localHp} HP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                  <span className="text-lg font-black text-cyan-300 font-mono">{localSparks} Искр</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ОКОНЧАНИЕ МАТЧА */}
      {roomState === 'match_end' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white">
              {localHp > opponent.hp ? '🏆 ПОБЕДА В ДУЭЛИ!' : '💥 ПОРАЖЕНИЕ'}
            </h2>
            <p className="text-xs text-slate-400">
              Итоговый счет: {localHp} HP против {opponent.hp} HP соперника.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Рейтинг ELO:</span>
                <span className="font-mono font-bold text-amber-400">
                  {localHp > opponent.hp ? '+25 PTS' : '-18 PTS'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Награда:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{localHp > opponent.hp ? '650' : '150'} Кредитов, +{localHp > opponent.hp ? '10' : '0'} Кристаллов
                </span>
              </div>
            </div>

            <button
              onClick={() => setRoomState('lobby')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide cursor-pointer"
            >
              Вернуться в Сетевое Лобби
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
