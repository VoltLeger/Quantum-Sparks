/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, RoundResolutionResult, ResolutionStep, ClanId } from '../types/game';

export interface RoundContext {
  player1Hand?: Card[];
  player2Hand?: Card[];
  player1AttacksFirst?: boolean;
  previousRoundWinner?: 'player1' | 'player2' | 'draw' | null;
  player1Life?: number;
  player2Life?: number;
}

/**
 * Проверяет, активен ли бонус клана карты в текущей руке игрока.
 * ПРАВИЛО URBAN RIVALS / QUANTUM SPARKS:
 * Бонус клана активен ТОЛЬКО если в руке из 4 карт есть 2 или более карты этого же клана!
 */
export function isClanBonusActive(card: Card, hand?: Card[]): boolean {
  if (!hand || hand.length === 0) return true; // По умолчанию активен, если рука не передана
  const clanCount = hand.filter(c => c.clanId === card.clanId).length;
  return clanCount >= 2;
}

/**
 * Вычисляет результат боевого раунда согласно строгой 5-фазной очерёдности.
 * 
 * Фаза 1: Вскрытие карт (базовые статы).
 * Фаза 2: Пассивные бонусы Кланов (активны только при наличии ≥2 карт клана в руке).
 * Фаза 3: Трата Квантовых искр (+1 к Силе, +2 к Урону за искру).
 * Фаза 4: Активация Умений карт (Контр-умения → Условные → Базовые → Атакующие).
 * Фаза 5: Подсчет урона, победы/поражения и эффекты Victory/Defeat (+Life, +Sparks, Poison).
 */
