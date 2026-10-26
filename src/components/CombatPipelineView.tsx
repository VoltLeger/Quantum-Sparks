/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Zap, ChevronRight, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { RoundResolutionResult } from '../types/game';

interface CombatPipelineViewProps {
  result: RoundResolutionResult;
  p1Label?: string;
  p2Label?: string;
  onNextRound?: () => void;
  isMatchOver?: boolean;
}

export const CombatPipelineView: React.FC<CombatPipelineViewProps> = ({
  result,
  p1Label = 'Игрок 1',
  p2Label = 'Игрок 2 / ИИ',
  onNextRound,
  isMatchOver = false,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(4); // Default to final outcome, but can inspect any step

  const activeStep = result.steps[activeStepIndex] || result.steps[result.steps.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Header with Winner Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Итоги Раунда {result.roundNumber} из 4
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
            {result.summary}
          </h3>
        </div>

        {/* Round Winner Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wide ${
              result.winner === 'player1'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : result.winner === 'player2'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {result.winner === 'player1'
              ? `Победа: ${p1Label}`
              : result.winner === 'player2'
              ? `Победа: ${p2Label}`
              : 'Ничья в раунде'}
          </div>
        </div>
      </div>

      {/* 5-Phase Step Selector / Timeline */}
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2">
          Порядок разрешения боевой системы (5 фаз):
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {result.steps.map((step, idx) => {
            const isSelected = idx === activeStepIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    Фаза {step.phase}
                  </span>
                  {idx === 4 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="text-[11px] font-medium text-slate-300 truncate mt-1">
                  {step.phase === 1 && 'Вскрытие'}
                  {step.phase === 2 && 'Кланы (Бонусы)'}
                  {step.phase === 3 && 'Искры (Статы)'}
                  {step.phase === 4 && 'Умения'}
                  {step.phase === 5 && 'Урон & Итог'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Phase Deep Dive Detail Box */}
      <div className="bg-slate-950/90 rounded-xl p-4 sm:p-5 border border-slate-800/90">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
              Фаза {activeStep.phase}
            </span>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {activeStep.title}
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {activeStepIndex + 1} из 5
          </span>
        </div>

        {/* Duelists States Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Player 1 Card State */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
              <span className="font-semibold text-cyan-300">{p1Label}</span>
              <span className="text-slate-400 font-mono">{result.p1Card.name}</span>
            </div>
            <p className="text-xs text-slate-300 my-2.5 min-h-[36px] leading-relaxed">
              {activeStep.p1Effect}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono text-xs">
              <span className="text-slate-400 text-[11px]">Статы в фазе:</span>
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 font-bold tabular-nums">
                  {activeStep.p1State.power} Сила
                </span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {activeStep.p1State.damage} Урон
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 Card State */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
              <span className="font-semibold text-rose-300">{p2Label}</span>
              <span className="text-slate-400 font-mono">{result.p2Card.name}</span>
            </div>
            <p className="text-xs text-slate-300 my-2.5 min-h-[36px] leading-relaxed">
              {activeStep.p2Effect}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono text-xs">
              <span className="text-slate-400 text-[11px]">Статы в фазе:</span>
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 font-bold tabular-nums">
                  {activeStep.p2State.power} Сила
                </span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {activeStep.p2State.damage} Урон
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action / Next Round button */}
      {onNextRound && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onNextRound}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <span>{isMatchOver ? 'Смотреть финальный итог матча' : `Перейти к раунду ${result.roundNumber + 1}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
