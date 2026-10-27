/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Sparkles, Coins, Gem, Star, Trophy, Check, ArrowRight, Zap, Target, Lock } from 'lucide-react';
import { ClanId, Card } from '../types/game';
import { CLANS } from '../data/clans';
import { CARDS } from '../data/cards';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';

export interface ClanMission {
  id: string;
  clanId: ClanId;
  title: string;
  description: string;
  targetCondition: string;
  currentProgress: number;
  maxProgress: number;
  rewardCredits: number;
  rewardCrystals: number;
  rewardCardId?: string;
  status: 'locked' | 'in_progress' | 'completed' | 'claimed';
}

interface ClanMissionsScreenProps {
  completedMissionIds: string[];
  onClaimMission: (missionId: string, credits: number, crystals: number, cardId?: string) => void;
  onGoToBattle?: () => void;
  onBackToHub?: () => void;
}

export const INITIAL_CLAN_MISSIONS: ClanMission[] = [
  // 1. ТИТАНЫ
  {
    id: 'titan_m1',
    clanId: 'titans',
    title: 'Несокрушимый Монолит',
    description: 'Победите в любом раунде, имея итоговую Силу карты не менее 14 единиц.',
    targetCondition: 'Сила в бою ≥ 14',
    currentProgress: 1,
    maxProgress: 1,
    rewardCredits: 3500,
    rewardCrystals: 15,
    status: 'completed', // готово к забору награды для демонстрации
  },
  {
    id: 'titan_m2',
    clanId: 'titans',
    title: 'Тектонический Разлом',
    description: 'Нанесите суммарно 25 урона по оппонентам картами клана Титанов.',
    targetCondition: '25 урона Титанами',
    currentProgress: 18,
    maxProgress: 25,
    rewardCredits: 7000,
    rewardCrystals: 25,
    rewardCardId: 'hammer_crusher',
    status: 'in_progress',
  },

  // 2. АСТРАЛЬНЫЕ СТРАЖИ
  {
    id: 'astral_m1',
    clanId: 'astral_guardians',
    title: 'Фазовый Пробой Реальности',
    description: 'Потратьте ровно 4 или более Квантовых Искр на карту Фазового Рассекателя.',
    targetCondition: 'Вложить ≥ 4 искр в Астрал',
    currentProgress: 1,
    maxProgress: 1,
    rewardCredits: 4000,
    rewardCrystals: 20,
    status: 'completed',
  },
  {
    id: 'astral_m2',
    clanId: 'astral_guardians',
    title: 'Астральное Искажение',
    description: 'Снизьте Силу карты противника до минимального значения бонусом клана.',
    targetCondition: 'Дебафф силы 3 раза',
    currentProgress: 2,
    maxProgress: 3,
    rewardCredits: 8500,
    rewardCrystals: 30,
    rewardCardId: 'astral_seer',
    status: 'in_progress',
  },

  // 3. ТЕХНОКРАТЫ
  {
    id: 'techno_m1',
    clanId: 'technocrats',
    title: 'Рекуперация Реактора',
    description: 'Выиграйте раунд, потратив 0 искр, благодаря точному расчету характеристик.',
    targetCondition: 'Победа без затрат искр',
    currentProgress: 0,
    maxProgress: 1,
    rewardCredits: 5000,
    rewardCrystals: 20,
    status: 'in_progress',
  },
  {
    id: 'techno_m2',
    clanId: 'technocrats',
    title: 'Квантовый Синтезатор',
    description: 'Сформируйте боевой состав с 2+ картами Технократов для стартового буста искр.',
    targetCondition: 'Старт боя с 16+ искрами',
    currentProgress: 1,
    maxProgress: 1,
    rewardCredits: 9000,
    rewardCrystals: 35,
    rewardCardId: 'cyber_synthesizer',
    status: 'completed',
  },

  // 4. ТЕНЕВЫЕ СТРАННИКИ
  {
    id: 'shadow_m1',
    clanId: 'shadow_walkers',
    title: 'Смертоносный Сумрак',
    description: 'Срежьте урон карты оппонента бонусом Теневых Странников (-10 к Атаке).',
    targetCondition: 'Срезать 10+ урона врага',
    currentProgress: 1,
    maxProgress: 1,
    rewardCredits: 4500,
    rewardCrystals: 15,
    status: 'completed',
  },
  {
    id: 'shadow_m2',
    clanId: 'shadow_walkers',
    title: 'Удар из Засады',
    description: 'Нанесите смертельный урон оппоненту картой Ассасина Сумрака в 4 раунде.',
    targetCondition: 'Финиш картой 5★',
    currentProgress: 0,
    maxProgress: 1,
    rewardCredits: 10000,
    rewardCrystals: 40,
    rewardCardId: 'nightfall_assassin',
    status: 'in_progress',
  },

  // 5. СИНДИКАТ ХАОСА
  {
    id: 'chaos_m1',
    clanId: 'syndicate_of_chaos',
    title: 'Дикий Выброс Энтропии',
    description: 'Нанесите критический урон картой Хаоса, вложив нечетное количество искр.',
    targetCondition: 'Атака с 3 или 5 искрами',
    currentProgress: 1,
    maxProgress: 1,
    rewardCredits: 5500,
    rewardCrystals: 25,
    status: 'completed',
  },
  {
    id: 'chaos_m2',
    clanId: 'syndicate_of_chaos',
    title: 'Апогей Разрушения',
    description: 'Нанесите 14 или более урона за один раунд картой Дредноута Энтропии.',
    targetCondition: '14+ урона за один удар',
    currentProgress: 0,
    maxProgress: 1,
    rewardCredits: 15000,
    rewardCrystals: 50,
    rewardCardId: 'entropy_madman',
    status: 'in_progress',
  },
];

