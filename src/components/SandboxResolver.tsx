/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Sparkles, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { CARDS } from '../data/cards';
import { Card, RoundResolutionResult } from '../types/game';
import { resolve_round } from '../logic/resolver';
import { CardView } from './CardView';
import { SparkController } from './SparkController';
import { CombatPipelineView } from './CombatPipelineView';
import { sound } from '../logic/sound';

export const SandboxResolver: React.FC = () => {
  const [p1CardId, setP1CardId] = useState<string>('chrono_inverter');
  const [p2CardId, setP2CardId] = useState<string>('phase_cleaver');

  const [p1Sparks, setP1Sparks] = useState<number>(2);
  const [p2Sparks, setP2Sparks] = useState<number>(4);

  const [resolutionResult, setResolutionResult] = useState<RoundResolutionResult | null>(() => {
    const c1 = CARDS.find(c => c.id === 'chrono_inverter') || CARDS[0];
    const c2 = CARDS.find(c => c.id === 'phase_cleaver') || CARDS[1];
    return resolve_round(c1, 2, c2, 4, 1);
  });

  const p1Card = CARDS.find(c => c.id === p1CardId) || CARDS[0];
  const p2Card = CARDS.find(c => c.id === p2CardId) || CARDS[1];

  const handleResolve = () => {
    sound.playClash();
    const result = resolve_round(p1Card, p1Sparks, p2Card, p2Sparks, 1);
    setResolutionResult(result);
  };

  const handlePreset = (c1Id: string, s1: number, c2Id: string, s2: number) => {
    setP1CardId(c1Id);
    setP1Sparks(s1);
    setP2CardId(c2Id);
    setP2Sparks(s2);
    const c1 = CARDS.find(c => c.id === c1Id) || CARDS[0];
    const c2 = CARDS.find(c => c.id === c2Id) || CARDS[1];
    const res = resolve_round(c1, s1, c2, s2, 1);
    sound.playCardSelect();
    setResolutionResult(res);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Combat Resolver Lab & Mathematical Sandbox</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Интерактивная Лаборатория Тестирования Боевой Системы
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl mt-2 leading-relaxed">
          Тестируйте любые комбинации карт, клановых бонусов, инвестиций Квантовых искр и наблюдайте пошаговую математику разрешения через функцию <code className="text-emerald-400 font-mono">resolve_round()</code>.
        </p>
      </div>

      {/* Preset Test Scenarios */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="text-xs font-semibold text-slate-300 mb-2">
          Готовые тестовые сценарии ключевых механик:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePreset('phase_cleaver', 4, 'harmonic_resonator', 2)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-cyan-500/40 cursor-pointer transition-colors"
          >
            Тест 1: Фазовый Пробой (4 искры) против Резонанса
          </button>
          <button
            type="button"
            onClick={() => handlePreset('chrono_inverter', 2, 'goliath_vanguard', 0)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-blue-500/40 cursor-pointer transition-colors"
          >
            Тест 2: Квантовая Транспозиция (обмен 14 Силы в Урон)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('harmonic_resonator', 4, 'chaos_dreadnought', 2)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-amber-500/40 cursor-pointer transition-colors"
          >
            Тест 3: Гармонический Овердрайв (урон x2.5) против Хаоса
          </button>
          <button
            type="button"
            onClick={() => handlePreset('nightfall_assassin', 3, 'goliath_vanguard', 2)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-purple-500/40 cursor-pointer transition-colors"
          >
            Тест 4: Теневики (-10 к Атаке врага min 4)
          </button>
        </div>
      </div>

      {/* Duelist Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player 1 Config */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-cyan-400">Дуэлянт 1 (Игрок 1)</h2>
            <span className="text-xs font-mono text-slate-400">Выбор карты</span>
          </div>

          <label className="block text-xs font-medium text-slate-400">
            Карта Игрока 1:
            <select
              value={p1CardId}
              onChange={e => setP1CardId(e.target.value)}
              className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {CARDS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.stars}★) · [Сила: {c.basePower}, Урон: {c.baseDamage}]
                </option>
              ))}
            </select>
          </label>

          <CardView card={p1Card} size="sm" extraPower={p1Sparks} extraDamage={p1Sparks * 2} />

          <SparkController
            availableSparks={16}
            allocatedSparks={p1Sparks}
            onChange={setP1Sparks}
          />
        </div>

        {/* Player 2 Config */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-rose-400">Дуэлянт 2 (Игрок 2 / Бот)</h2>
            <span className="text-xs font-mono text-slate-400">Выбор карты</span>
          </div>

          <label className="block text-xs font-medium text-slate-400">
            Карта Игрока 2:
            <select
              value={p2CardId}
              onChange={e => setP2CardId(e.target.value)}
              className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              {CARDS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.stars}★) · [Сила: {c.basePower}, Урон: {c.baseDamage}]
                </option>
              ))}
            </select>
          </label>

          <CardView card={p2Card} size="sm" extraPower={p2Sparks} extraDamage={p2Sparks * 2} />

          <SparkController
            availableSparks={16}
            allocatedSparks={p2Sparks}
            onChange={setP2Sparks}
          />
        </div>
      </div>

      {/* Run Resolve Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleResolve}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.03]"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Выполнить resolve_round() и рассчитать столкновение</span>
        </button>
      </div>

      {/* Resolution Pipeline View */}
      {resolutionResult && (
        <CombatPipelineView
          result={resolutionResult}
          p1Label="Дуэлянт 1"
          p2Label="Дуэлянт 2"
        />
      )}
    </div>
  );
};
