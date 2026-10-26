/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Check, ArrowRight, Shield, Zap, Sparkles, Flame, RefreshCw } from 'lucide-react';
import { CardView } from './CardView';
import { SparkController } from './SparkController';
import { CARDS } from '../data/cards';
import { resolve_round } from '../logic/resolver';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';

export const InteractiveTutorial: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [allocatedSparks, setAllocatedSparks] = useState<number>(0);
  const [battleResolved, setBattleResolved] = useState<boolean>(false);
  const [lastLog, setLastLog] = useState<string>('');
  const [stepSuccess, setStepSuccess] = useState<boolean>(false);

  // Specific tutorial scenarios
  // Step 1: Learn base stats. Player picks Bastion Recruit (2★) vs Enemy Scout.
  const step1Cards = CARDS.filter(c => c.id === 'bastion_recruit' || c.id === 'micro_drone');
  const step1Enemy = CARDS.find(c => c.id === 'nebula_stalker')!;

  // Step 2: Learn Quantum Sparks (+1 Power, +2 Damage). Goal: Allocate 3 sparks to Goliath or Tectonic Hammer.
  const step2Cards = CARDS.filter(c => c.id === 'hammer_crusher' || c.id === 'goliath_vanguard');
  const step2Enemy = CARDS.find(c => c.id === 'void_siphon')!; // Power 11, Dmg 8

  // Step 3: Trigger signature ability. Phase Cleaver with >= 4 sparks.
  const step3Cards = CARDS.filter(c => c.id === 'phase_cleaver' || c.id === 'chrono_inverter');
  const step3Enemy = CARDS.find(c => c.id === 'goliath_vanguard')!; // Heavy 17 Power

  const resetCurrentStepPractice = () => {
    setSelectedCardId('');
    setAllocatedSparks(0);
    setBattleResolved(false);
    setLastLog('');
    setStepSuccess(false);
  };

  const handleExecuteTutorialStep = () => {
    let playerCard = CARDS.find(c => c.id === selectedCardId);
    let enemyCard = step1Enemy;
    let requiredSparks = 0;

    if (currentStep === 1) {
      if (!playerCard) return;
      enemyCard = step1Enemy;
      const res = resolve_round(playerCard, 0, enemyCard, 0, 1);
      sound.playClash();
      setBattleResolved(true);
      setLastLog(res.summary);
      if (res.winner === 'player1') {
        setStepSuccess(true);
        sound.playVictory();
        confetti({ particleCount: 40, spread: 60 });
      }
    } else if (currentStep === 2) {
      if (!playerCard) return;
      enemyCard = step2Enemy;
      const res = resolve_round(playerCard, allocatedSparks, enemyCard, 1, 2);
      sound.playClash();
      setBattleResolved(true);
      setLastLog(res.summary);
      if (allocatedSparks >= 2 && res.winner === 'player1') {
        setStepSuccess(true);
        sound.playVictory();
        confetti({ particleCount: 50, spread: 70 });
      }
    } else if (currentStep === 3) {
      if (!playerCard) return;
      enemyCard = step3Enemy;
      const res = resolve_round(playerCard, allocatedSparks, enemyCard, 2, 3);
      sound.playClash();
      setBattleResolved(true);
      setLastLog(res.summary);
      if (playerCard.id === 'phase_cleaver' && allocatedSparks >= 4 && res.winner === 'player1') {
        setStepSuccess(true);
        sound.playVictory();
        confetti({ particleCount: 70, spread: 80 });
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
      resetCurrentStepPractice();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Tutorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
          <BookOpen className="w-4 h-4" />
          <span>Академия Квантовых Дуэлянтов</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Интерактивный Обучающий Туториал (3 Базовых Шага)
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl mt-2 leading-relaxed">
          Освойте фундамент мобильной тактической CCG: 4-раундовую дуэль, механику Квантовых искр, клановые бонусы и математические триггеры способностей.
        </p>
      </div>

      {/* 3 Step Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => { setCurrentStep(1); resetCurrentStepPractice(); }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            currentStep === 1
              ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/60'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-cyan-400">Шаг 01</span>
            {currentStep > 1 && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
          <h2 className="text-sm font-bold text-white mt-1">Основы Боя и Статы</h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Сила (HP/Защита) против Урона (Атака). Разрешение прямого столкновения.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentStep(2); resetCurrentStepPractice(); }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            currentStep === 2
              ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/60'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-amber-400">Шаг 02</span>
            {currentStep > 2 && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
          <h2 className="text-sm font-bold text-white mt-1">Квантовые Искры (+1 / +2)</h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Стартовый пул 12 искр. Каждая искра дает +1 к Силе и +2 к Урону.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentStep(3); resetCurrentStepPractice(); }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            currentStep === 3
              ? 'bg-slate-900 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-400/60'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-purple-400">Шаг 03</span>
            {stepSuccess && currentStep === 3 && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
          <h2 className="text-sm font-bold text-white mt-1">Кланы & Триггеры Умений</h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Активация «Фазового Пробоя» и «Квантового Резонанса» через искры.
          </p>
        </button>
      </div>

      {/* Step Content & Scenario Description */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/40">
              <h3 className="text-base font-bold text-cyan-300">
                Шаг 1: Анатомия Карты и 4-Раундовая Дуэль
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                В каждом матче участвуют 4 карты из вашей колоды. В начале раунда вы выставляете 1 карту.
                У каждой карты есть два базовых параметра:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300 list-disc list-inside">
                <li><strong className="text-cyan-400">Сила (HP/Защита)</strong> — запас прочности. Если урон врага превышает вашу Силу, карта уничтожается!</li>
                <li><strong className="text-amber-400">Урон (Атака)</strong> — количество урона, наносимого по Силе оппонента в фазе столкновения.</li>
              </ul>
              <div className="mt-3 text-xs font-semibold text-cyan-200">
                Задание шага 1: Выберите карту «Оруженосец Титанов» (Сила: 8, Урон: 5) и нажмите кнопку «Начать Столкновение».
              </div>
            </div>

            {/* Interactive Sandbox for Step 1 */}
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Доступные карты игрока:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                {step1Cards.map(c => (
                  <CardView
                    key={c.id}
                    card={c}
                    isSelected={selectedCardId === c.id}
                    onClick={() => {
                      setSelectedCardId(c.id);
                      sound.playCardSelect();
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs font-medium text-slate-400 mb-2">Оппонент туториала (ИИ):</div>
              <div className="max-w-xs">
                <CardView card={step1Enemy} isDisabled />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40">
              <h3 className="text-base font-bold text-amber-300">
                Шаг 2: Управление Квантовыми Искрами (+1 Сила, +2 Урон)
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                На весь 4-раундовый бой вам выдается стартовый резерв из <strong className="text-amber-300">12 Квантовых искр</strong>. 
                Вы вольны потратить 0 искр, сберечь их на решающий раунд или пойти All-In.
              </p>
              <div className="mt-2 p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-amber-400 border border-amber-500/20">
                Математическая формула: Итоговая_Сила = База + Искры; Итоговый_Урон = База + (Искры * 2).
              </div>
              <div className="mt-3 text-xs font-semibold text-amber-200">
                Задание шага 2: Против вас выставлен опасный «Пожиратель Пустоты» (Сила 11, Урон 8). Выберите «Тектонический Молот» и добавьте ровно 2 или 3 искры, чтобы пробить его защиту!
              </div>
            </div>

            {/* Interactive Sandbox for Step 2 */}
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Ваша карта:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                {step2Cards.map(c => (
                  <CardView
                    key={c.id}
                    card={c}
                    isSelected={selectedCardId === c.id}
                    onClick={() => {
                      setSelectedCardId(c.id);
                      sound.playCardSelect();
                    }}
                  />
                ))}
              </div>
            </div>

            {selectedCardId && (
              <SparkController
                availableSparks={12}
                allocatedSparks={allocatedSparks}
                onChange={setAllocatedSparks}
              />
            )}

            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs font-medium text-slate-400 mb-2">Оппонент туториала:</div>
              <div className="max-w-xs">
                <CardView card={step2Enemy} isDisabled extraDamage={2} extraPower={1} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
              <h3 className="text-base font-bold text-purple-300">
                Шаг 3: Синергии Кланов и Триггеры Уникальных Умений
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Способности активируются строго по фазам! «Фазовый Рассекатель» (Астральные Стражи) обладает умением:
                <em className="text-cyan-300 font-semibold"> «Фазовый Пробой: если вложено ≥ 4 искр, атака полностью игнорирует Силу/Броню врага».</em>
              </p>
              <div className="mt-3 text-xs font-semibold text-purple-200">
                Задание шага 3: Против вас бронированный «Голиаф» с колоссальной Силой 17 HP. Выберите «Фазовый Рассекатель», выделите ровно 4 искры и активируйте сквозной пробой!
              </div>
            </div>

            {/* Interactive Sandbox for Step 3 */}
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Ваша карта:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                {step3Cards.map(c => (
                  <CardView
                    key={c.id}
                    card={c}
                    isSelected={selectedCardId === c.id}
                    onClick={() => {
                      setSelectedCardId(c.id);
                      sound.playCardSelect();
                    }}
                  />
                ))}
              </div>
            </div>

            {selectedCardId && (
              <SparkController
                availableSparks={12}
                allocatedSparks={allocatedSparks}
                onChange={setAllocatedSparks}
              />
            )}

            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs font-medium text-slate-400 mb-2">Оппонент туториала:</div>
              <div className="max-w-xs">
                <CardView card={step3Enemy} isDisabled />
              </div>
            </div>
          </div>
        )}

        {/* Execution & Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!selectedCardId}
              onClick={handleExecuteTutorialStep}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              Начать Столкновение
            </button>
            <button
              type="button"
              onClick={resetCurrentStepPractice}
              title="Сбросить попытку"
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {stepSuccess && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Задание шага успешно выполнено!
              </span>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Следующий шаг</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/40">
                  Курс завершен! Вы готовы к Арене!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Battle Log Box */}
        {battleResolved && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="text-slate-400 font-semibold mb-1">Результат симуляции столкновения:</div>
            <div className="text-slate-200">{lastLog}</div>
          </div>
        )}
      </div>
    </div>
  );
};