export function resolve_round(
  player1_card: Card,
  player1_sparks: number,
  player2_card: Card,
  player2_sparks: number,
  roundNumber: number = 1,
  context?: RoundContext
): RoundResolutionResult {
  const steps: ResolutionStep[] = [];

  // ==========================================
  // ФАЗА 1: ВСКРЫТИЕ КАРТ (REVEAL)
  // ==========================================
  let p1Power = player1_card.basePower;
  let p1Damage = player1_card.baseDamage;
  let p2Power = player2_card.basePower;
  let p2Damage = player2_card.baseDamage;
  let p1SparkRefund = 0;
  let p2SparkRefund = 0;
  let p1LifeChange = 0;
  let p2LifeChange = 0;

  steps.push({
    phase: 1,
    title: '1. Вскрытие карт и объявление Квантовых искр',
    p1Effect: `Карта «${player1_card.name}» (${player1_card.stars}★) [Сила: ${p1Power}, Урон: ${p1Damage}]. Вложено искр: ${player1_sparks}`,
    p2Effect: `Карта «${player2_card.name}» (${player2_card.stars}★) [Сила: ${p2Power}, Урон: ${p2Damage}]. Вложено искр: ${player2_sparks}`,
    p1State: { power: p1Power, damage: p1Damage },
    p2State: { power: p2Power, damage: p2Damage },
  });

  // ==========================================
  // ПРЕДВАРИТЕЛЬНЫЙ АНАЛИЗ КОНТР-УМЕНИЙ
  // Stop Opp. Ability, Stop Opp. Bonus, Protection, Copy
  // ==========================================
  const p1Ability = player1_card.ability;
  const p2Ability = player2_card.ability;

  // Отмена способности противника
  const p1CancelsP2Ability = p1Ability?.effectType === 'stop_opp_ability' || p1Ability?.id === 'stop_opp_ability';
  const p2CancelsP1Ability = p2Ability?.effectType === 'stop_opp_ability' || p2Ability?.id === 'stop_opp_ability';

  const p1AbilityActive = !p2CancelsP1Ability;
  const p2AbilityActive = !p1CancelsP2Ability;

  // Отмена кланового бонуса противника (Stop Opp. Bonus)
  const p1CancelsP2Bonus = p1AbilityActive && (p1Ability?.effectType === 'stop_opp_bonus' || p1Ability?.id === 'stop_opp_bonus');
  const p2CancelsP1Bonus = p2AbilityActive && (p2Ability?.effectType === 'stop_opp_bonus' || p2Ability?.id === 'stop_opp_bonus');

  // ==========================================
  // ФАЗА 2: ПАССИВНЫЕ БОНУСЫ КЛАНОВ
  // УСЛОВИЕ: ≥2 карт клана в руке + отсутствие Stop Opp. Bonus
  // ==========================================
  const p1BonusEligible = isClanBonusActive(player1_card, context?.player1Hand);
  const p2BonusEligible = isClanBonusActive(player2_card, context?.player2Hand);

  const p1BonusActive = p1BonusEligible && !p2CancelsP1Bonus;
  const p2BonusActive = p2BonusEligible && !p1CancelsP2Bonus;

  let p1BuffLog = '';
  let p2BuffLog = '';

  if (!p1BonusEligible) {
    p1BuffLog += 'Бонус клана НЕ АКТИВЕН (в руке < 2 карт клана). ';
  } else if (p2CancelsP1Bonus) {
    p1BuffLog += 'Бонус клана ОТМЕНЕН умением противника (Stop Opp. Bonus). ';
  }

  if (!p2BonusEligible) {
    p2BuffLog += 'Бонус клана НЕ АКТИВЕН (в руке < 2 карт клана). ';
  } else if (p1CancelsP2Bonus) {
    p2BuffLog += 'Бонус клана ОТМЕНЕН умением противника (Stop Opp. Bonus). ';
  }

  // 2.1. Баффы кланов (Титаны, Синдикат Хаоса, Технократы)
  if (p1BonusActive) {
    if (player1_card.clanId === 'titans') {
      p1Power += 2;
      p1Damage += 2;
      p1BuffLog += 'Бафф Титанов (+2 Сила, +2 Урон). ';
    } else if (player1_card.clanId === 'syndicate_of_chaos') {
      const chaosBonus = player1_card.stars;
      p1Damage += chaosBonus;
      p1BuffLog += `Энтропия Синдиката (+${chaosBonus} Урона за ${player1_card.stars}★). `;
    } else if (player1_card.clanId === 'technocrats') {
      p1Power += 2;
      p1SparkRefund += 1;
      p1BuffLog += 'Квантовый Синтез Технократов (+2 Сила, +1 Искра рекуперации). ';
    }
  }

  if (p2BonusActive) {
    if (player2_card.clanId === 'titans') {
      p2Power += 2;
      p2Damage += 2;
      p2BuffLog += 'Бафф Титанов (+2 Сила, +2 Урон). ';
    } else if (player2_card.clanId === 'syndicate_of_chaos') {
      const chaosBonus = player2_card.stars;
      p2Damage += chaosBonus;
      p2BuffLog += `Энтропия Синдиката (+${chaosBonus} Урона за ${player2_card.stars}★). `;
    } else if (player2_card.clanId === 'technocrats') {
      p2Power += 2;
      p2SparkRefund += 1;
      p2BuffLog += 'Квантовый Синтез Технократов (+2 Сила, +1 Искра рекуперации). ';
    }
  }

  // 2.2. Дебаффы кланов (Астральные Стражи, Теневики)
  let p1DebuffLog = '';
  let p2DebuffLog = '';

  const p1HasProtectionPower = p1AbilityActive && (p1Ability?.effectType === 'protection_power');
  const p1HasProtectionDamage = p1AbilityActive && (p1Ability?.effectType === 'protection_damage');
  const p2HasProtectionPower = p2AbilityActive && (p2Ability?.effectType === 'protection_power');
  const p2HasProtectionDamage = p2AbilityActive && (p2Ability?.effectType === 'protection_damage');

  if (p1BonusActive) {
    if (player1_card.clanId === 'astral_guardians' && !p2HasProtectionPower) {
      const prevP2Power = p2Power;
      p2Power = Math.max(1, p2Power - 2);
      p2DebuffLog += `Астральное искажение (-${prevP2Power - p2Power} Силы врага, min 1). `;
    } else if (player1_card.clanId === 'shadow_walkers' && !p2HasProtectionDamage) {
      const prevP2Dmg = p2Damage;
      p2Damage = Math.max(3, p2Damage - 8);
      p2DebuffLog += `Теневой саботаж (-${prevP2Dmg - p2Damage} Урона врага, min 3). `;
    }
  }

  if (p2BonusActive) {
    if (player2_card.clanId === 'astral_guardians' && !p1HasProtectionPower) {
      const prevP1Power = p1Power;
      p1Power = Math.max(1, p1Power - 2);
      p1DebuffLog += `Астральное искажение (-${prevP1Power - p1Power} Силы врага, min 1). `;
    } else if (player2_card.clanId === 'shadow_walkers' && !p1HasProtectionDamage) {
      const prevP1Dmg = p1Damage;
      p1Damage = Math.max(3, p1Damage - 8);
      p1DebuffLog += `Теневой саботаж (-${prevP1Dmg - p1Damage} Урона врага, min 3). `;
    }
  }

  steps.push({
    phase: 2,
    title: '2. Применение бонусов Кланов (Проверка: ≥2 карт клана в руке)',
    p1Effect: `${p1BuffLog || 'Баффов нет. '}${p1DebuffLog ? `Получен дебафф: ${p1DebuffLog}` : ''}`,
    p2Effect: `${p2BuffLog || 'Баффов нет. '}${p2DebuffLog ? `Получен дебафф: ${p2DebuffLog}` : ''}`,
    p1State: { power: p1Power, damage: p1Damage },
    p2State: { power: p2Power, damage: p2Damage },
  });

  // ==========================================
  // ФАЗА 3: ТРАТА КВАНТОВЫХ ИСКР
  // Каждая искра дает +1 к Силе и +2 к Урону
  // (Нано-Сверхразум дает +3 к Урону при активном умении)
  // ==========================================
  const p1SparksDmgMult = (p1AbilityActive && p1Ability?.id === 'spark_overclock') ? 3 : 2;
  const p2SparksDmgMult = (p2AbilityActive && p2Ability?.id === 'spark_overclock') ? 3 : 2;

  const p1SparkPowerGain = player1_sparks * 1;
  const p1SparkDamageGain = player1_sparks * p1SparksDmgMult;

  const p2SparkPowerGain = player2_sparks * 1;
  const p2SparkDamageGain = player2_sparks * p2SparksDmgMult;

  p1Power += p1SparkPowerGain;
  p1Damage += p1SparkDamageGain;
  p2Power += p2SparkPowerGain;
  p2Damage += p2SparkDamageGain;

  steps.push({
    phase: 3,
    title: '3. Трата Квантовых искр (Формула: +1 Сила, +2 Урон за искру)',
    p1Effect: `Вложено ${player1_sparks} искр → +${p1SparkPowerGain} к Силе, +${p1SparkDamageGain} к Урону.`,
    p2Effect: `Вложено ${player2_sparks} искр → +${p2SparkPowerGain} к Силе, +${p2SparkDamageGain} к Урону.`,
    p1State: { power: p1Power, damage: p1Damage },
    p2State: { power: p2Power, damage: p2Damage },
  });

  // ==========================================
  // ФАЗА 4: АКТИВАЦИЯ УМЕНИЙ КАРТ
  // ==========================================
  let p1AbilityLog = '';
  let p2AbilityLog = '';
  let p1Piercing = false;
  let p2Piercing = false;

  // Функция применения умения игрока
  const applyCardAbility = (
    playerNum: 1 | 2,
    ability: Card['ability'],
    isActive: boolean
  ) => {
    if (!isActive) {
      if (playerNum === 1) p1AbilityLog += 'Способность заблокирована противником (Stop Opp. Ability). ';
      else p2AbilityLog += 'Способность заблокирована противником (Stop Opp. Ability). ';
      return;
    }

    const isP1 = playerNum === 1;
    const eff = ability.effectType;
    const val = ability.value || 0;
    const secVal = ability.secondaryValue || 0;
    const minVal = ability.min || 1;
    const id = ability.id;

    // --- 4.1. КОПИРОВАНИЕ ХАРАКТЕРИСТИК (Copy) ---
    if (eff === 'copy_opp_power' || id === 'copy_power_cerebrah') {
      if (isP1) {
        const copyVal = player2_card.basePower;
        p1Power = Math.max(p1Power, copyVal);
        p1AbilityLog += `[Копия] Скопирована Сила врага (${copyVal})! `;
      } else {
        const copyVal = player1_card.basePower;
        p2Power = Math.max(p2Power, copyVal);
        p2AbilityLog += `[Копия] Скопирована Сила врага (${copyVal})! `;
      }
      return;
    }

    if (eff === 'copy_opp_damage') {
      if (isP1) {
        const copyVal = player2_card.baseDamage;
        p1Damage = Math.max(p1Damage, copyVal);
        p1AbilityLog += `[Копия] Скопирован Урон врага (${copyVal})! `;
      } else {
        const copyVal = player1_card.baseDamage;
        p2Damage = Math.max(p2Damage, copyVal);
        p2AbilityLog += `[Копия] Скопирован Урон врага (${copyVal})! `;
      }
      return;
    }

    // --- 4.2. БАЗОВЫЕ УМЕНИЯ (РАБОТАЮТ ВСЕГДА) ---
    if (eff === 'power_plus') {
      if (isP1) { p1Power += val; p1AbilityLog += `+${val} к Силе. `; }
      else { p2Power += val; p2AbilityLog += `+${val} к Силе. `; }
      return;
    }

    if (eff === 'damage_plus') {
      if (isP1) { p1Damage += val; p1AbilityLog += `+${val} к Урону. `; }
      else { p2Damage += val; p2AbilityLog += `+${val} к Урону. `; }
      return;
    }

    if (eff === 'power_damage_plus') {
      if (isP1) { p1Power += val; p1Damage += (secVal || val); p1AbilityLog += `+${val} к Силе и +${secVal || val} к Урону. `; }
      else { p2Power += val; p2Damage += (secVal || val); p2AbilityLog += `+${val} к Силе и +${secVal || val} к Урону. `; }
      return;
    }

    if (eff === 'opp_power_minus') {
      if (isP1 && !p2HasProtectionPower) {
        const prev = p2Power;
        p2Power = Math.max(minVal, p2Power - val);
        p1AbilityLog += `-${val} Силы противника (min ${minVal}). `;
      } else if (!isP1 && !p1HasProtectionPower) {
        const prev = p1Power;
        p1Power = Math.max(minVal, p1Power - val);
        p2AbilityLog += `-${val} Силы противника (min ${minVal}). `;
      }
      return;
    }

    if (eff === 'opp_damage_minus') {
      if (isP1 && !p2HasProtectionDamage) {
        p2Damage = Math.max(minVal, p2Damage - val);
        p1AbilityLog += `-${val} Урона противника (min ${minVal}). `;
      } else if (!isP1 && !p1HasProtectionDamage) {
        p1Damage = Math.max(minVal, p1Damage - val);
        p2AbilityLog += `-${val} Урона противника (min ${minVal}). `;
      }
      return;
    }

    if (eff === 'opp_power_damage_minus') {
      if (isP1) {
        if (!p2HasProtectionPower) p2Power = Math.max(minVal, p2Power - val);
        if (!p2HasProtectionDamage) p2Damage = Math.max(minVal, p2Damage - (secVal || val));
        p1AbilityLog += `-${val} Силы и Урона противника (min ${minVal}). `;
      } else {
        if (!p1HasProtectionPower) p1Power = Math.max(minVal, p1Power - val);
        if (!p1HasProtectionDamage) p1Damage = Math.max(minVal, p1Damage - (secVal || val));
        p2AbilityLog += `-${val} Силы и Урона противника (min ${minVal}). `;
      }
      return;
    }

    // --- 4.3. УСЛОВНЫЕ И ПОЗИЦИОННЫЕ УМЕНИЯ ---
    // Courage: срабатывает, только если ходит первым
    if (eff === 'courage' || id === 'courage_nunavik') {
      const isAttackingFirst = isP1 ? context?.player1AttacksFirst !== false : context?.player1AttacksFirst === false;
      if (isAttackingFirst) {
        const pBoost = val || 2;
        const dBoost = secVal || val || 2;
        if (isP1) { p1Power += pBoost; p1Damage += dBoost; p1AbilityLog += `[Courage: 1-й ход] +${pBoost} Сила, +${dBoost} Урон! `; }
        else { p2Power += pBoost; p2Damage += dBoost; p2AbilityLog += `[Courage: 1-й ход] +${pBoost} Сила, +${dBoost} Урон! `; }
      } else {
        if (isP1) p1AbilityLog += '[Courage] Не сработал (ход сделан вторым). ';
        else p2AbilityLog += '[Courage] Не сработал (ход сделан вторым). ';
      }
      return;
    }

    // Reprisal: срабатывает, если ходит вторым
    if (eff === 'reprisal') {
      const isAttackingSecond = isP1 ? context?.player1AttacksFirst === false : context?.player1AttacksFirst !== false;
      if (isAttackingSecond) {
        if (isP1) { p1Power += (val || 3); p1AbilityLog += `[Reprisal: Ответный ход] +${val || 3} к Силе! `; }
        else { p2Power += (val || 3); p2AbilityLog += `[Reprisal: Ответный ход] +${val || 3} к Силе! `; }
      }
      return;
    }

    // Confidence: если ваш персонаж выиграл предыдущий раунд
    if (eff === 'confidence') {
      const wonPrev = isP1 ? context?.previousRoundWinner === 'player1' : context?.previousRoundWinner === 'player2';
      if (wonPrev) {
        if (isP1) { p1Power += (val || 2); p1Damage += (secVal || 2); p1AbilityLog += `[Confidence] Победа в прошлом раунде → +${val || 2} Сила, +${secVal || 2} Урон! `; }
        else { p2Power += (val || 2); p2Damage += (secVal || 2); p2AbilityLog += `[Confidence] Победа в прошлом раунде → +${val || 2} Сила, +${secVal || 2} Урон! `; }
      }
      return;
    }

    // Revenge: если ваш персонаж проиграл предыдущий раунд
    if (eff === 'revenge') {
      const lostPrev = isP1 ? context?.previousRoundWinner === 'player2' : context?.previousRoundWinner === 'player1';
      if (lostPrev) {
        if (isP1) { p1Damage += (val || 3); p1AbilityLog += `[Revenge] Месть за поражение → +${val || 3} к Урону! `; }
        else { p2Damage += (val || 3); p2AbilityLog += `[Revenge] Месть за поражение → +${val || 3} к Урону! `; }
      }
      return;
    }

    // Growth: эффект масштабируется от номера раунда
    if (eff === 'growth') {
      const multiplier = roundNumber;
      const totalBoost = (val || 1) * multiplier;
      if (isP1) { p1Power += totalBoost; p1AbilityLog += `[Growth: Р${roundNumber}] +${totalBoost} к Силе (x${multiplier})! `; }
      else { p2Power += totalBoost; p2AbilityLog += `[Growth: Р${roundNumber}] +${totalBoost} к Силе (x${multiplier})! `; }
      return;
    }

    // --- 4.4. СПЕЦИАЛЬНЫЕ МЕХАНИКИ QUANTUM SPARKS ---
    if (id === 'quantum_transposition') {
      if (isP1 && p1Power > p1Damage) {
        const oldP = p1Power;
        p1Power = p1Damage;
        p1Damage = oldP;
        p1AbilityLog += `[Транспозиция] Обмен Силы (${oldP}) и Урона (${p1Damage}) местами! `;
      } else if (!isP1 && p2Power > p2Damage) {
        const oldP = p2Power;
        p2Power = p2Damage;
        p2Damage = oldP;
        p2AbilityLog += `[Транспозиция] Обмен Силы (${oldP}) и Урона (${p2Damage}) местами! `;
      }
      return;
    }

    if (id === 'phase_pierce') {
      const sparks = isP1 ? player1_sparks : player2_sparks;
      if (sparks >= 4) {
        if (isP1) { p1Piercing = true; p1AbilityLog += `[Фазовый Пробой] АКТИВИРОВАН (${sparks} ≥ 4 искр)! Игнор брони! `; }
        else { p2Piercing = true; p2AbilityLog += `[Фазовый Пробой] АКТИВИРОВАН (${sparks} ≥ 4 искр)! Игнор брони! `; }
      }
      return;
    }

    if (id === 'harmonic_overdrive') {
      if (isP1 && p1Power > p2Power) {
        p1Damage = Math.floor(p1Damage * 2.5);
        p1AbilityLog += `[Овердрайв] Сила ${p1Power} > ${p2Power} → Урон x2.5 (${p1Damage})! `;
      } else if (!isP1 && p2Power > p1Power) {
        p2Damage = Math.floor(p2Damage * 2.5);
        p2AbilityLog += `[Овердрайв] Сила ${p2Power} > ${p1Power} → Урон x2.5 (${p2Damage})! `;
      }
      return;
    }

    if (id === 'titan_fortress') {
      if (isP1) {
        p2Damage = Math.max(0, p2Damage - Math.max(3, Math.floor(p2Damage * 0.3)));
        p1AbilityLog += '[Бастион] Входящий урон врага снижен на -30%. ';
      } else {
        p1Damage = Math.max(0, p1Damage - Math.max(3, Math.floor(p1Damage * 0.3)));
        p2AbilityLog += '[Бастион] Входящий урон врага снижен на -30%. ';
      }
      return;
    }
  };

  // Применяем способности обеих сторон
  applyCardAbility(1, p1Ability, p1AbilityActive);
  applyCardAbility(2, p2Ability, p2AbilityActive);

  // Killshot: проверка после всех расчетов Силы
  if (p1AbilityActive && p1Ability?.effectType === 'killshot') {
    if (p1Power >= p2Power * 2) {
      p1Damage += (p1Ability.value || 4);
      p1AbilityLog += `[Killshot] Сила ${p1Power} ≥ 2x ${p2Power} → +${p1Ability.value || 4} к Урону! `;
    }
  }
  if (p2AbilityActive && p2Ability?.effectType === 'killshot') {
    if (p2Power >= p1Power * 2) {
      p2Damage += (p2Ability.value || 4);
      p2AbilityLog += `[Killshot] Сила ${p2Power} ≥ 2x ${p1Power} → +${p2Ability.value || 4} к Урону! `;
    }
  }

  steps.push({
    phase: 4,
    title: '4. Активация Умений карт (Контр-умения → Условные → Базовые)',
    p1Effect: p1AbilityLog || 'Умение не активировано.',
    p2Effect: p2AbilityLog || 'Умение не активировано.',
    p1State: { power: p1Power, damage: p1Damage },
    p2State: { power: p2Power, damage: p2Damage },
  });

  // ==========================================
  // ФАЗА 5: СТОЛКНОВЕНИЕ И ОПРЕДЕЛЕНИЕ ПОБЕДИТЕЛЯ
  // ==========================================
  // В тактических CCG победитель раунда определяется НАИВЫСШЕЙ СИЛОЙ (Attack/Power)
  let winner: 'player1' | 'player2' | 'draw' = 'draw';
  let summary = '';

  if (p1Power > p2Power) {
    winner = 'player1';
    summary = `Игрок 1 побеждает в раунде ${roundNumber} по Силе (${p1Power} против ${p2Power})!`;
  } else if (p2Power > p1Power) {
    winner = 'player2';
    summary = `Игрок 2 побеждает в раунде ${roundNumber} по Силе (${p2Power} против ${p1Power})!`;
  } else {
    winner = 'draw';
    summary = `Ничья в раунде ${roundNumber} (равная Сила: ${p1Power})! Урон не наносится.`;
  }

  // Расчет входящего урона
  const p1IncomingDamage = winner === 'player2' ? p2Damage : 0;
  const p2IncomingDamage = winner === 'player1' ? p1Damage : 0;

  const p1SurvivingPower = Math.max(0, p1Power - p1IncomingDamage);
  const p2SurvivingPower = Math.max(0, p2Power - p2IncomingDamage);
  const p1Alive = p1SurvivingPower > 0;
  const p2Alive = p2SurvivingPower > 0;

  // --- 5.1. РАСЧЕТ ЭФФЕКТОВ VICTORY И DEFEAT (+Life, +Sparks, -Opp Life) ---
  // (Переменные p1SparkRefund, p2SparkRefund, p1LifeChange, p2LifeChange объявлены в начале раунда)

  // Эффекты Игрока 1
  if (p1AbilityActive) {
    if (winner === 'player1') {
      // Способности при победе
      if (p1Ability.effectType === 'win_life_plus') p1LifeChange += (p1Ability.value || 3);
      if (p1Ability.effectType === 'win_sparks_plus' || p1Ability.id === 'quantum_transposition') p1SparkRefund += (p1Ability.value || 2);
      if (p1Ability.effectType === 'win_life_sparks_plus') {
        p1LifeChange += (p1Ability.value || 2);
        p1SparkRefund += (p1Ability.secondaryValue || 2);
      }
      if (p1Ability.effectType === 'win_life_per_damage' || p1Ability.id === 'quantum_vampirism') {
        p1LifeChange += Math.floor(p2IncomingDamage * (p1Ability.value || 1));
      }
      if (p1Ability.effectType === 'win_sparks_per_damage') {
        p1SparkRefund += Math.floor(p2IncomingDamage * (p1Ability.value || 0.5));
      }
      if (p1Ability.effectType === 'win_opp_life_minus') {
        p2LifeChange -= (p1Ability.value || 2);
      }
      if (p1Ability.effectType === 'win_opp_sparks_minus') {
        p2SparkRefund -= (p1Ability.value || 2);
      }
    } else if (winner === 'player2') {
      // Способности при поражении
      if (p1Ability.effectType === 'defeat_life_plus') p1LifeChange += (p1Ability.value || 3);
      if (p1Ability.effectType === 'defeat_sparks_plus') p1SparkRefund += (p1Ability.value || 2);
      if (p1Ability.effectType === 'defeat_opp_life_minus') p2LifeChange -= (p1Ability.value || 2);
      if (p1Ability.effectType === 'heal') p1LifeChange += (p1Ability.value || 2);
      if (p1Ability.effectType === 'poison') p2LifeChange -= (p1Ability.value || 2);
    }
  }

  // Эффекты Игрока 2 (Оппонента)
  if (p2AbilityActive) {
    if (winner === 'player2') {
      if (p2Ability.effectType === 'win_life_plus') p2LifeChange += (p2Ability.value || 3);
      if (p2Ability.effectType === 'win_sparks_plus' || p2Ability.id === 'quantum_transposition') p2SparkRefund += (p2Ability.value || 2);
      if (p2Ability.effectType === 'win_life_sparks_plus') {
        p2LifeChange += (p2Ability.value || 2);
        p2SparkRefund += (p2Ability.secondaryValue || 2);
      }
      if (p2Ability.effectType === 'win_life_per_damage' || p2Ability.id === 'quantum_vampirism') {
        p2LifeChange += Math.floor(p1IncomingDamage * (p2Ability.value || 1));
      }
      if (p2Ability.effectType === 'win_sparks_per_damage') {
        p2SparkRefund += Math.floor(p1IncomingDamage * (p2Ability.value || 0.5));
      }
      if (p2Ability.effectType === 'win_opp_life_minus') {
        p1LifeChange -= (p2Ability.value || 2);
      }
      if (p2Ability.effectType === 'win_opp_sparks_minus') {
        p1SparkRefund -= (p2Ability.value || 2);
      }
    } else if (winner === 'player1') {
      if (p2Ability.effectType === 'defeat_life_plus') p2LifeChange += (p2Ability.value || 3);
      if (p2Ability.effectType === 'defeat_sparks_plus') p2SparkRefund += (p2Ability.value || 2);
      if (p2Ability.effectType === 'defeat_opp_life_minus') p1LifeChange -= (p2Ability.value || 2);
      if (p2Ability.effectType === 'heal') p2LifeChange += (p2Ability.value || 2);
      if (p2Ability.effectType === 'poison') p1LifeChange -= (p2Ability.value || 2);
    }
  }

  steps.push({
    phase: 5,
    title: '5. Итоги раунда, нанесение урона и триггеры Victory/Defeat',
    p1Effect: `Итог: ${winner === 'player1' ? 'ПОБЕДА' : winner === 'player2' ? `Получено ${p1IncomingDamage} урона` : 'Ничья'}. ${p1LifeChange > 0 ? `+${p1LifeChange} HP. ` : ''}${p1SparkRefund > 0 ? `+${p1SparkRefund} Искр.` : ''}`,
    p2Effect: `Итог: ${winner === 'player2' ? 'ПОБЕДА' : winner === 'player1' ? `Получено ${p2IncomingDamage} урона` : 'Ничья'}. ${p2LifeChange > 0 ? `+${p2LifeChange} HP. ` : ''}${p2SparkRefund > 0 ? `+${p2SparkRefund} Искр.` : ''}`,
    p1State: { power: p1SurvivingPower, damage: p1Damage },
    p2State: { power: p2SurvivingPower, damage: p2Damage },
  });

  return {
    roundNumber,
    p1Card: player1_card,
    p2Card: player2_card,
    p1SparksInvested: player1_sparks,
    p2SparksInvested: player2_sparks,
    p1FinalPower: p1Power,
    p1FinalDamage: p1Damage,
    p2FinalPower: p2Power,
    p2FinalDamage: p2Damage,
    p1SurvivingPower,
    p2SurvivingPower,
    p1Alive,
    p2Alive,
    winner,
    summary,
    steps,
    p1SparkRefund,
    p2SparkRefund,
    p1LifeChange,
    p2LifeChange,
    p1BonusActive,
    p2BonusActive,
  };
}
