/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Coins, 
  Gem, 
  Play, 
  Layers, 
  Swords, 
  Shield, 
  Zap, 
  Trophy, 
  Target, 
  ShoppingBag, 
  Flame, 
  Gift, 
  BookOpen, 
  Users,
  ChevronRight,
  Award,
  Lock as LockIcon
} from 'lucide-react';
import { Deck, StarLimitTier } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { sound } from '../logic/sound';
import { CardView } from './CardView';

interface MobileUrbanHubProps {
  currentDeck: Deck;
  onStartBattle: () => void;
  onNavigateTab: (tab: 'campaign' | 'arena' | 'modes' | 'pvp' | 'tutorial' | 'deck' | 'missions' | 'shop' | 'sandbox' | 'docs') => void;
  unlockedCardsCount?: number;
}

export const MobileUrbanHub: React.FC<MobileUrbanHubProps> = ({
  currentDeck,
  onStartBattle,
  onNavigateTab,
  unlockedCardsCount = 10,
}) => {
  const [activeStarMode, setActiveStarMode] = useState<StarLimitTier>(22);

  const battleSquadCards = CARDS.filter(c => currentDeck.battleCardIds.includes(c.id));
  const squadStars = battleSquadCards.reduce((acc, c) => acc + c.stars, 0);

  const handlePlayClick = () => {
    sound.playClash();
    onStartBattle();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 text-slate-100 font-sans">
      {/* =====================================================================
          1. ВСТУПИТЕЛЬНАЯ КАМПАНИЯ HERO-BANNER (ДЛЯ ПОЛУЧЕНИЯ 10 КАРТ)
      ====================================================================== */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              Старт игры
            </span>
            <span className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Соберите свои первые 10 карт
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Вступительная Кампания: Путь Неофита
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Пройдите 4 обучающие дуэли с тактическим ИИ, изучите формулу Атаки (Сила × Искры) и соберите готовую стартовую колоду из 10 карт!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('campaign')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer transition-transform hover:scale-105 flex items-center gap-2"
            >
              <Swords className="w-4 h-4 fill-slate-950" />
              <span>Начать Кампанию (10 Карт)</span>
            </button>
            <button
              type="button"
              onClick={handlePlayClick}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              <span>Быстрый Бой</span>
            </button>
          </div>
        </div>

        {/* Preview of cards earned */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 self-center">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Коллекция</span>
            <span className="text-lg font-black font-mono text-amber-400">{unlockedCardsCount} / 24</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-800" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Боевой отряд</span>
            <span className="text-lg font-black font-mono text-cyan-300">{battleSquadCards.length} / 4</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. БОЕВАЯ ЧЕТВЕРКА & БЫСТРАЯ АРЕНА
      ====================================================================== */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Текущий Боевой Отряд ({squadStars}★)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Эти 4 карты выйдут на арену в следующем 4-раундовом матче.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('deck')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-purple-400 text-purple-300 hover:text-purple-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Сменить карты в Конструкторе</span>
            </button>
            <button
              type="button"
              onClick={handlePlayClick}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wide cursor-pointer transition-transform hover:scale-105 shadow-sm"
            >
              В Бой!
            </button>
          </div>
        </div>

        {/* 4 Cards Hand Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {battleSquadCards.map(c => (
            <div key={c.id}>
              <CardView card={c} size="compact" />
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================================
          3. ТУРНИРНЫЕ ЗВЕЗДНЫЕ ЛИМИТЫ (22★, 25★, 33★, БЕЗЛИМИТ)
      ====================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Турнирные Лимиты Звёзд</span>
          </span>
          <span className="font-mono text-slate-400">
            Звёзд в вашем отряде: <strong className="text-amber-400">{squadStars}★</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { limit: 22 as StarLimitTier, title: '22★ Рейтинг', sub: 'Классический баланс EFC' },
            { limit: 25 as StarLimitTier, title: '25★ Элита', sub: 'Турнирный пул' },
            { limit: 33 as StarLimitTier, title: '33★ Мастер', sub: 'Сверхтяжелые титаны' },
            { limit: 999 as StarLimitTier, title: 'Безлимит ∞', sub: 'Любые карты без ограничений' },
          ].map(m => (
            <button
              key={m.limit}
              type="button"
              onClick={() => {
                sound.playCardSelect();
                setActiveStarMode(m.limit);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activeStarMode === m.limit
                  ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-white">{m.title}</span>
                {activeStarMode === m.limit && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{m.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          4. КАТАЛОГ СЕКЦИЙ И РЕЖИМОВ
      ====================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Конструктор Колод */}
        <div 
          onClick={() => onNavigateTab('deck')}
          className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-950 p-4 flex flex-col justify-between cursor-pointer hover:border-blue-400/60 transition-all hover:scale-[1.02] shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md">
                Колода
              </span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="font-bold text-sm text-white mt-2">Конструктор</h4>
            <p className="text-xs text-slate-400 mt-1">
              Управляйте коллекцией и настраивайте боевую четвёрку.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-300 mt-3 flex items-center gap-1">
            <span>Открыть</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Магазин Бустеров */}
        <div 
          onClick={() => onNavigateTab('shop')}
          className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 p-4 flex flex-col justify-between cursor-pointer hover:border-purple-400/60 transition-all hover:scale-[1.02] shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-md">
                Рынок
              </span>
              <ShoppingBag className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="font-bold text-sm text-white mt-2">Магазин Бустеров</h4>
            <p className="text-xs text-slate-400 mt-1">
              Открывайте наборы и расширяйте пул карт всех 5 кланов.
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-300 mt-3 flex items-center gap-1">
            <span>В магазин</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Миссии Кланов */}
        <div 
          onClick={() => onNavigateTab('missions')}
          className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 p-4 flex flex-col justify-between cursor-pointer hover:border-amber-400/60 transition-all hover:scale-[1.02] shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                Квесты
              </span>
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="font-bold text-sm text-white mt-2">Миссии Кланов</h4>
            <p className="text-xs text-slate-400 mt-1">
              Выполняйте испытания за золото, кристаллы и редкие карты.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-300 mt-3 flex items-center gap-1">
            <span>В штаб</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Сетевой PvP */}
        <div 
          onClick={() => onNavigateTab('pvp')}
          className={`rounded-2xl border p-4 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${
            unlockedCardsCount >= 10
              ? 'border-rose-500/30 bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 hover:border-rose-400/60'
              : 'border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 hover:border-amber-500/40 opacity-90'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                unlockedCardsCount >= 10
                  ? 'text-rose-400 bg-rose-500/20'
                  : 'text-amber-400 bg-amber-500/20 flex items-center gap-1'
              }`}>
                {unlockedCardsCount >= 10 ? 'Сетевой' : <><LockIcon className="w-3 h-3" /> Требуется 10 карт</>}
              </span>
              {unlockedCardsCount >= 10 ? (
                <Users className="w-4 h-4 text-rose-400" />
              ) : (
                <LockIcon className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <h4 className="font-bold text-sm text-white mt-2">PvP Дуэли Тестеров</h4>
            <p className="text-xs text-slate-400 mt-1">
              {unlockedCardsCount >= 10
                ? 'Сражения с реальными соперниками и турнирные таблицы.'
                : 'Завершите кампанию (10 карт) для допуска к серверам онлайн.'}
            </p>
          </div>
          <span className={`text-xs font-semibold mt-3 flex items-center gap-1 ${
            unlockedCardsCount >= 10 ? 'text-rose-300' : 'text-amber-400'
          }`}>
            <span>{unlockedCardsCount >= 10 ? 'В лобби' : 'Открыть доступ'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
