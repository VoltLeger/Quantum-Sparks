/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Swords, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Play, 
  Award, 
  Gift, 
  Coins, 
  Gem, 
  ChevronRight,
  Flame,
  Zap
} from 'lucide-react';
import { Card, Deck } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';
import { CardView } from './CardView';

interface CampaignChapter {
  id: number;
  title: string;
  opponentName: string;
  opponentAvatar: string;
  opponentHp: number;
  opponentSparks: number;
  briefing: string;
  lessonTitle: string;
  lessonRule: string;
  rewardCards: string[];
  rewardCredits: number;
  rewardCrystals: number;
  deck: string[];
}

const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: 1,
    title: 'Глава 1: Уличный Спарринг',
    opponentName: 'Кадет Нео-Квартала',
    opponentAvatar: '/assets/images/avatar_player_hero_1792750526736.jpg',
    opponentHp: 8,
    opponentSparks: 8,
    briefing: 'Добро пожаловать в Нео-Олимп! Перед выходом на Большую Арену проведите спарринг с кадетом. Запомните: АТАКА = СИЛА × (1 + ИСКРЫ).',
    lessonTitle: 'Формула Атаки',
    lessonRule: 'Каждая искра умножает Силу карты. Победитель раунда наносит оппоненту точный Урон своей карты.',
    rewardCards: ['bastion_recruit', 'hammer_crusher'],
    rewardCredits: 250,
    rewardCrystals: 5,
    deck: ['bastion_recruit', 'micro_drone', 'chaos_imp', 'nebula_stalker'],
  },
  {
    id: 2,
    title: 'Глава 2: Патруль Технократов',
    opponentName: 'Инженер Вектор',
    opponentAvatar: '/assets/images/card_plasma_sniper_1793011673233.jpg',
    opponentHp: 10,
    opponentSparks: 10,
    briefing: 'Технократы пытаются захватить квантовые генераторы района. Не тратьте все искры в первом раунде — умейте блефовать!',
    lessonTitle: 'Экономия и Блеф',
    lessonRule: 'Сыграв карту с 0 искр, вы сохраните энергию на сокрушительный удар в следующих раундах.',
    rewardCards: ['flux_artificer', 'chrono_inverter'],
    rewardCredits: 350,
    rewardCrystals: 10,
    deck: ['flux_artificer', 'chrono_inverter', 'wilo_ld', 'cyber_synthesizer'],
  },
  {
    id: 3,
    title: 'Глава 3: Сумрачная Засада',
    opponentName: 'Ассасин Ночи',
    opponentAvatar: '/assets/images/card_neon_rogue_1793011674518.jpg',
    opponentHp: 12,
    opponentSparks: 12,
    briefing: 'Шпионы Синдиката Тени атакуют из квантовой вуали. Изучите способности карт: яды, отмена способностей и клановые синергии.',
    lessonTitle: 'Способности и Бонус Клана',
    lessonRule: 'Если в руке две или более карты одного клана, их мощный клановый бонус активируется автоматически.',
    rewardCards: ['dark_nunavik', 'nightfall_assassin', 'fomalhaut_ld'],
    rewardCredits: 500,
    rewardCrystals: 15,
    deck: ['dark_nunavik', 'nightfall_assassin', 'phantom_wraith', 'void_stalker'],
  },
  {
    id: 4,
    title: 'Глава 4: Босс Сектора 0',
    opponentName: 'Колосс K-9',
    opponentAvatar: '/assets/images/card_cyber_brawler_1793011672137.jpg',
    opponentHp: 14,
    opponentSparks: 12,
    briefing: 'Финальный рубеж перед Большой Лигой! Победите титанического стража, чтобы завершить начальную кампанию и забрать все 10 стартовых карт.',
    lessonTitle: 'Финальное Испытание (K.O.)',
    lessonRule: 'Если здоровье врага опустится до 0, раунд завершится мгновенным нокаутом!',
    rewardCards: ['harmonic_resonator', 'goliath_vanguard', 'omurtag'],
    rewardCredits: 1000,
    rewardCrystals: 30,
    deck: ['harmonic_resonator', 'goliath_vanguard', 'omurtag', 'tervel'],
  },
];

interface StarterCampaignScreenProps {
  unlockedCardIds: string[];
  onClaimCampaignReward: (chapterId: number, cardIds: string[], credits: number, crystals: number) => void;
  onBackToHub: () => void;
  onStartDuel: () => void;
}

