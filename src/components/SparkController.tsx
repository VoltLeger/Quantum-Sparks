/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Plus, Minus, RotateCcw, Zap } from 'lucide-react';
import { sound } from '../logic/sound';

interface SparkControllerProps {
  availableSparks: number; // Total sparks left in reserve
  allocatedSparks: number; // Sparks allocated for this round
  onChange: (sparks: number) => void;
  disabled?: boolean;
}

export const SparkController: React.FC<SparkControllerProps> = ({
  availableSparks,
  allocatedSparks,
  onChange,
  disabled = false,
}) => {
  const maxSparksAllowed = availableSparks;

  const handleSet = (val: number) => {
    if (disabled) return;
    const clamped = Math.max(0, Math.min(maxSparksAllowed, val));
    if (clamped !== allocatedSparks) {
      sound.playSparkTick();
      onChange(clamped);
    }
  };

  const handleIncrement = (amount: number) => {
    handleSet(allocatedSparks + amount);
  };

  const handleReset = () => {
    handleSet(0);
  };

  const handleMax = () => {
    handleSet(maxSparksAllowed);
  };

  const powerBonus = allocatedSparks * 1;
  const damageBonus = allocatedSparks * 2;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Инъекция Квантовых Искр
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            1 искра = <span className="text-cyan-300 font-mono font-medium">+1 к Силе</span> и{' '}
            <span className="text-amber-300 font-mono font-medium">+2 к Урону</span>
          </p>
        </div>

        {/* Reserve indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Остаток в пуле:</span>
          <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
            {availableSparks - allocatedSparks}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">/ {availableSparks}</span>
        </div>
      </div>

      {/* Interactive Spark Allocation Bar */}
      <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
        {/* Main Counter & Quick Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
          <button
            type="button"
            disabled={disabled || allocatedSparks <= 0}
            onClick={() => handleIncrement(-1)}
            aria-label="Уменьшить на 1 искру"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="min-w-20 px-3 py-2 text-center rounded-lg bg-slate-950 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span className="font-mono text-2xl font-black text-amber-400 tabular-nums">
              {allocatedSparks}
            </span>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
              Искр
            </div>
          </div>

          <button
            type="button"
            disabled={disabled || allocatedSparks >= maxSparksAllowed}
            onClick={() => handleIncrement(1)}
            aria-label="Увеличить на 1 искру"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-center">
          <button
            type="button"
            disabled={disabled || allocatedSparks === 0}
            onClick={handleReset}
            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> 0
          </button>
          <button
            type="button"
            disabled={disabled || allocatedSparks + 2 > maxSparksAllowed}
            onClick={() => handleIncrement(2)}
            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 disabled:opacity-40 transition-colors cursor-pointer"
          >
            +2
          </button>
          <button
            type="button"
            disabled={disabled || allocatedSparks + 4 > maxSparksAllowed}
            onClick={() => handleIncrement(4)}
            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 disabled:opacity-40 transition-colors cursor-pointer"
          >
            +4
          </button>
          <button
            type="button"
            disabled={disabled || allocatedSparks >= maxSparksAllowed || maxSparksAllowed === 0}
            onClick={handleMax}
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 disabled:opacity-40 transition-colors cursor-pointer"
          >
            ALL-IN ({maxSparksAllowed})
          </button>
        </div>

        {/* Dynamic Calculation Gain Summary */}
        <div className="md:ml-auto flex items-center gap-3 text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 font-sans text-[11px]">Прирост:</span>
          <span className="text-cyan-400 font-semibold tabular-nums">+{powerBonus} Силы</span>
          <span className="text-slate-600">/</span>
          <span className="text-amber-400 font-semibold tabular-nums">+{damageBonus} Урона</span>
        </div>
      </div>
    </div>
  );
};
