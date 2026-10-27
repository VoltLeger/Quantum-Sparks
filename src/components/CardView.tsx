/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Zap, Sparkles, Star, Link2, Check, Flame, Info } from 'lucide-react';
import { Card } from '../types/game';
import { CLANS } from '../data/clans';

interface CardViewProps {
  card: Card;
  isSelected?: boolean;
  isPlayed?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'urban' | 'compact';
  extraPower?: number;
  extraDamage?: number;
  showDetailsModal?: boolean;
  hideDetails?: boolean;
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
  hideDetails = false,
}) => {
  const clan = CLANS[card.clanId];
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [card.id, card.imageUrl]);

  const totalPower = card.basePower + extraPower;
  const totalDamage = card.baseDamage + extraDamage;

  const clanColor = clan?.color || '#f59e0b';

  // Stars rendering
  const renderStars = () => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-2.5 h-2.5 ${
              i < card.stars
                ? 'fill-amber-400 text-amber-300 drop-shadow-[0_0_3px_rgba(251,191,36,0.8)]'
                : 'fill-slate-800 text-slate-800/80'
            }`}
          />
        ))}
      </div>
    );
  };

  // Compact size for lists / deck builder grids
  if (size === 'compact' || size === 'sm') {
    return (
      <div
        onClick={!isDisabled && !isPlayed ? onClick : undefined}
        className={`relative flex flex-col justify-between p-2 rounded-xl border transition-all duration-200 select-none text-left overflow-hidden ${
          isPlayed
            ? 'opacity-40 grayscale bg-slate-950/80 border-slate-800 cursor-not-allowed'
            : isSelected
            ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-400 cursor-pointer scale-[1.02]'
            : isDisabled
            ? 'opacity-60 bg-slate-950 border-slate-800 cursor-not-allowed'
            : 'bg-slate-900/95 border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate block">
              {clan?.name}
            </span>
            <div className="text-xs font-black text-white truncate">{card.name}</div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 text-amber-400 font-mono text-[11px] font-black">
            {card.stars}★
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
          <div className="flex items-center gap-1 text-cyan-400 font-bold" title="Сила (Power)">
            <Shield className="w-3 h-3 fill-cyan-400 text-cyan-300" />
            <span className="tabular-nums">{totalPower}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400 font-bold" title="Урон (Damage)">
            <Flame className="w-3 h-3 fill-rose-500 text-rose-300" />
            <span className="tabular-nums">{totalDamage}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full Urban Rivals / CCG Comic Trading Card Frame
  return (
    <div
      onClick={!isDisabled && !isPlayed ? onClick : undefined}
      className={`group relative rounded-2xl border-2 transition-all duration-200 overflow-hidden select-none cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_24px_rgba(245,158,11,0.5)] scale-[1.03] z-20'
          : isPlayed
          ? 'opacity-35 grayscale cursor-not-allowed border-slate-800'
          : isDisabled
          ? 'opacity-60 cursor-not-allowed border-slate-800'
          : 'border-slate-800 hover:border-amber-400/70 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)] hover:scale-[1.02]'
      }`}
      style={{
        borderColor: isSelected ? '#f59e0b' : `${clanColor}aa`,
        aspectRatio: '3 / 4.5',
      }}
    >
      {/* 1. Holographic / Foil Sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />

      {/* 2. Character Artwork Background */}
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
              background: `radial-gradient(circle at 50% 35%, ${clanColor}40 0%, #030712 90%)`,
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-lg border border-white/20"
              style={{ backgroundColor: `${clanColor}30` }}
            >
              <Sparkles className="w-8 h-8 text-amber-300" />
            </div>
            <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
              {clan?.name}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">{card.name}</span>
          </div>
        )}

        {/* Readability gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none" />
      </div>

      {/* 3. Top Banner: Clan Crest + Name + Selected Badge */}
      <div className="relative z-20 flex items-center justify-between p-2 bg-slate-950/85 backdrop-blur-xs border-b border-white/10">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Clan Badge Circle */}
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-slate-950 shadow-md shrink-0 border border-white/40"
            style={{ backgroundColor: clanColor }}
            title={`Клан: ${clan?.name}`}
          >
            {card.clanId === 'titans' && 'T'}
            {card.clanId === 'astral_guardians' && 'A'}
            {card.clanId === 'technocrats' && 'TC'}
            {card.clanId === 'shadow_walkers' && 'S'}
            {card.clanId === 'syndicate_of_chaos' && 'C'}
          </div>

          <div className="min-w-0">
            <div className="font-black text-xs text-white tracking-wide uppercase truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {card.name}
            </div>
          </div>
        </div>

        {isSelected ? (
          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        ) : (
          <div className="text-[10px] font-mono font-bold text-amber-400/90 shrink-0">
            {card.stars}★
          </div>
        )}
      </div>

      {/* 4. Middle Center: Prominent Power & Damage Stat Badges */}
      <div className="relative z-20 flex items-center justify-between px-2.5 mt-auto mb-1">
        {/* Power (Сила) Badge */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-cyan-400/80 text-cyan-300 font-mono font-black text-sm shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-xs"
          title="СИЛА (Power): умножается на искры для вычисления Атаки (Атака = Сила * (1 + Искры))"
        >
          <Shield className="w-3.5 h-3.5 fill-cyan-400 text-cyan-300 shrink-0" />
          <span className="tabular-nums">{totalPower}</span>
          {extraPower > 0 && <span className="text-[10px] text-cyan-200">+{extraPower}</span>}
        </div>

        {/* Damage (Урон) Badge */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-rose-500/80 text-rose-300 font-mono font-black text-sm shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-xs"
          title="УРОН (Damage): ровно столько HP потеряет противник, если ваша карта выиграет раунд!"
        >
          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-300 shrink-0" />
          <span className="tabular-nums">{totalDamage}</span>
          {extraDamage > 0 && <span className="text-[10px] text-amber-300">+{extraDamage}</span>}
        </div>
      </div>

      {/* 5. Bottom Panel: Stars, Ability, and Clan Synergy Bonus */}
      {!hideDetails && (
        <div className="relative z-20 p-2 bg-slate-950/95 backdrop-blur-md border-t border-white/10 space-y-1">
          {/* Rarity Stars */}
          <div className="flex items-center justify-between">
            {renderStars()}
            <span className="text-[9px] font-mono font-medium text-slate-400">
              {clan?.name}
            </span>
          </div>

          {/* Card Ability */}
          <div className="text-[10px] text-slate-200 leading-tight">
            <span className="font-bold text-amber-300">{card.ability.name}: </span>
            <span className="text-slate-300">{card.ability.description}</span>
          </div>

          {/* Clan Bonus with Chain Link */}
          <div className="flex items-center gap-1 pt-1 border-t border-slate-800/80 text-[9px] font-medium text-slate-400">
            <Link2 className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span className="truncate">{clan?.mathBonusDescription}</span>
          </div>
        </div>
      )}
    </div>
  );
};
