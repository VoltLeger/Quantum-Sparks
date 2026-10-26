/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Trophy, 
  Swords, 
  Flame, 
  ShieldAlert, 
  Sparkles, 
  Coins, 
  Gem, 
  Mail, 
  Menu, 
  Pin, 
  ChevronRight, 
  Check, 
  X, 
  Play, 
  RotateCcw, 
  Users, 
  Lock, 
  Info,
  Layers,
  BookOpen,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { Deck, StarLimitTier } from '../types/game';
import { CARDS } from '../data/cards';
import { sound } from '../logic/sound';

export interface GameModeItem {
  id: string;
  category: 'pve' | 'pvp';
  title: string;
  subtitle: string;
  description: string;
  starLimit: StarLimitTier;
  timerText?: string;
  isActive: boolean;
  badgeType: 'tournament' | 'elo' | 'survivor' | 'free' | 'coliseum' | 'team' | 'bot';
  pinned?: boolean;
}

interface GameModesScreenProps {
  currentDeck: Deck;
  onSelectMode: (mode: GameModeItem) => void;
  onOpenDeckBuilder: () => void;
  onNavigateTab: (tab: 'hub' | 'modes' | 'arena' | 'tutorial' | 'deck' | 'sandbox' | 'docs') => void;
}

export const GameModesScreen: React.FC<GameModesScreenProps> = ({
  currentDeck,
  onSelectMode,
  onOpenDeckBuilder,
  onNavigateTab,
}) => {
  // Вычисляем сумму звезд в текущей боевой четверке
  const squadCards = CARDS.filter(c => currentDeck.battleCardIds.includes(c.id));
  const squadStars = squadCards.reduce((acc, c) => acc + c.stars, 0);

  // Список режимов нашей игры, адаптированный под структуру скриншота
  const [modesList, setModesList] = useState<GameModeItem[]>([
    // PvE секция
    {
      id: 'training_bot',
      category: 'pve',
      title: 'TRAINING BOT',
      subtitle: 'Против ИИ · 4 раунда',
      description: 'Тренировочный бой против адаптивного ИИ. Выбор сложности, отработка инвестиций искр.',
      starLimit: 999, // Без ограничений для тренировок
      isActive: true,
      badgeType: 'bot',
      pinned: true,
    },
    // PvP секция
    {
      id: 'tourney_22',
      category: 'pvp',
      title: 'TOURNEY 22★',
      subtitle: 'Рейтинговый турнир',
      timerText: 'Заканчивается через 26м',
      description: 'Официальный турнирный формат. Лимит боевой четверки ровно до 22★. Награды в золоте и кристаллах.',
      starLimit: 22,
      isActive: true,
      badgeType: 'tournament',
      pinned: true,
    },
    {
      id: 'efc_format',
      category: 'pvp',
      title: 'EFC TACTICAL',
      subtitle: 'Формат ELO · Лимит 25★',
      description: 'Соревновательная лига с ранговой системой ELO. Лимит звезд до 25★. Доступ к картам ранга Master.',
      starLimit: 25,
      isActive: true,
      badgeType: 'elo',
      pinned: false,
    },
    {
      id: 'survivor_sparks',
      category: 'pvp',
      title: 'SURVIVOR',
      subtitle: 'Серия побед · Сквозные искры',
      description: 'Череда матчей на выбывание. Остаток не потраченных Квантовых Искр переходит в следующий бой!',
      starLimit: 25,
      isActive: true,
      badgeType: 'survivor',
      pinned: false,
    },
    {
      id: 'free_fight',
      category: 'pvp',
      title: 'FREE FIGHT',
      subtitle: 'Без ограничений (∞★)',
      description: 'Безлимитный режим. Допускаются любые карты 6★ без ограничений. Максимальный разгул суперспособностей!',
      starLimit: 999,
      isActive: true,
      badgeType: 'free',
      pinned: false,
    },
    {
      id: 'coliseum_33',
      category: 'pvp',
      title: 'COLISEUM 33★',
      subtitle: 'Еженедельные правила',
      description: 'Сверхтяжелый дивизион Титанов и Хаоса с лимитом до 33 звезд. Специальные мутаторы раундов.',
      starLimit: 33,
      isActive: true,
      badgeType: 'coliseum',
      pinned: false,
    },
    {
      id: 'team_draft',
      category: 'pvp',
      title: 'TEAM DRAFT 2v2',
      subtitle: '2v2 ELO format',
      description: 'Командный синхронный драфт с общим пулом Квантовых искр на дуэт игроков.',
      starLimit: 22,
      isActive: false, // Не активен (как на скриншоте)
      badgeType: 'team',
      pinned: false,
    },
  ]);

  const [incompatibleAlert, setIncompatibleAlert] = useState<{ modeTitle: string; limit: number } | null>(null);

  // Переключение закрепления (Pin)
  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playCardSelect();
    setModesList(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  };

  const handleCardClick = (mode: GameModeItem) => {
    if (!mode.isActive) return;

    // Проверяем совместимость по звездам
    const isCompatible = mode.starLimit === 999 || squadStars <= mode.starLimit;

    if (!isCompatible) {
      sound.playShield();
      setIncompatibleAlert({ modeTitle: mode.title, limit: mode.starLimit });
      return;
    }

    sound.playClash();
    onSelectMode(mode);
  };

  // Рендер стилизованной иконки/логотипа режима в стиле скриншота
  const renderModeBadge = (type: GameModeItem['badgeType']) => {
    switch (type) {
      case 'bot':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-lime-500 via-emerald-600 to-slate-900 border-2 border-lime-400 p-2 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(132,204,22,0.4)] shrink-0">
            <Bot className="w-7 h-7 text-white stroke-[2.5]" />
            <span className="text-[8px] font-black uppercase text-lime-200 tracking-tighter">BOT</span>
          </div>
        );
      case 'tournament':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 border-2 border-amber-300 p-2 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0">
            <Trophy className="w-7 h-7 text-slate-950 fill-amber-300 stroke-[2.5]" />
            <span className="text-[8px] font-black uppercase text-slate-950 tracking-tighter">TOURNEY</span>
          </div>
        );
      case 'elo':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-900 border-2 border-cyan-300 p-2 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0">
            <Swords className="w-7 h-7 text-white stroke-[2.5]" />
            <span className="text-[8px] font-black uppercase text-cyan-200 tracking-tighter">EFC</span>
          </div>
        );
      case 'survivor':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-red-700 to-slate-950 border-2 border-rose-400 p-2 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.5)] shrink-0">
            <Flame className="w-7 h-7 text-amber-300 fill-rose-500 stroke-[2.5]" />
            <span className="text-[8px] font-black uppercase text-rose-200 tracking-tighter">SURVIVOR</span>
          </div>
        );
      case 'free':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-red-600 to-slate-900 border-2 border-orange-400 p-2 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)] shrink-0">
            <Swords className="w-7 h-7 text-amber-200 stroke-[2.5]" />
            <span className="text-[8px] font-black uppercase text-white tracking-tighter">FREE</span>
          </div>
        );
      case 'coliseum':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border-2 border-slate-600 p-2 flex flex-col items-center justify-center shadow-md shrink-0">
            <ShieldAlert className="w-7 h-7 text-slate-300" />
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">COLISEUM</span>
          </div>
        );
      case 'team':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-slate-700 p-2 flex flex-col items-center justify-center opacity-70 shrink-0">
            <Users className="w-7 h-7 text-slate-400" />
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">2v2</span>
          </div>
        );
    }
  };

  const pveModes = modesList.filter(m => m.category === 'pve');
  const pvpModes = modesList.filter(m => m.category === 'pvp');

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative shadow-2xl border-x border-slate-900 font-sans select-none overflow-x-hidden">
      {/* =====================================================================
          1. ВЕРХНЯЯ ПАНЕЛЬ (TOP BAR - КАК НА СКРИНШОТЕ)
      ====================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-800 shadow-md">
        <div className="flex items-center justify-between gap-2">
          {/* Слева: Аватар и профиль */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 p-0.5 border-2 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0 flex items-center justify-center cursor-pointer">
              <span className="font-black text-2xl text-amber-200">?</span>
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-md font-mono">
                75
              </span>
            </div>

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

          {/* Справа: Счетчики ресурсов */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Квантовые искры */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-full border border-cyan-500/40 shadow-sm" title="Квантовые искры">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 fill-cyan-400 animate-pulse" />
              <span className="text-xs font-black font-mono text-cyan-300 tabular-nums">
                12
              </span>
            </div>

            {/* Золото */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-full border border-amber-500/30">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold font-mono text-amber-300 tabular-nums">
                20.9M
              </span>
            </div>

            {/* Кристаллы */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-full border border-purple-500/30">
              <Gem className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold font-mono text-purple-300 tabular-nums">
                109
              </span>
            </div>

            {/* Почта ✉️ */}
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 relative">
              <Mail className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
            </div>

            {/* Меню ☰ */}
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Menu className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. СПИСОК РЕЖИМОВ (ТОЧНО ПО СКРИНШОТУ С КАРТОЧКАМИ)
      ====================================================================== */}
      <main className="flex-1 px-3 py-3 space-y-4 pb-28">
        {/* Индикатор текущего состава боевой четверки */}
        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px]">Текущая боевая 4-ка:</span>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-white font-bold">{squadCards.length}/4 карт</span>
            <span>·</span>
            <span className="text-amber-400 font-bold">{squadStars}★ Сумма</span>
          </div>
        </div>

        {/* Секция: PvE */}
        <div className="space-y-2">
          {pveModes.map((mode) => {
            const isCompatible = mode.starLimit === 999 || squadStars <= mode.starLimit;
            return (
              <div
                key={mode.id}
                onClick={() => handleCardClick(mode)}
                className="relative rounded-2xl border border-lime-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-slate-950 p-3.5 flex items-center justify-between gap-3 shadow-lg hover:border-lime-400 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderModeBadge(mode.badgeType)}
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-white tracking-wide truncate">
                      {mode.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{mode.subtitle}</p>

                    {/* Чип совместимости */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide border flex items-center gap-1 ${
                        isCompatible
                          ? 'bg-lime-500/20 text-lime-300 border-lime-400/50'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/50'
                      }`}>
                        {isCompatible ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{isCompatible ? 'совместимо' : 'несовместимо'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                  <button 
                    type="button"
                    onClick={(e) => togglePin(mode.id, e)}
                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    <Pin className={`w-4 h-4 ${mode.pinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Секция: PvP Заголовок с иконкой как на скриншоте */}
        <div className="flex items-center gap-2 pt-1 text-sm font-black uppercase tracking-wider text-white px-1">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>PVP РЕЖИМЫ</span>
        </div>

        {/* Список PvP карточек */}
        <div className="space-y-3">
          {pvpModes.map((mode) => {
            const isCompatible = mode.starLimit === 999 || squadStars <= mode.starLimit;

            return (
              <div
                key={mode.id}
                onClick={() => handleCardClick(mode)}
                className={`relative rounded-2xl border transition-all p-3.5 flex items-center justify-between gap-3 shadow-lg select-none ${
                  !mode.isActive
                    ? 'opacity-60 bg-slate-950/80 border-slate-800/60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] cursor-pointer hover:scale-[1.01]'
                }`}
              >
                {/* Левая часть: 3D Логотип + Названия + Чипы */}
                <div className="flex items-center gap-3 min-w-0">
                  {renderModeBadge(mode.badgeType)}

                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-white tracking-wide truncate">
                      {mode.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{mode.subtitle}</p>

                    {/* Таймер если есть */}
                    {mode.timerText && (
                      <p className="text-[11px] text-amber-300 font-medium mt-0.5">
                        {mode.timerText}
                      </p>
                    )}

                    {/* Чип совместимости или статус неактивности */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {mode.isActive ? (
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide border flex items-center gap-1 ${
                          isCompatible
                            ? 'bg-lime-500/20 text-lime-300 border-lime-400/50'
                            : 'bg-rose-500/20 text-rose-300 border-rose-400/50'
                        }`}>
                          {isCompatible ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{isCompatible ? 'совместимо' : 'несовместимо'}</span>
                          {mode.starLimit !== 999 && (
                            <span className="opacity-80">({squadStars}/{mode.starLimit}★)</span>
                          )}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-500">
                          Сейчас не активен
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Правая часть: Pin и Chevron */}
                <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                  <button 
                    type="button"
                    onClick={(e) => togglePin(mode.id, e)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Pin className={`w-4 h-4 ${mode.pinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  {mode.isActive && (
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* =====================================================================
          3. НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (ТОЧНО ПО СКРИНШОТУ)
          - Кнопки: Рынок / Кол-ция / Центральная круглая Главная / Миссии / Магазин
      ====================================================================== */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
        <div className="flex items-end justify-around relative">
          {/* Кнопка 1: Колода / Кол-ция */}
          <button
            type="button"
            onClick={() => onNavigateTab('deck')}
            className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer group"
          >
            <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold mt-1">Кол-ция</span>
          </button>

          {/* Кнопка 2: Обучение / Миссии */}
          <button
            type="button"
            onClick={() => onNavigateTab('tutorial')}
            className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer group"
          >
            <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold mt-1">Миссии</span>
          </button>

          {/* Кнопка 3: ЦЕНТРАЛЬНАЯ КРУГЛАЯ ЗОЛОТАЯ КНОПКА (ГЛАВНАЯ / РЕЖИМЫ) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={() => onNavigateTab('hub')}
              className="w-15 h-15 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 font-black flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] border-3 border-slate-950 cursor-pointer hover:scale-110 active:scale-95 transition-all"
              title="Главный экран"
            >
              <Swords className="w-7 h-7 stroke-[2.5]" />
            </button>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 mt-1 font-mono">
              Режимы
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

          {/* Кнопка 5: GDD Документация */}
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

      {/* Модальное окно предупреждения о несовместимости звездного лимита */}
      {incompatibleAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/50 rounded-2xl p-5 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">
                Колода Несовместима с {incompatibleAlert.modeTitle}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Лимит режима составляет <strong className="text-rose-400 font-mono">{incompatibleAlert.limit}★</strong>, 
                а в вашей текущей боевой четвёрке <strong className="text-amber-400 font-mono">{squadStars}★</strong>.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIncompatibleAlert(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => {
                  setIncompatibleAlert(null);
                  onOpenDeckBuilder();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-bold shadow-lg cursor-pointer"
              >
                Настроить Колоду
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
