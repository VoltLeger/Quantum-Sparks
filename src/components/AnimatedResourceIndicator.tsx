/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins, Gem } from 'lucide-react';
import { sound } from '../logic/sound';

interface AnimatedResourceIndicatorProps {
  type: 'sparks' | 'credits' | 'crystals';
  value: number;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export const AnimatedResourceIndicator: React.FC<AnimatedResourceIndicatorProps> = ({
  type,
  value,
  label,
  className = '',
  onClick,
}) => {
  const prevValueRef = useRef<number>(value);
  const [delta, setDelta] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const diff = value - prevValueRef.current;
    if (diff !== 0) {
      setDelta(diff);
      setIsAnimating(true);
      
      // Play sound effect on change
      if (diff > 0) {
        sound.playVictory();
      } else {
        sound.playCardSelect();
      }

      const timer = setTimeout(() => {
        setDelta(null);
        setIsAnimating(false);
      }, 1500);

      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const config = {
    sparks: {
      icon: <Sparkles className="w-3.5 h-3.5 text-cyan-300 fill-cyan-400" />,
      border: 'border-cyan-500/50 hover:border-cyan-400',
      bg: 'bg-cyan-950/40',
      text: 'text-cyan-300',
      glow: 'shadow-[0_0_12px_rgba(34,211,238,0.4)]',
      name: 'Искры',
    },
    credits: {
      icon: <Coins className="w-3.5 h-3.5 text-amber-400" />,
      border: 'border-amber-500/40 hover:border-amber-300',
      bg: 'bg-amber-950/30',
      text: 'text-amber-300',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      name: 'Кредиты',
    },
    crystals: {
      icon: <Gem className="w-3.5 h-3.5 text-purple-400" />,
      border: 'border-purple-500/40 hover:border-purple-300',
      bg: 'bg-purple-950/30',
      text: 'text-purple-300',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
      name: 'Кристаллы',
    },
  }[type];

  const formatDisplay = (val: number) => {
    if (type === 'credits' && val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (type === 'credits' && val >= 1000) {
      return (val / 1000).toFixed(1) + 'k';
    }
    return val.toLocaleString('ru-RU');
  };

  return (
    <div className="relative inline-flex items-center">
      <motion.button
        type="button"
        onClick={onClick}
        animate={isAnimating ? { scale: [1, 1.15, 0.98, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${config.border} ${config.bg} ${
          isAnimating ? config.glow : ''
        } transition-all cursor-pointer font-mono font-bold text-xs select-none ${className}`}
        title={`${config.name}: ${value.toLocaleString('ru-RU')}`}
      >
        <span className={`shrink-0 transition-transform ${isAnimating ? 'rotate-12 scale-110' : ''}`}>
          {config.icon}
        </span>

        <span className={`${config.text} tabular-nums tracking-tight`}>
          {formatDisplay(value)}
        </span>

        {label && (
          <span className="hidden sm:inline text-[10px] text-slate-400 font-sans font-normal ml-0.5">
            {label}
          </span>
        )}
      </motion.button>

      {/* Floating delta animation (+N or -N) */}
      <AnimatePresence>
        {delta !== null && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: delta > 0 ? -22 : 18,
              scale: [0.7, 1.15, 1, 0.85],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 text-[11px] font-black font-mono px-1.5 py-0.5 rounded-full shadow-lg ${
              delta > 0
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50'
                : 'bg-rose-500 text-white shadow-rose-500/50'
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