export const ClanMissionsScreen: React.FC<ClanMissionsScreenProps> = ({
  completedMissionIds,
  onClaimMission,
  onGoToBattle,
  onBackToHub,
}) => {
  const [selectedClan, setSelectedClan] = useState<ClanId | 'all'>('all');

  const filteredMissions = INITIAL_CLAN_MISSIONS.filter(m => {
    if (selectedClan !== 'all' && m.clanId !== selectedClan) return false;
    return true;
  });

  const handleClaim = (mission: ClanMission) => {
    sound.playVictory();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
    onClaimMission(mission.id, mission.rewardCredits, mission.rewardCrystals, mission.rewardCardId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 font-sans select-none space-y-4">
      {/* Кнопка возврата в Хаб */}
      {onBackToHub && (
        <div className="pb-3 border-b border-slate-800">
          <button
            type="button"
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <span>⬅ Назад в Хаб</span>
          </button>
        </div>
      )}

      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold uppercase">
              Штаб Контрактов
            </span>
            <span className="text-xs text-slate-400 font-mono">Сезон 1 • Олимп</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
            Миссии Кланов и Награды
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-0.5">
            Выполняйте тактические испытания каждого из 5 кланов, зарабатывайте кредиты, квантовые кристаллы и эксклюзивные карты для вашей боевой четверки!
          </p>
        </div>

        {onGoToBattle && (
          <button
            type="button"
            onClick={onGoToBattle}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto transition-transform hover:scale-105 shrink-0"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>В Бой за Миссиями</span>
          </button>
        )}
      </div>

      {/* Фильтр по кланам */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedClan('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase cursor-pointer whitespace-nowrap transition-colors ${
            selectedClan === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Все Кланы ({INITIAL_CLAN_MISSIONS.length})
        </button>

        {Object.values(CLANS).map(clan => (
          <button
            key={clan.id}
            type="button"
            onClick={() => setSelectedClan(clan.id)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              selectedClan === clan.id
                ? 'bg-slate-800 text-white border-2 border-amber-400 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clan.color }} />
            <span>{clan.name}</span>
          </button>
        ))}
      </div>

      {/* Список миссий */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.map((mission) => {
          const clan = CLANS[mission.clanId];
          const isClaimed = completedMissionIds.includes(mission.id);
          const isReadyToClaim = !isClaimed && (mission.status === 'completed' || mission.currentProgress >= mission.maxProgress);
          const progressPercent = Math.min(100, Math.round((mission.currentProgress / mission.maxProgress) * 100));
          const rewardCard = mission.rewardCardId ? CARDS.find(c => c.id === mission.rewardCardId) : null;

          return (
            <div
              key={mission.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isClaimed
                  ? 'bg-slate-950/60 border-slate-800/80 opacity-60'
                  : isReadyToClaim
                  ? 'bg-slate-900/90 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Шапка карточки миссии */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-slate-950"
                      style={{ backgroundColor: clan?.color || '#f59e0b' }}
                    >
                      {clan?.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Условие: {mission.targetCondition}
                    </span>
                  </div>

                  {isClaimed && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Выполнено
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-white">{mission.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mission.description}</p>
              </div>

              {/* Прогресс-бар */}
              <div className="my-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Прогресс</span>
                  <span className="font-bold text-white">
                    {mission.currentProgress} / {mission.maxProgress} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: isReadyToClaim ? '#f59e0b' : clan?.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>

              {/* Награды и действие */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Кредиты */}
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{mission.rewardCredits.toLocaleString('ru-RU')}</span>
                  </div>

                  {/* Кристаллы */}
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-purple-300">
                    <Gem className="w-3.5 h-3.5 text-purple-400" />
                    <span>+{mission.rewardCrystals}</span>
                  </div>

                  {/* Наградная карта */}
                  {rewardCard && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{rewardCard.name} ({rewardCard.stars}★)</span>
                    </div>
                  )}
                </div>

                {/* Кнопка действия */}
                {isReadyToClaim ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(mission)}
                    className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-transform hover:scale-105"
                  >
                    Забрать ✦
                  </button>
                ) : isClaimed ? (
                  <button
                    disabled
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-500 font-bold text-xs uppercase cursor-not-allowed"
                  >
                    Получено
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onGoToBattle}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Выполнять &rsaquo;
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