export const StarterCampaignScreen: React.FC<StarterCampaignScreenProps> = ({
  unlockedCardIds,
  onClaimCampaignReward,
  onBackToHub,
  onStartDuel,
}) => {
  const [completedChapters, setCompletedChapters] = useState<number[]>([1]);
  const [activeBattleChapter, setActiveBattleChapter] = useState<CampaignChapter | null>(null);

  // Quick unlock all 10 cards if player wishes
  const handleClaimAllTenCards = () => {
    sound.playVictory();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#38bdf8', '#a855f7'],
    });

    const all10 = [
      'bastion_recruit',
      'hammer_crusher',
      'flux_artificer',
      'chrono_inverter',
      'dark_nunavik',
      'nightfall_assassin',
      'fomalhaut_ld',
      'harmonic_resonator',
      'goliath_vanguard',
      'omurtag',
    ];
    onClaimCampaignReward(4, all10, 1500, 50);
    setCompletedChapters([1, 2, 3, 4]);
  };

  const handleCompleteChapter = (chapter: CampaignChapter) => {
    sound.playVictory();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    onClaimCampaignReward(chapter.id, chapter.rewardCards, chapter.rewardCredits, chapter.rewardCrystals);
    setCompletedChapters(prev => Array.from(new Set([...prev, chapter.id, chapter.id + 1])));
    setActiveBattleChapter(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <button
          type="button"
          onClick={onBackToHub}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад в Хаб</span>
        </button>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-amber-400">
            Кампания Новичка • Сектор 0
          </div>
          <div className="text-[10px] text-slate-400">
            Собрано стартовых карт: {Math.min(10, unlockedCardIds.length)} / 10
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
            Вступительная Кампания
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Путь Неофита: Получите первые 10 карт
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Пройдите 4 обучающие дуэли с тактическими подсказками, освойте формулу Атаки и расчет Урона, и соберите свою первую непобедимую боевую колоду!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleClaimAllTenCards}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Gift className="w-4 h-4" />
              <span>Забрать все 10 карт сразу</span>
            </button>
            <button
              type="button"
              onClick={onStartDuel}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Swords className="w-4 h-4 text-cyan-400" />
              <span>Перейти на Боевую Арену</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Главы кампании и награды:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPAIGN_CHAPTERS.map((ch) => {
            const isCompleted = completedChapters.includes(ch.id);
            const isUnlocked = ch.id === 1 || completedChapters.includes(ch.id - 1);
            const cardsInChapter = CARDS.filter(c => ch.rewardCards.includes(c.id));

            return (
              <div
                key={ch.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-sm'
                    : isUnlocked
                    ? 'bg-slate-900 border-amber-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 font-mono">
                      {ch.title}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Пройдено
                      </span>
                    ) : isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                        Доступно
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Lock className="w-3.5 h-3.5" />
                        Закрыто
                      </span>
                    )}
                  </div>

                  {/* Opponent Identity */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <img
                      src={ch.opponentAvatar}
                      alt={ch.opponentName}
                      className="w-10 h-10 rounded-lg object-cover border border-amber-400/50"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">{ch.opponentName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span className="text-rose-400">{ch.opponentHp} HP</span>
                        <span>·</span>
                        <span className="text-cyan-400">{ch.opponentSparks} Искр</span>
                      </div>
                    </div>
                  </div>

                  {/* Briefing prose */}
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {ch.briefing}
                  </p>

                  {/* Lesson Box */}
                  <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-200">
                    <strong className="block text-cyan-300 mb-0.5">{ch.lessonTitle}:</strong>
                    {ch.lessonRule}
                  </div>

                  {/* Reward Cards Previews */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-3 h-3 text-amber-400" />
                      <span>Награда за победу:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 border border-amber-500/30 text-xs font-mono text-amber-300 font-bold">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>+{ch.rewardCredits}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 border border-purple-500/30 text-xs font-mono text-purple-300 font-bold">
                        <Gem className="w-3 h-3 text-purple-400" />
                        <span>+{ch.rewardCrystals}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        + {ch.rewardCards.length} карты
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {cardsInChapter.slice(0, 2).map(c => (
                        <div key={c.id} className="pointer-events-none">
                          <CardView card={c} size="compact" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-4 mt-2 border-t border-slate-800">
                  {isUnlocked && (
                    <button
                      type="button"
                      onClick={() => handleCompleteChapter(ch)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCompleted ? 'Пройти снова (Тренировка)' : 'Сразиться и получить карты'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
