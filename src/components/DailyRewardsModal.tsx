/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Coins, Gem, Sparkles, Trophy, Check, Gift, Star } from 'lucide-react';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimedDays: number[];
  currentDay: number;
  onClaimDay: (day: number, reward: { credits: number; crystals: number; cardId?: string }) => void;
}

export const DAILY_REWARDS = [
  { day: 1, credits: 2500, crystals: 0, title: '2 500 Кредитов', icon: 'coins' },
  { day: 2, credits: 0, crystals: 15, title: '15 Кристаллов', icon: 'gem' },
  { day: 3, credits: 5000, crystals: 0, title: '5 000 Кредитов', icon: 'coins' },
  { day: 4, credits: 3000, crystals: 25, title: '25 Кристаллов + Искры', icon: 'sparkles' },
  { day: 5, credits: 10000, crystals: 0, title: '10 000 Кредитов', icon: 'coins' },
  { day: 6, credits: 0, crystals: 50, title: '50 Кристаллов', icon: 'gem' },
  { day: 7, credits: 15000, crystals: 100, cardId: 'harmonic_resonator', title: '6★ Легендарная Карта!', icon: 'trophy' },
];

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  onClose,
  claimedDays,
  currentDay,
  onClaimDay,
}) => {
  if (!isOpen) return null;

  const handleClaim = (dayData: typeof DAILY_REWARDS[0]) => {
    sound.playVictory();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    onClaimDay(dayData.day, {
      credits: dayData.credits,
      crystals: dayData.crystals,
      cardId: dayData.cardId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-[0_0_50px_rgba(245,158,11,0.35)] relative overflow-hidden">
        {/* Фоновое свечение */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Шапка */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Gift className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white uppercase tracking-wider">Ежедневный Вход</h3>
              <p className="text-xs text-amber-400 font-mono">Календарь 7-дневных боевых поставок Олимпа</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Сетка дней 1-7 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5">
          {DAILY_REWARDS.map((item) => {
            const isClaimed = claimedDays.includes(item.day);
            const isToday = item.day === currentDay && !isClaimed;
            const isLocked = item.day > currentDay;

            return (
              <div
                key={item.day}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between relative ${
                  item.day === 7 ? 'col-span-2 sm:col-span-2 bg-gradient-to-r from-amber-950/60 to-purple-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-lg' :
                  isToday ? 'bg-slate-850 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                  isClaimed ? 'bg-slate-950/80 border-slate-800 opacity-60' :
                  'bg-slate-950/50 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    День {item.day}
                  </span>
                  {isClaimed && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 font-mono">
                      <Check className="w-3 h-3 stroke-[3]" /> Получено
                    </span>
                  )}
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                      Доступно
                    </span>
                  )}
                </div>

                {/* Иконка награды */}
                <div className="my-2 flex items-center justify-center">
                  {item.icon === 'coins' && <Coins className="w-8 h-8 text-amber-400" />}
                  {item.icon === 'gem' && <Gem className="w-8 h-8 text-purple-400" />}
                  {item.icon === 'sparkles' && <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />}
                  {item.icon === 'trophy' && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-8 h-8 text-amber-400 fill-amber-400" />
                      <div className="text-left">
                        <div className="text-[10px] font-black text-amber-300">КВАНТОВЫЙ РЕЗОНАНС</div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 6 }).map((_, s) => (
                            <Star key={s} className="w-2.5 h-2.5 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xs font-black text-white">{item.title}</div>
                </div>

                {/* Кнопка забрать если доступно */}
                {isToday && (
                  <button
                    type="button"
                    onClick={() => handleClaim(item)}
                    className="mt-2 w-full py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] uppercase tracking-wider cursor-pointer shadow-md transition-transform hover:scale-105"
                  >
                    Забрать
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Нижний статус */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Заходите каждый день подряд, чтобы разблокировать 6★ карту на 7-й день!</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer text-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
