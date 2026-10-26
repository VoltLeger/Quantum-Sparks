/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClanId } from '../types/game';
import { CLANS } from '../data/clans';
import { CARDS } from '../data/cards';
import { Shield, Sparkles, Cpu, EyeOff, Flame, Check, ArrowRight } from 'lucide-react';
import { sound } from '../logic/sound';

interface StarterClanModalProps {
  isOpen: boolean;
  onSelectClan: (clanId: ClanId) => void;
  currentStarterClan?: ClanId | null;
  onClose?: () => void;
}

export const StarterClanModal: React.FC<StarterClanModalProps> = ({
  isOpen,
  onSelectClan,
  currentStarterClan,
  onClose,
}) => {
  const [selectedClan, setSelectedClan] = useState<ClanId>(currentStarterClan || 'titans');

  if (!isOpen) return null;

  const getClanIcon = (id: ClanId) => {
    switch (id) {
      case 'titans': return <Shield className="w-6 h-6 text-amber-400" />;
      case 'astral_guardians': return <Sparkles className="w-6 h-6 text-cyan-400" />;
      case 'technocrats': return <Cpu className="w-6 h-6 text-sky-400" />;
      case 'shadow_walkers': return <EyeOff className="w-6 h-6 text-emerald-400" />;
      case 'syndicate_of_chaos': return <Flame className="w-6 h-6 text-red-400" />;
    }
  };

  const clanCards = CARDS.filter(c => c.clanId === selectedClan);
  const activeClanData = CLANS[selectedClan];

  const handleConfirm = () => {
    sound.playVictory();
    onSelectClan(selectedClan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col">
        {/* Заголовок */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            Клан Новичка
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Выберите Ваш Стартовый Клан
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl mx-auto">
            Вы начинаете игру <strong className="text-amber-400">только с картами одного клана</strong>. Все остальные карты других фракций открываются за прохождение клановых миссий, покупку бустеров и торговлю на рынке!
          </p>
        </div>

        {/* Выбор клана (Кнопки) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
          {(Object.keys(CLANS) as ClanId[]).map((clanKey) => {
            const clan = CLANS[clanKey];
            const isSelected = selectedClan === clanKey;
            return (
              <button
                key={clanKey}
                onClick={() => {
                  sound.playSparkInject();
                  setSelectedClan(clanKey);
                }}
                className={`relative p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20 scale-102 ring-2 ring-amber-400/40'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="mb-2 p-2 rounded-lg bg-slate-900 border border-slate-700">
                  {getClanIcon(clanKey)}
                </div>
                <div className="text-xs font-bold text-white tracking-tight line-clamp-1">
                  {clan.name}
                </div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                  {clanKey === 'titans' && '+2 Сила / +2 Урон'}
                  {clanKey === 'astral_guardians' && '-2 Сила / Вампиризм'}
                  {clanKey === 'technocrats' && '+2 Искры / Карта'}
                  {clanKey === 'shadow_walkers' && '-10 Урон Врага'}
                  {clanKey === 'syndicate_of_chaos' && '+1 Урон / ★'}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Детальный обзор выбранного клана */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
                {getClanIcon(selectedClan)}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{activeClanData.name}</h3>
                <p className="text-xs text-slate-400">{activeClanData.description}</p>
              </div>
            </div>
            <div className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              Бонус: <span className="font-bold text-white">{activeClanData.mathBonusDescription}</span>
            </div>
          </div>

          {/* Список стартовых карт */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Стартовый арсенал карт ({clanCards.length} карт в колоду):</span>
              <span className="text-emerald-400 font-mono text-[11px]">+5,000 Кредитов & +50 Кристаллов</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {clanCards.slice(0, 4).map((card) => (
                <div
                  key={card.id}
                  className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 flex flex-col justify-between hover:border-amber-400/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white truncate">{card.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono">{'★'.repeat(card.stars)}</span>
                  </div>
                  <div className="relative h-20 rounded bg-slate-950 overflow-hidden mb-2 border border-slate-800">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300">
                      Сила {card.basePower}
                    </div>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-rose-400">
                      Урон {card.baseDamage}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {card.ability.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Нижние действия */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          {onClose && (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Отмена
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>Подтвердить Клан {activeClanData.name}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
