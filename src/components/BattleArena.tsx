/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Swords, Bot, Users, Trophy, RotateCcw, Shield, Zap, Sparkles, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Card, Deck, GameMode, RoundResolutionResult, AiDifficulty } from '../types/game';
import { CARDS } from '../data/cards';
import { resolve_round } from '../logic/resolver';
import { chooseAiAction } from '../logic/ai';
import { CardView } from './CardView';
import { SparkController } from './SparkController';
import { CombatPipelineView } from './CombatPipelineView';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';

interface BattleArenaProps {
  playerDeck: Deck;
  onOpenDeckBuilder: () => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  playerDeck,
  onOpenDeckBuilder,
}) => {
  // Game Setup State
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('tactical');

  // Match State
  const [roundNumber, setRoundNumber] = useState<number>(1); // 1 to 4
  const [p1Scores, setP1Scores] = useState<number>(0);
  const [p2Scores, setP2Scores] = useState<number>(0);

  // Sparks Pool (Base 12 + Clan bonuses)
  const calcStartingSparks = (cards: Card[]) => {
    const technocratsCount = cards.filter(c => c.clanId === 'technocrats').length;
    return 12 + technocratsCount * 2;
  };

  // Player 1 Cards & Sparks
  const p1Squad = CARDS.filter(c => playerDeck.battleCardIds.includes(c.id));
  const [p1AvailableCards, setP1AvailableCards] = useState<Card[]>(p1Squad);
  const [p1SparksReserve, setP1SparksReserve] = useState<number>(() => calcStartingSparks(p1Squad));
  const [p1SelectedCardId, setP1SelectedCardId] = useState<string>('');
  const [p1AllocatedSparks, setP1AllocatedSparks] = useState<number>(0);
  const [p1Ready, setP1Ready] = useState<boolean>(false);

  // Player 2 / AI Cards & Sparks
  const defaultEnemyCardIds = ['chrono_inverter', 'harmonic_resonator', 'goliath_vanguard', 'phase_cleaver'];
  const p2InitialSquad = CARDS.filter(c => defaultEnemyCardIds.includes(c.id));
  const [p2AvailableCards, setP2AvailableCards] = useState<Card[]>(p2InitialSquad);
  const [p2SparksReserve, setP2SparksReserve] = useState<number>(() => calcStartingSparks(p2InitialSquad));
  const [p2SelectedCardId, setP2SelectedCardId] = useState<string>('');
  const [p2AllocatedSparks, setP2AllocatedSparks] = useState<number>(0);
  const [p2Ready, setP2Ready] = useState<boolean>(false);

  // Hotseat secrecy state
  const [hotseatPhase, setHotseatPhase] = useState<'p1_turn' | 'pass_to_p2' | 'p2_turn' | 'clash'>('p1_turn');

  // Resolution
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResolutionResult | null>(null);
  const [matchHistory, setMatchHistory] = useState<RoundResolutionResult[]>([]);
  const [isMatchFinished, setIsMatchFinished] = useState<boolean>(false);

  // Reset match
  const startNewMatch = () => {
    const p1Cards = CARDS.filter(c => playerDeck.battleCardIds.includes(c.id));
    const p2Cards = CARDS.filter(c => defaultEnemyCardIds.includes(c.id));

    setRoundNumber(1);
    setP1Scores(0);
    setP2Scores(0);
    setP1AvailableCards(p1Cards);
    setP2AvailableCards(p2Cards);
    setP1SparksReserve(calcStartingSparks(p1Cards));
    setP2SparksReserve(calcStartingSparks(p2Cards));

    setP1SelectedCardId('');
    setP1AllocatedSparks(0);
    setP1Ready(false);

    setP2SelectedCardId('');
    setP2AllocatedSparks(0);
    setP2Ready(false);

    setHotseatPhase('p1_turn');
    setCurrentRoundResult(null);
    setMatchHistory([]);
    setIsMatchFinished(false);
  };

  // Update squad when playerDeck changes
  useEffect(() => {
    startNewMatch();
  }, [playerDeck]);

  // Player 1 Confirms Turn
  const handleP1Confirm = () => {
    if (!p1SelectedCardId) return;
    sound.playCardSelect();
    setP1Ready(true);

    if (gameMode === 'ai') {
      // AI makes its turn automatically
      const aiDecision = chooseAiAction(
        p2AvailableCards,
        p2SparksReserve,
        roundNumber,
        aiDifficulty
      );
      setP2SelectedCardId(aiDecision.card.id);
      setP2AllocatedSparks(aiDecision.sparks);
      setP2Ready(true);

      // Trigger resolution
      triggerClash(
        p1SelectedCardId,
        p1AllocatedSparks,
        aiDecision.card.id,
        aiDecision.sparks
      );
    } else {
      // Hotseat: pass device to Player 2
      setHotseatPhase('pass_to_p2');
    }
  };

  // Player 2 Confirms Turn (Hotseat)
  const handleP2Confirm = () => {
    if (!p2SelectedCardId) return;
    sound.playCardSelect();
    setP2Ready(true);
    triggerClash(
      p1SelectedCardId,
      p1AllocatedSparks,
      p2SelectedCardId,
      p2AllocatedSparks
    );
  };

  // Trigger Clash and Resolution
  const triggerClash = (
    c1Id: string,
    s1: number,
    c2Id: string,
    s2: number
  ) => {
    const card1 = p1AvailableCards.find(c => c.id === c1Id)!;
    const card2 = p2AvailableCards.find(c => c.id === c2Id)!;

    sound.playClash();
    const result = resolve_round(card1, s1, card2, s2, roundNumber);

    setCurrentRoundResult(result);
    setMatchHistory(prev => [...prev, result]);
    setHotseatPhase('clash');

    // Update scores
    if (result.winner === 'player1') {
      setP1Scores(prev => prev + 1);
    } else if (result.winner === 'player2') {
      setP2Scores(prev => prev + 1);
    }

    // Deduct sparks & handle refunds (e.g. Chrono Inverter)
    const p1NewReserve = Math.max(0, p1SparksReserve - s1 + (result.p1SparkRefund || 0));
    const p2NewReserve = Math.max(0, p2SparksReserve - s2 + (result.p2SparkRefund || 0));
    setP1SparksReserve(p1NewReserve);
    setP2SparksReserve(p2NewReserve);

    // Remove used cards from available hands
    setP1AvailableCards(prev => prev.filter(c => c.id !== c1Id));
    setP2AvailableCards(prev => prev.filter(c => c.id !== c2Id));

    if (roundNumber >= 4) {
      setIsMatchFinished(true);
      setTimeout(() => {
        sound.playVictory();
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
      }, 500);
    }
  };

  // Next Round
  const handleNextRound = () => {
    if (roundNumber >= 4) {
      setIsMatchFinished(true);
      return;
    }

    setRoundNumber(prev => prev + 1);
    setP1SelectedCardId('');
    setP1AllocatedSparks(0);
    setP1Ready(false);

    setP2SelectedCardId('');
    setP2AllocatedSparks(0);
    setP2Ready(false);

    setHotseatPhase('p1_turn');
    setCurrentRoundResult(null);
  };

  const p1SelectedCard = p1AvailableCards.find(c => c.id === p1SelectedCardId);
  const p2SelectedCard = p2AvailableCards.find(c => c.id === p2SelectedCardId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Arena Header: Mode, Rounds, and Sparks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Match Status & Mode Toggles */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                Тактическая Дуэль
              </div>
              <div className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <span>Раунд {roundNumber} из 4</span>
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400">
                  Счет: {p1Scores} — {p2Scores}
                </span>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="hidden sm:flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { setGameMode('ai'); startNewMatch(); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  gameMode === 'ai' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Против ИИ</span>
              </button>
              <button
                type="button"
                onClick={() => { setGameMode('pvp_local'); startNewMatch(); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  gameMode === 'pvp_local' ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>PvP Hotseat</span>
              </button>
            </div>
          </div>

          {/* Spark Pools indicator */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Player 1 Sparks */}
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-cyan-500/30">
              <span className="text-cyan-400 font-sans font-semibold">Игрок 1:</span>
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {p1SparksReserve}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">искр</span>
            </div>

            <span className="text-slate-600 font-bold">VS</span>

            {/* Player 2 Sparks */}
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-rose-500/30">
              <span className="text-rose-400 font-sans font-semibold">
                {gameMode === 'ai' ? 'ИИ Бот:' : 'Игрок 2:'}
              </span>
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {p2SparksReserve}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">искр</span>
            </div>
          </div>
        </div>

        {/* AI Difficulty dropdown if AI mode */}
        {gameMode === 'ai' && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Сложность бота:</span>
              <select
                value={aiDifficulty}
                onChange={e => setAiDifficulty(e.target.value as AiDifficulty)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="easy">Новичок (Easy)</option>
                <option value="tactical">Тактик (Medium)</option>
                <option value="grandmaster">Грандмастер (Hard)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={startNewMatch}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Сбросить матч
            </button>
          </div>
        )}
      </div>

      {/* MATCH FINISHED MODAL / BANNER */}
      {isMatchFinished && (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {p1Scores > p2Scores
                ? 'Победа Игрока 1!'
                : p2Scores > p1Scores
                ? gameMode === 'ai'
                  ? 'Победа Тактического ИИ!'
                  : 'Победа Игрока 2!'
                : 'Боевая Ничья в Матче!'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Итоговый счет по раундам: <strong className="text-amber-400 font-mono text-base">{p1Scores} — {p2Scores}</strong>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startNewMatch}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 cursor-pointer transition-transform hover:scale-105"
            >
              Сыграть Снова
            </button>
            <button
              type="button"
              onClick={onOpenDeckBuilder}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-semibold cursor-pointer transition-colors"
            >
              Настроить Колоду
            </button>
          </div>
        </div>
      )}

      {/* RESOLUTION CLASH VIEW */}
      {currentRoundResult ? (
        <CombatPipelineView
          result={currentRoundResult}
          p1Label="Игрок 1"
          p2Label={gameMode === 'ai' ? 'Тактический ИИ' : 'Игрок 2'}
          onNextRound={handleNextRound}
          isMatchOver={roundNumber >= 4}
        />
      ) : (
        /* ACTIVE ROUND PLANNING PHASE */
        <div className="space-y-6">
          {/* HOTSEAT PASS DEVICE SCREEN */}
          {gameMode === 'pvp_local' && hotseatPhase === 'pass_to_p2' && (
            <div className="p-8 rounded-2xl bg-slate-900 border border-purple-500/40 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Передайте устройство Игроку 2</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Игрок 1 выбрал карту и выделил искры тайно. Теперь очередь Игрока 2 сделать свой скрытый выбор.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHotseatPhase('p2_turn')}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm cursor-pointer shadow-lg"
              >
                Я Игрок 2 (Открыть свой стол)
              </button>
            </div>
          )}

          {/* PLAYER 1 ACTIVE TURN */}
          {(gameMode === 'ai' || hotseatPhase === 'p1_turn') && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-cyan-300">
                    Ход Игрока 1: Выберите карту и Квантовые искры
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Осталось карт в руке: {p1AvailableCards.length}. Доступно искр: {p1SparksReserve}.
                  </p>
                </div>
              </div>

              {/* Hand of Cards for Player 1 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Ваша боевая четвёрка:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {p1AvailableCards.map(c => (
                    <CardView
                      key={c.id}
                      card={c}
                      isSelected={p1SelectedCardId === c.id}
                      onClick={() => {
                        setP1SelectedCardId(c.id);
                        sound.playCardSelect();
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Spark Allocation for chosen card */}
              {p1SelectedCard && (
                <div className="space-y-4">
                  <SparkController
                    availableSparks={p1SparksReserve}
                    allocatedSparks={p1AllocatedSparks}
                    onChange={setP1AllocatedSparks}
                  />

                  {/* Confirm Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!p1SelectedCardId}
                      onClick={handleP1Confirm}
                      className="px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                    >
                      <Swords className="w-4 h-4" />
                      <span>{gameMode === 'ai' ? 'Начать Столкновение Раунда' : 'Подтвердить Выбор (Передать ход)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PLAYER 2 ACTIVE TURN (Hotseat Mode Only) */}
          {gameMode === 'pvp_local' && hotseatPhase === 'p2_turn' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-purple-300">
                    Ход Игрока 2: Выберите карту и Квантовые искры
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Осталось карт в руке: {p2AvailableCards.length}. Доступно искр: {p2SparksReserve}.
                  </p>
                </div>
              </div>

              {/* Hand of Cards for Player 2 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Боевая четвёрка Игрока 2:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {p2AvailableCards.map(c => (
                    <CardView
                      key={c.id}
                      card={c}
                      isSelected={p2SelectedCardId === c.id}
                      onClick={() => {
                        setP2SelectedCardId(c.id);
                        sound.playCardSelect();
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Spark Allocation for chosen card */}
              {p2SelectedCard && (
                <div className="space-y-4">
                  <SparkController
                    availableSparks={p2SparksReserve}
                    allocatedSparks={p2AllocatedSparks}
                    onChange={setP2AllocatedSparks}
                  />

                  {/* Confirm Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!p2SelectedCardId}
                      onClick={handleP2Confirm}
                      className="px-7 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                    >
                      <Swords className="w-4 h-4" />
                      <span>Вскрыть Карты и Начать Столкновение</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Match Round History Log (Bottom Table) */}
      {matchHistory.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-2">История раундов матча:</div>
          <div className="space-y-2">
            {matchHistory.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 text-xs font-mono border border-slate-800/60">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold">Раунд {m.roundNumber}:</span>
                  <span className="text-cyan-400">{m.p1Card.name} ({m.p1SparksInvested} искр)</span>
                  <span className="text-slate-600">vs</span>
                  <span className="text-rose-400">{m.p2Card.name} ({m.p2SparksInvested} искр)</span>
                </div>
                <span className={`font-bold ${
                  m.winner === 'player1' ? 'text-emerald-400' : m.winner === 'player2' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {m.winner === 'player1' ? 'Победа P1' : m.winner === 'player2' ? 'Победа P2' : 'Ничья'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
