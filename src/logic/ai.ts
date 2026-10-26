/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, AiDifficulty } from '../types/game';

export interface AiDecision {
  card: Card;
  sparks: number;
  reasoning: string;
}

/**
 * Тактический ИИ для PvE дуэлей в Tactical CCG.
 * Выбирает оптимальную карту из доступных несыгранных и распределяет Квантовые искры.
 */
export function chooseAiAction(
  availableCards: Card[],
  remainingSparks: number,
  currentRound: number, // 1 to 4
  difficulty: AiDifficulty = 'tactical',
  knownEnemyCard?: Card
): AiDecision {
  if (availableCards.length === 0) {
    throw new Error('No cards available for AI');
  }

  const roundsRemaining = 5 - currentRound; // e.g. round 1 -> 4 rounds left (including this one)

  // 1. Легкий ИИ (случайный / неоптимальный выбор для новичков)
  if (difficulty === 'easy') {
    const card = availableCards[Math.floor(Math.random() * availableCards.length)];
    const maxSparksToSpend = Math.min(remainingSparks, Math.floor(remainingSparks / roundsRemaining) + 1);
    const sparks = Math.floor(Math.random() * (maxSparksToSpend + 1));
    return {
      card,
      sparks,
      reasoning: `Легкий бот выбрал «${card.name}» и выделил ${sparks} искр.`,
    };
  }

  // 2. Тактический / Грандмастер ИИ
  // Анализируем каждую доступную карту и вычисляем идеальный объем искр
  let bestCard = availableCards[0];
  let bestSparks = 0;
  let highestScore = -Infinity;
  let chosenReason = '';

  for (const card of availableCards) {
    // Сколько искр оптимально для этой карты?
    let targetSparks = 0;
    let strategyNote = '';

    // Специфика Фазового Рассекателя (Phase Cleaver)
    if (card.ability.id === 'phase_pierce') {
      if (remainingSparks >= 4) {
        targetSparks = 4; // Ровно 4 для активации пробоя брони!
        strategyNote = 'Активация Фазового Пробоя (ровно 4 искры)';
      } else {
        targetSparks = remainingSparks;
        strategyNote = 'Не хватает искр для пробоя, вложен доступный остаток';
      }
    }
    // Специфика Квантового Резонанса (Harmonic Resonator)
    else if (card.ability.id === 'harmonic_overdrive') {
      // Пытаемся максимизировать Силу, чтобы превзойти врага
      const averageEnemyPower = 12;
      const neededSparks = Math.max(0, averageEnemyPower + 1 - card.basePower);
      targetSparks = Math.min(remainingSparks, Math.max(2, neededSparks));
      strategyNote = 'Усиление Силы для триггера Гармонического x2.5 урона';
    }
    // Специфика Хроно-Инвертора (Chrono Inverter)
    else if (card.ability.id === 'quantum_transposition') {
      // Хроно-Инвертор меняет Силу и Урон местами, если Сила > Урона
      // Добавление искр увеличивает Силу на 1, а Урон на 2
      // Стараемся сохранить Силу > Урона до свапа!
      targetSparks = Math.min(2, remainingSparks);
      strategyNote = 'Балансировка характеристик для инверсии статов';
    }
    // Обычные карты: распределение бюджета по оставшимся раундам
    else {
      if (currentRound === 4) {
        // Последний раунд: сбрасываем ВСЕ оставшиеся искры!
        targetSparks = remainingSparks;
        strategyNote = 'Финальный раунд 4: All-In всеми оставшимися искрами';
      } else {
        // Средний бюджет на раунд
        const budgetPerRound = Math.floor(remainingSparks / roundsRemaining);
        // Сильным картам (5-6 звезд) даем чуть больше искр
        const starWeight = card.stars >= 5 ? 2 : card.stars >= 3 ? 1 : 0;
        targetSparks = Math.min(remainingSparks, Math.max(0, budgetPerRound + starWeight));
        strategyNote = `Плавное распределение бюджета (${budgetPerRound} в среднем на раунд)`;
      }
    }

    // Оценка силы карты
    const effectivePower = card.basePower + targetSparks;
    const effectiveDmg = card.baseDamage + targetSparks * 2;
    const cardScore = effectivePower * 0.9 + effectiveDmg * 1.1 + card.stars * 2;

    if (cardScore > highestScore) {
      highestScore = cardScore;
      bestCard = card;
      bestSparks = targetSparks;
      chosenReason = strategyNote;
    }
  }

  return {
    card: bestCard,
    sparks: bestSparks,
    reasoning: `Тактический ИИ выбрал «${bestCard.name}» (${bestCard.stars}★) с вложением ${bestSparks} искр. Стратегия: ${chosenReason}.`,
  };
}
