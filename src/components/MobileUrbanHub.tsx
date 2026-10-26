/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Coins, 
  Gem, 
  Mail, 
  Menu, 
  Play, 
  Layers, 
  BookOpen, 
  SlidersHorizontal, 
  FileText, 
  Swords, 
  Shield, 
  Zap, 
  ChevronRight, 
  Trophy, 
  Users, 
  Bell, 
  X,
  Star,
  Target,
  ShoppingBag,
  Flame
} from 'lucide-react';
import { Deck, StarLimitTier } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { sound } from '../logic/sound';

interface MobileUrbanHubProps {
  currentDeck: Deck;
  onStartBattle: () => void;
  onNavigateTab: (tab: 'arena' | 'tutorial' | 'deck' | 'missions' | 'shop' | 'sandbox' | 'docs') => void;
}

export const MobileUrbanHub: React.FC<MobileUrbanHubProps> = ({
  currentDeck,
  onStartBattle,
  onNavigateTab,
}) => {
  const [showMailModal, setShowMailModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [activeStarMode, setActiveStarMode] = useState<StarLimitTier>(22);

  const battleSquadCards = CARDS.filter(c => currentDeck.battleCardIds.includes(c.id));
  const squadStars = battleSquadCards.reduce((acc, c) => acc + c.stars, 0);

  const handlePlayClick = () => {
    sound.playClash();
    onStartBattle();
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative shadow-2xl border-x border-slate-900 overflow-x-hidden font-sans">
      {/* =====================================================================
          1. ВЕРХНЯЯ ПАНЕЛЬ (TOP BAR - ТОЧНО ПО СКРИНШОТУ)
          - Слева: Аватар в закругленном квадрате с оранжевой рамкой, Никнейм, Ранг / Уровень
          - По центру / Справа: Ресурсы (Золото, Кристаллы, Квантовые Искры), Почта ✉️, Меню ☰
      ====================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-800/80 shadow-md">
        <div className="flex items-center justify-between gap-2">
          {/* Слева: Аватар и профиль */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Квадратный аватар со знаком вопроса / профилем как на скрине */}
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 p-0.5 border-2 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
              <span className="font-black text-2xl text-amber-200 select-none">?</span>
              {/* Бейдж онлайна / уровня */}
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-md font-mono">
                75
              </span>
            </div>

            {/* Никнейм и ранг */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white truncate tracking-tight">
                  Likedarck
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1">
                <span>Master</span>
                <span>·</span>
                <span className="text-amber-400/90 font-mono">Ур. 75</span>
              </div>
            </div>
          </div>

          {/* Справа: Счетчики ресурсов и кнопки (Почта, Меню) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Ресурс 1: Квантовые искры (главный ресурс трат) */}
            <div 
              className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-full border border-cyan-500/40 shadow-sm"
              title="Квантовые искры (главный ресурс боя)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 fill-cyan-400 animate-pulse" />
              <span className="text-xs font-black font-mono text-cyan-300 tabular-nums">
                12
              </span>
            </div>

            {/* Ресурс 2: Золото / Кредиты */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-full border border-amber-500/30">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold font-mono text-amber-300 tabular-nums">
                20.9M
              </span>
            </div>

            {/* Ресурс 3: Кристаллы */}
            <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-full border border-purple-500/30">
              <Gem className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold font-mono text-purple-300 tabular-nums">
                109
              </span>
            </div>

            {/* Кнопка Почты ✉️ */}
            <button
              type="button"
              onClick={() => setShowMailModal(true)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer relative"
              title="Почта и награды"
            >
              <Mail className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            {/* Кнопка Меню ☰ */}
            <button
              type="button"
              onClick={() => setShowMenuModal(true)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title="Меню настроек"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. СКРОЛЛИРУЕМАЯ ЦЕНТРАЛЬНАЯ ЧАСТЬ ХАБА
          - Карточки быстрых действий
          - Главный баннер «В БОЙ!»
          - Выбор звёздного режима (22★, 25★, 33★, Безлимит)
          - Боевая четверка карт
          - 5 Кланов и лента событий
      ====================================================================== */}
      <main className="flex-1 px-3.5 py-4 space-y-4 pb-28">
        {/* Главный Hero-баннер: Быстрый старт дуэли */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
              Быстрая Дуэль · 4 Раунда
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 12 Искр
            </span>
          </div>

          <div className="mt-2.5">
            <h2 className="text-lg font-black text-white tracking-tight">
              Квантовая Арена Столкновения
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Матч из 4 раундов, усиление карт Квантовыми Искрами (+1 Сила / +2 Урон).
            </p>
          </div>

          {/* Превью боевой четвёрки */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {battleSquadCards.map(c => (
                <div 
                  key={c.id} 
                  className="w-8 h-10 rounded-md bg-slate-950 border border-slate-700 flex flex-col items-center justify-center p-0.5"
                  title={`${c.name} (${c.stars}★)`}
                >
                  <span className="text-[9px] font-bold font-mono text-amber-400">{c.stars}★</span>
                  <div className="flex items-center gap-0.5 text-[8px] font-mono text-cyan-300">
                    <span>{c.basePower}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePlayClick}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Играть</span>
            </button>
          </div>
        </div>

        {/* Секция: Выбор Звёздного Лимита (22★, 25★, 33★, Безлимит) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Звёздные Турнирные Режимы
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Ваш состав: <strong className="text-amber-400">{squadStars}★</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { limit: 22 as StarLimitTier, title: '22★ Рейтинг', sub: 'Стандарт баланса' },
              { limit: 25 as StarLimitTier, title: '25★ Элита', sub: 'Продвинутый пул' },
              { limit: 33 as StarLimitTier, title: '33★ Мастер', sub: 'Тяжелые титаны' },
              { limit: 999 as StarLimitTier, title: 'Безлимит ∞', sub: 'Все карты 6★' },
            ].map((m) => (
              <button
                key={m.limit}
                type="button"
                onClick={() => {
                  sound.playCardSelect();
                  setActiveStarMode(m.limit);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeStarMode === m.limit
                    ? 'bg-slate-900 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-white">{m.title}</span>
                  {activeStarMode === m.limit && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4 Карточки быстрых переходов хаба */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Баннер 1: Конструктор Колод */}
          <div 
            onClick={() => onNavigateTab('deck')}
            className="rounded-xl border border-blue-500/30 bg-gradient-to-b from-blue-950/60 to-slate-950 p-3 flex flex-col justify-between cursor-pointer hover:border-blue-400/60 transition-all hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
                  Колода
                </span>
                <Layers className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h3 className="font-bold text-xs text-white mt-1.5">Конструктор</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                6–11 карт в колоде, выбор боевой четвёрки.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-blue-300 mt-2 flex items-center gap-0.5">
              Собрать &rsaquo;
            </span>
          </div>

          {/* Баннер 2: Миссии Кланов */}
          <div 
            onClick={() => onNavigateTab('missions')}
            className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/60 to-slate-950 p-3 flex flex-col justify-between cursor-pointer hover:border-amber-400/60 transition-all hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                  Награды
                </span>
                <Target className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h3 className="font-bold text-xs text-white mt-1.5">Миссии Кланов</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                Зарабатывайте кредиты, кристаллы и карты.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-amber-300 mt-2 flex items-center gap-0.5">
              В штаб &rsaquo;
            </span>
          </div>

          {/* Баннер 3: Магазин Бустеров */}
          <div 
            onClick={() => onNavigateTab('shop')}
            className="rounded-xl border border-purple-500/30 bg-gradient-to-b from-purple-950/60 to-slate-950 p-3 flex flex-col justify-between cursor-pointer hover:border-purple-400/60 transition-all hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                  Пакеты
                </span>
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h3 className="font-bold text-xs text-white mt-1.5">Бустеры & Рынок</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                Открытие карт 1★-6★ и аукцион бойцов.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-purple-300 mt-2 flex items-center gap-0.5">
              Магазин &rsaquo;
            </span>
          </div>

          {/* Баннер 4: Обучающая Академия */}
          <div 
            onClick={() => onNavigateTab('tutorial')}
            className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/60 to-slate-950 p-3 flex flex-col justify-between cursor-pointer hover:border-cyan-400/60 transition-all hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded">
                  Туториал
                </span>
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h3 className="font-bold text-xs text-white mt-1.5">Академия</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                3 шага: основы, искры и триггеры способностей.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-cyan-300 mt-2 flex items-center gap-0.5">
              Пройти &rsaquo;
            </span>
          </div>
        </div>

        {/* Секция: 5 Кланов Квантового Мира */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              5 Кланов и их бонусы
            </span>
            <button
              onClick={() => onNavigateTab('docs')}
              className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              Все формулы &rsaquo;
            </button>
          </div>

          <div className="space-y-1.5">
            {Object.values(CLANS).map(clan => (
              <div 
                key={clan.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: clan.color }} />
                  <span className="font-bold text-white text-[11px]">{clan.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 text-right truncate max-w-[200px]">
                  {clan.mathBonusDescription}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* =====================================================================
          3. НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (BOTTOM BAR ТОЧНО ПО СКРИНШОТУ)
          - 5 кнопок:
            1. Рынок / Колода
            2. Кол-ция / Обучение
            3. КРУПНАЯ ВЫСТУПАЮЩАЯ ЦЕНТРАЛЬНАЯ КНОПКА PLAY (VS)
            4. Миссии / Лаборатория Resolver
            5. Магазин / Документация GDD
      ====================================================================== */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
        <div className="flex items-end justify-around relative">
          {/* Кнопка 1: Колода (Кол-ция) */}
          <button
            type="button"
            onClick={() => onNavigateTab('deck')}
            className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer group"
          >
            <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold mt-1">Колода</span>
          </button>

          {/* Кнопка 2: Обучение */}
          <button
            type="button"
            onClick={() => onNavigateTab('tutorial')}
            className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer group"
          >
            <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold mt-1">Обучение</span>
          </button>

          {/* Кнопка 3: ЦЕНТРАЛЬНАЯ БОЛЬШАЯ КРУГЛАЯ КНОПКА PLAY (VS)! */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={handlePlayClick}
              className="w-15 h-15 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 font-black flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] border-3 border-slate-950 cursor-pointer hover:scale-110 active:scale-95 transition-all"
              title="В БОЙ! Начать матч"
            >
              <div className="flex flex-col items-center justify-center leading-none">
                <Swords className="w-7 h-7 stroke-[2.5]" />
              </div>
            </button>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 mt-1 font-mono">
              Play
            </span>
          </div>

          {/* Кнопка 4: Resolver Песочница */}
          <button
            type="button"
            onClick={() => onNavigateTab('sandbox')}
            className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer group"
          >
            <SlidersHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold mt-1">Resolver</span>
          </button>

          {/* Кнопка 5: Документация */}
          <button
            type="button"
            onClick={() => onNavigateTab('docs')}
            className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer group"
          >
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold mt-1">GDD</span>
          </button>
        </div>
      </nav>

      {/* Модальное окно почты / наград */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Почтовый Ящик & Награды</span>
              </h3>
              <button onClick={() => setShowMailModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-amber-400">Сезонный бонус: +12 Квантовых Искр</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ваш ранг Master подтвержден! Получите стартовый резерв искр для битв.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно меню настроек */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Меню Игры</h3>
              <button onClick={() => setShowMenuModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => { setShowMenuModal(false); onNavigateTab('docs'); }}
                className="w-full p-2.5 rounded-lg bg-slate-950 text-left text-slate-200 hover:text-white border border-slate-800"
              >
                Техническая Документация & Схемы БД
              </button>
              <button
                onClick={() => { setShowMenuModal(false); onNavigateTab('tutorial'); }}
                className="w-full p-2.5 rounded-lg bg-slate-950 text-left text-slate-200 hover:text-white border border-slate-800"
              >
                Пройти 3-шаговый туториал
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
