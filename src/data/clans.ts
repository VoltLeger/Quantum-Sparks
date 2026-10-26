/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clan, ClanId } from '../types/game';

export const CLANS: Record<ClanId, Clan> = {
  titans: {
    id: 'titans',
    name: 'Титаны',
    motto: 'Несокрушимая Монолитная Сила',
    color: '#f59e0b', // Amber / Gold
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    description: 'Массивные джаггернауты, полагающиеся на брутальную мощь брони и подавляющий натиск.',
    mathBonusDescription: '+2 к Силе и +2 к Урону карты в бою.',
    illustrationUrl: '/src/assets/images/card_titan_goliath_1792752389075.jpg',
  },
  astral_guardians: {
    id: 'astral_guardians',
    name: 'Астральные Стражи',
    motto: 'Искажение Пространства и Равновесия',
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    borderColor: 'border-cyan-500/40',
    description: 'Мистики эфира, разрушающие физическую структуру и ослабляющие жизненную оболочку врага.',
    mathBonusDescription: '-2 к Силе врага (но не ниже 1) и -2 к Броне/Здоровью врага.',
    illustrationUrl: '/src/assets/images/card_astral_cleaver_1792752389230.jpg',
  },
  technocrats: {
    id: 'technocrats',
    name: 'Технократы',
    motto: 'Абсолютная Квантовая Эффективность',
    color: '#3b82f6', // Blue
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    description: 'Гении синтеза энергии, накапливающие Квантовые искры и усиливающие стабильность цепи.',
    mathBonusDescription: '+2 к Силе карты и +1 Квантовая искра рекуперации в раунде.',
    illustrationUrl: '/src/assets/images/card_techno_inverter_1792752390239.jpg',
  },
  shadow_walkers: {
    id: 'shadow_walkers',
    name: 'Теневики',
    motto: 'Тишина перед Смертоносным Ударом',
    color: '#a855f7', // Purple
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    description: 'Мастера скрытности и саботажа, резко гасящие атакующую мощь оппонентов до минимума.',
    mathBonusDescription: '-8 к Урону врага (но не ниже 3).',
    illustrationUrl: '/src/assets/images/card_shadow_assassin_1792752390188.jpg',
  },
  syndicate_of_chaos: {
    id: 'syndicate_of_chaos',
    name: 'Синдикат Хаоса',
    motto: 'Чем Выше Ранг — Тем Беспощаднее Взрыв',
    color: '#ef4444', // Red
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    borderColor: 'border-red-500/40',
    description: 'Фанатики неконтролируемой энтропии, чей урон масштабируется от ранга звёздности.',
    mathBonusDescription: '+1 к Урону за каждую звезду карты (например, 6★ карта получает +6 к Урону).',
    illustrationUrl: '/src/assets/images/card_chaos_dreadnought_1792752390294.jpg',
  },
};
