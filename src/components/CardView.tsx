/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Zap, Sparkles, Star, Link2, Check } from 'lucide-react';
import { Card } from '../types/game';
import { CLANS } from '../data/clans';

interface CardViewProps {
  card: Card;
  isSelected?: boolean;
  isPlayed?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'urban';
  extraPower?: number;
  extraDamage?: number;
  showDetailsModal?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected = false,
  isPlayed = false,
  isDisabled = false,
  onClick,
  size = 'urban',
  extraPower = 0,
  extraDamage = 0,
}) => {
  const clan = CLANS[card.clanId];
  const [imageError, setImageError] = useState(false);

  const totalPower = card.basePower + extraPower;
  const totalDamage = card.baseDamage + extraDamage;

  // Clan theme colors
  const clanBorderColor = clan?.borderColor || 'border-slate-700';

  // Render yellow stars
  const renderStars = () => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Star
            key={i}
            className={`w-2.5 h-2.5 ${
              i < card.stars
                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(245,158,11,0.6)]'
                : 'fill-slate-800 text-slate-800'
            }`}
          />
        ))}
      </div>
    );
  };

  // Urban Rivals Comic Style Card (matches user screenshot)
  if (size === 'urban') {
    return (
      <div
        onClick={!isDisabled && !isPlayed ? onClick : undefined}
        className={`group relative rounded-2xl border-2 transition-all duration-200 overflow-hidden select-none cursor-pointer flex flex-col justify-between ${
          isSelected
            ? 'border-amber-400 ring-3 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-[1.02] z-20'
            : isPlayed
            ? 'opacity-40 grayscale cursor-not-allowed border-slate-800'
            : isDisabled
            ? 'opacity-60 cursor-not-allowed border-slate-800'
            : 'border-slate-700 hover:border-amber-400/60 hover:shadow-xl hover:scale-[1.02]'
        }`}
        style={{
          borderColor: isSelected ? '#f59e0b' : clan?.color || '#475569',
          boxShadow: isSelected ? `0 0 16px ${clan?.color || '#f59e0b'}80` : undefined,
          aspectRatio: '3 / 4.4',
        }}
      >
        {/* Фоновое изображение персонажа каждого клана */}
        <div className="absolute inset-0 bg-slate-950 overflow-hidden">
          {card.imageUrl && !imageError ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
              style={{
                background: `radial-gradient(circle, ${clan?.color}30 0%, #020617 100%)`,
              }}
            >
              <Sparkles className="w-8 h-8 text-slate-500 mb-1" />
              <span className="text-[10px] font-bold text-slate-400">{clan?.name}</span>
            </div>
          )}

          {/* Затемняющий градиент снизу и сверху для читаемости надписей */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-slate-950/90 to-transparent" />
        </div>

        {/* ================= ВЕРХНЯЯ ШАПКА КАРТЫ ================= */}
        <div className="relative z-10 flex items-center justify-between p-1.5 sm:p-2 bg-slate-950/75 backdrop-blur-xs border-b border-white/10">
          {/* Круглый значок клана слева вверху (как в Urban Rivals) */}
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-slate-950 shadow-md shrink-0 border border-white/40"
            style={{ backgroundColor: clan?.color || '#f59e0b' }}
            title={`Клан: ${clan?.name}`}
          >
            {card.clanId === 'titans' && 'T'}
            {card.clanId === 'astral_guardians' && 'A'}
            {card.clanId === 'technocrats' && 'TC'}
            {card.clanId === 'shadow_walkers' && 'S'}
            {card.clanId === 'syndicate_of_chaos' && 'C'}
          </div>

          {/* Имя персонажа в центре */}
          <div className="font-black text-xs sm:text-sm text-white tracking-wide uppercase truncate px-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {card.name}
          </div>

          {/* Бейдж выбранности */}
          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5" />
          )}
        </div>

        {/* ================= ЛЕВАЯ ПЛАШКА СТАТОВ (СИЛА И УРОН) ================= */}
        <div className="relative z-10 flex flex-col items-start gap-1 p-2 self-start mt-auto mb-1">
          {/* Сила (Защита / Щит) */}
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-cyan-400 text-cyan-300 font-mono font-black text-xs shadow-md"
            title="Сила (Защита/HP)"
          >
            <Shield className="w-3 h-3 fill-cyan-400 text-cyan-300" />
            <span className="tabular-nums">{totalPower}</span>
            {extraPower > 0 && <span className="text-[10px] text-cyan-200">+{extraPower}</span>}
          </div>

          {/* Урон (Атака / Огонь) */}
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-rose-500 text-rose-300 font-mono font-black text-xs shadow-md"
            title="Урон (Атака)"
          >
            <Zap className="w-3 h-3 fill-rose-500 text-rose-300" />
            <span className="tabular-nums">{totalDamage}</span>
            {extraDamage > 0 && <span className="text-[10px] text-amber-300">+{extraDamage}</span>}
          </div>
        </div>

        {/* ================= НИЖНИЙ БЛОК: ЗВЕЗДЫ, СПОСОБНОСТЬ, БОНУС КЛАНА ================= */}
        <div className="relative z-10 p-2 bg-slate-950/90 backdrop-blur-xs border-t border-white/10 space-y-1">
          {/* Звезды карты */}
          <div className="flex items-center justify-between">
            {renderStars()}
            <span className="text-[9px] font-mono font-bold text-slate-400">{card.stars}★</span>
          </div>

          {/* Способность карты */}
          <div className="text-[10px] text-slate-200 leading-tight line-clamp-2">
            <span className="font-bold text-amber-300">{card.ability.name}: </span>
            <span>{card.ability.description}</span>
          </div>

          {/* Бонус клана со значком цепочки (как в Urban Rivals) */}
          <div className="flex items-center gap-1 pt-1 border-t border-slate-800/80 text-[9px] font-medium text-slate-400">
            <Link2 className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span className="truncate">{clan?.mathBonusDescription}</span>
          </div>
        </div>
      </div>
    );
  }

  // Compact fallback variant
  return (
    <div
      onClick={!isDisabled && !isPlayed ? onClick : undefined}
      className={`relative flex flex-col justify-between p-2 rounded-xl border transition-all text-left select-none ${
        isPlayed
          ? 'opacity-40 bg-slate-900/40 border-slate-800 cursor-not-allowed'
          : isSelected
          ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400 cursor-pointer'
          : isDisabled
          ? 'opacity-60 bg-slate-950 border-slate-800 cursor-not-allowed'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 truncate">{clan?.name}</div>
          <div className="text-xs font-bold text-white truncate">{card.name}</div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 text-amber-400 font-mono text-xs font-bold">
          {card.stars}★
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 font-mono text-xs">
        <div className="flex items-center gap-1 text-cyan-400 font-semibold">
          <Shield className="w-3 h-3" />
          <span className="tabular-nums">{totalPower}</span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-semibold">
          <Zap className="w-3 h-3" />
          <span className="tabular-nums">{totalDamage}</span>
        </div>
      </div>
    </div>
  );
};
