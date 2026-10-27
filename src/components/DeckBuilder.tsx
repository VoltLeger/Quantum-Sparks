/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Shield, 
  Zap, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  SlidersHorizontal, 
  Star, 
  Coins, 
  Gem, 
  Mail, 
  Menu, 
  Grid3X3, 
  Grid2X2, 
  ChevronRight, 
  Bookmark, 
  Check, 
  RotateCcw,
  Trophy,
  Swords
} from 'lucide-react';
import { Card, ClanId, Deck, StarLimitTier } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { CardView } from './CardView';
import { sound } from '../logic/sound';

interface DeckBuilderProps {
  currentDeck: Deck;
  onSaveDeck: (updatedDeck: Deck) => void;
  onNavigateTab?: (tab: 'hub' | 'modes' | 'arena' | 'tutorial' | 'deck' | 'sandbox' | 'docs') => void;
}

// Режимы игры, для которых создаются индивидуальные колоды
export interface ModePresetConfig {
  modeId: string;
  name: string;
  starLimit: StarLimitTier;
  recommendedDeckCardIds: string[];
  recommendedBattleCardIds: string[];
  description: string;
}

export const MODE_DECK_PRESETS: ModePresetConfig[] = [
  {
    modeId: 'tourney_22',
    name: 'TOURNEY 22★',
    starLimit: 22,
    recommendedDeckCardIds: [
      'chrono_inverter',      // 4★
      'phase_cleaver',        // 5★
      'harmonic_resonator',   // 6★
      'hammer_crusher',       // 3★
      'bastion_recruit',      // 2★
      'micro_drone',          // 1★
    ],
    recommendedBattleCardIds: [
      'chrono_inverter',      // 4★
      'phase_cleaver',        // 5★
      'harmonic_resonator',   // 6★
      'hammer_crusher',       // 3★
    ], // Ровно 18 звезд (вписывается в 22★!)
    description: 'Официальный турнирный баланс. Лимит боевой четверки строго до 22★.',
  },
  {
    modeId: 'efc_25',
    name: 'EFC 25★',
    starLimit: 25,
    recommendedDeckCardIds: [
      'phase_cleaver',        // 5★
      'nightfall_assassin',   // 5★
      'goliath_vanguard',     // 5★
      'harmonic_resonator',   // 6★
      'void_siphon',          // 4★
      'cyber_synthesizer',    // 3★
    ],
    recommendedBattleCardIds: [
      'phase_cleaver',        // 5★
      'nightfall_assassin',   // 5★
      'goliath_vanguard',     // 5★
      'harmonic_resonator',   // 6★
    ], // Ровно 21 звезда (вписывается в 25★!)
    description: 'Рейтинговый формат ELO. Лимит звезд до 25★.',
  },
  {
    modeId: 'coliseum_33',
    name: 'COLISEUM 33★',
    starLimit: 33,
    recommendedDeckCardIds: [
      'harmonic_resonator',   // 6★
      'chaos_dreadnought',    // 6★
      'nanite_overmind',      // 6★
      'goliath_vanguard',     // 5★
      'phase_cleaver',        // 5★
      'chrono_inverter',      // 4★
    ],
    recommendedBattleCardIds: [
      'harmonic_resonator',   // 6★
      'chaos_dreadnought',    // 6★
      'nanite_overmind',      // 6★
      'goliath_vanguard',     // 5★
    ], // 23 звезды (вписывается в 33★!)
    description: 'Сверхтяжелый дивизион Титанов и Хаоса (до 33★).',
  },
  {
    modeId: 'free_fight',
    name: 'FREE FIGHT ∞★',
    starLimit: 999,
    recommendedDeckCardIds: [
      'chaos_dreadnought',    // 6★
      'harmonic_resonator',   // 6★
      'nanite_overmind',      // 6★
      'phase_cleaver',        // 5★
      'goliath_vanguard',     // 5★
      'chrono_inverter',      // 4★
    ],
    recommendedBattleCardIds: [
      'chaos_dreadnought',    // 6★
      'harmonic_resonator',   // 6★
      'nanite_overmind',      // 6★
      'phase_cleaver',        // 5★
    ],
    description: 'Полный безлимит. Разрешены любые карты 6★ без ограничений!',
  },
  {
    modeId: 'survivor',
    name: 'SURVIVOR 25★',
    starLimit: 25,
    recommendedDeckCardIds: [
      'chrono_inverter',      // 4★ (вампиризм искр!)
      'nanite_overmind',      // 6★
      'void_siphon',          // 4★ (вампиризм HP!)
      'cyber_synthesizer',    // 3★ (рекуперация искр!)
      'hammer_crusher',       // 3★
      'bastion_recruit',      // 2★
    ],
    recommendedBattleCardIds: [
      'chrono_inverter',      // 4★
      'nanite_overmind',      // 6★
      'void_siphon',          // 4★
      'cyber_synthesizer',    // 3★
    ],
    description: 'Режим выживания с экономией и вампиризмом Квантовых Искр.',
  },
];

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  currentDeck,
  onSaveDeck,
  onNavigateTab,
}) => {
  // Активная под-вкладка (Альбом / Предустановки под режимы / Витрина)
  const [activeSubTab, setActiveSubTab] = useState<'album' | 'presets' | 'showcase'>('album');

  // Выбранный режим для колоды
  const [activeModePresetId, setActiveModePresetId] = useState<string>('tourney_22');

  // Состояние текущей редактируемой колоды
  const [deckCardIds, setDeckCardIds] = useState<string[]>(currentDeck.cardIds);
  const [battleCardIds, setBattleCardIds] = useState<string[]>(currentDeck.battleCardIds);
  const [starLimit, setStarLimit] = useState<StarLimitTier>(currentDeck.starLimit);

  // Фильтры и переключатели (как на скриншоте)
  const [selectedClanFilter, setSelectedClanFilter] = useState<ClanId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyDeckToggle, setOnlyDeckToggle] = useState<boolean>(false);
  const [gridCols, setGridCols] = useState<2 | 3>(3);

  // Расчет характеристик текущей колоды
  const deckCards = CARDS.filter(c => deckCardIds.includes(c.id));
  const battleCards = CARDS.filter(c => battleCardIds.includes(c.id));

  const totalDeckStars = deckCards.reduce((acc, c) => acc + c.stars, 0);
  const totalBattleStars = battleCards.reduce((acc, c) => acc + c.stars, 0);

  // Проверка правил
  const isDeckSizeValid = deckCardIds.length >= 6 && deckCardIds.length <= 11;
  const isBattleSquadValid = battleCardIds.length === 4;
  const isStarLimitValid = starLimit === 999 || totalBattleStars <= starLimit;
  const canSave = isDeckSizeValid && isBattleSquadValid && isStarLimitValid;

  // Клик по карте в альбоме: добавление/удаление
  const handleCardClick = (card: Card) => {
    sound.playCardSelect();
    const inDeck = deckCardIds.includes(card.id);
    const inBattle = battleCardIds.includes(card.id);

    if (inBattle) {
      // Убираем из боевой четверки
      setBattleCardIds(prev => prev.filter(id => id !== card.id));
    } else if (inDeck) {
      // Если уже в колоде, но не в 4-ке: добавляем в 4-ку (если есть место)
      if (battleCardIds.length < 4) {
        setBattleCardIds(prev => [...prev, card.id]);
      } else {
        // Либо убираем совсем из колоды
        setDeckCardIds(prev => prev.filter(id => id !== card.id));
      }
    } else {
      // Добавляем в колоду (максимум 11)
      if (deckCardIds.length < 11) {
        setDeckCardIds(prev => [...prev, card.id]);
        if (battleCardIds.length < 4) {
          setBattleCardIds(prev => [...prev, card.id]);
        }
      }
    }
  };

  // Применение пресета под выбранный режим
  const handleApplyModePreset = (preset: ModePresetConfig) => {
    sound.playCardSelect();
    setActiveModePresetId(preset.modeId);
    setDeckCardIds(preset.recommendedDeckCardIds);
    setBattleCardIds(preset.recommendedBattleCardIds);
    setStarLimit(preset.starLimit);
  };

  const handleSave = () => {
    if (!canSave) return;
    sound.playVictory();
    onSaveDeck({
      ...currentDeck,
      cardIds: deckCardIds,
      battleCardIds: battleCardIds,
      starLimit,
    });
  };

  // Фильтрация каталога
  const filteredCards = CARDS.filter(c => {
    // Переключатель "Только карты из колоды"
    if (onlyDeckToggle && !deckCardIds.includes(c.id)) {
      return false;
    }
    // Фильтр по клану
    if (selectedClanFilter !== 'all' && c.clanId !== selectedClanFilter) {
      return false;
    }
    // Поисковая строка (имя, умение, лор)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchAbility = c.ability.name.toLowerCase().includes(q) || c.ability.description.toLowerCase().includes(q);
      const matchClan = CLANS[c.clanId].name.toLowerCase().includes(q);
      if (!matchName && !matchAbility && !matchClan) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative font-sans select-none space-y-4">
      {/* =====================================================================
          1. ВЕРХНЯЯ ПАНЕЛЬ С КНОПКОЙ «НАЗАД В ХАБ» И СТАТУСОМ
      ====================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('hub')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Назад в Хаб</span>
            </button>
          )}

          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Конструктор Колод</span>
            </h2>
            <div className="text-[11px] text-slate-400 font-mono">
              В колоде: <strong className="text-white">{deckCardIds.length}</strong>/11 · Отряд: <strong className="text-cyan-300">{battleCardIds.length}</strong>/4 · Звезды: <strong className="text-amber-400">{totalBattleStars}</strong>/{starLimit === 999 ? '∞' : starLimit}★
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wide cursor-pointer transition-all shadow-md flex items-center gap-1.5"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Сохранить и В Бой</span>
        </button>
      </div>

      {/* =====================================================================
          2. ПОД-ВКЛАДКИ (АЛЬБОМ / ПРЕДУСТАНОВКИ / ВИТРИНА)
      ====================================================================== */}
      <div className="px-3 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('album')}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'album'
              ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Альбом
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('presets')}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'presets'
              ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Предустановки Режимов</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('showcase')}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'showcase'
              ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Боевая 4-ка ({battleCardIds.length}/4)
        </button>
      </div>

      {/* =====================================================================
          3. ПАНЕЛЬ ФИЛЬТРОВ И ПОИСКА (КАК НА СКРИНШОТЕ)
      ====================================================================== */}
      <div className="px-3 pt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Фильтр кланов */}
          <select
            value={selectedClanFilter}
            onChange={e => setSelectedClanFilter(e.target.value as ClanId | 'all')}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">Все кланы ({CARDS.length})</option>
            {Object.values(CLANS).map(cl => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
              </option>
            ))}
          </select>

          {/* Переключатель колонок (2 или 3) */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setGridCols(2)}
              className={`p-1.5 rounded ${gridCols === 2 ? 'bg-slate-800 text-amber-400' : 'text-slate-500'}`}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setGridCols(3)}
              className={`p-1.5 rounded ${gridCols === 3 ? 'bg-slate-800 text-amber-400' : 'text-slate-500'}`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Переключатель: Колода (Вкл/Выкл) точно по скриншоту! */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
            <span className="text-[11px] font-bold text-slate-300">Колода</span>
            <button
              type="button"
              onClick={() => setOnlyDeckToggle(!onlyDeckToggle)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                onlyDeckToggle ? 'bg-amber-400' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                  onlyDeckToggle ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Поисковая строка */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Ищи персонажа, способность, бонус..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          4. ИНФОРМАЦИОННЫЙ СТАТУС БОЕВОЙ ЧЕТВЕРКИ И ЛИМИТА
      ====================================================================== */}
      <div className="px-3 pt-2">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Режим:</span>
              <strong className="text-amber-400 font-mono">
                {starLimit === 999 ? 'FREE FIGHT (∞★)' : `Лимит ${starLimit}★`}
              </strong>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              В колоде: <strong className="text-white">{deckCardIds.length}</strong>/11 карт · Боевых: <strong className="text-amber-300">{battleCardIds.length}</strong>/4
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-sm font-black tabular-nums">
              <span className={isStarLimitValid ? 'text-amber-400' : 'text-rose-400'}>
                {totalBattleStars}★
              </span>
              <span className="text-slate-500 text-xs"> / {starLimit === 999 ? '∞' : `${starLimit}★`}</span>
            </div>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="mt-1 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] uppercase disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-transform hover:scale-105"
            >
              Сохранить
            </button>
          </div>
        </div>

        {/* Строка статуса Клановых Бонусов (Правило: ≥2 карт одного клана в 4-ке) */}
        {(() => {
          const battleCards = battleCardIds.map(id => CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
          const counts: Record<string, number> = {};
          battleCards.forEach(c => { counts[c.clanId] = (counts[c.clanId] || 0) + 1; });
          const entries = Object.entries(counts);
          if (entries.length === 0) return null;
          return (
            <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] flex items-center justify-between gap-2 flex-wrap">
              <span className="text-slate-400">Бонус Клана (активен при ≥2 карт):</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {entries.map(([cId, count]) => {
                  const clan = CLANS[cId as ClanId];
                  const isActive = count >= 2;
                  return (
                    <span
                      key={cId}
                      className={`px-2 py-0.5 rounded font-mono font-bold border flex items-center gap-1 ${
                        isActive
                          ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60 shadow-xs'
                          : 'bg-slate-950/80 text-slate-500 border-slate-800 line-through'
                      }`}
                      title={isActive ? `Бонус активен: ${clan?.mathBonusDescription}` : `Бонус неактивен: в 4-ке только ${count} карта. Нужно минимум 2 карты этого клана.`}
                    >
                      <span>{clan?.name}: {count}/4</span>
                      <span className="text-[9px]">{isActive ? '✓ Вкл' : '✕ Выкл'}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* =====================================================================
          5. КОНТЕНТ ВКЛАДКИ: ПРЕДУСТАНОВКИ РЕЖИМОВ
      ====================================================================== */}
      {activeSubTab === 'presets' && (
        <div className="px-3 py-3 space-y-3 pb-28">
          <div className="text-xs text-slate-400 px-1 font-medium">
            Выберите готовый состав или настройте уникальную колоду под конкретный турнирный регламент:
          </div>

          <div className="space-y-2.5">
            {MODE_DECK_PRESETS.map((preset) => {
              const isSelected = activeModePresetId === preset.modeId;
              return (
                <div
                  key={preset.modeId}
                  onClick={() => handleApplyModePreset(preset)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        {preset.starLimit === 999 ? 'БЕЗЛИМИТ' : `ДО ${preset.starLimit}★`}
                      </span>
                      <h4 className="font-extrabold text-sm text-white">{preset.name}</h4>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {preset.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Карты: {preset.recommendedBattleCardIds.length} боевых</span>
                    <span className="text-amber-400 font-bold">Применить &rsaquo;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          6. КОНТЕНТ ВКЛАДКИ: БОЕВАЯ ЧЕТВЕРКА (ВИТРИНА)
      ====================================================================== */}
      {activeSubTab === 'showcase' && (
        <div className="px-3 py-3 space-y-3 pb-28">
          <div className="text-xs text-slate-400 px-1 font-medium">
            4 активных персонажа для 4 раундов боя. Нажмите на карту, чтобы исключить её из состава:
          </div>

          <div className="grid grid-cols-2 gap-3">
            {battleCards.map(c => (
              <div key={c.id} className="relative">
                <CardView card={c} isSelected onClick={() => handleCardClick(c)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          7. КОНТЕНТ ВКЛАДКИ: АЛЬБОМ КАРТ (3-КОЛОНОЧНЫЙ ГРИД ПО СКРИНШОТУ)
      ====================================================================== */}
      {activeSubTab === 'album' && (
        <div className="flex-1 px-3 py-3 pb-28">
          {filteredCards.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              Карты по выбранным фильтрам не найдены.
            </div>
          ) : (
            <div 
              className={`grid gap-2.5 ${
                gridCols === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {filteredCards.map((card) => {
                const inDeck = deckCardIds.includes(card.id);
                const inBattle = battleCardIds.includes(card.id);

                return (
                  <div key={card.id} className="relative">
                    <CardView
                      card={card}
                      isSelected={inBattle}
                      onClick={() => handleCardClick(card)}
                    />

                    {/* Индикатор нахождения в колоде (если не в боевой 4-ке) */}
                    {inDeck && !inBattle && (
                      <span className="absolute top-8 right-1 px-1 py-0.2 bg-slate-950/90 text-amber-300 border border-amber-400/50 rounded text-[8px] font-bold font-mono">
                        В колоде
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          8. НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (BOTTOM BAR)
      ====================================================================== */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
        <div className="flex items-end justify-around relative">
          <button
            type="button"
            onClick={() => setActiveSubTab('album')}
            className={`flex flex-col items-center justify-center p-1 transition-colors cursor-pointer ${
              activeSubTab === 'album' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Альбом</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('presets')}
            className={`flex flex-col items-center justify-center p-1 transition-colors cursor-pointer ${
              activeSubTab === 'presets' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Пресеты</span>
          </button>

          {/* Центральная золотая кнопка PLAY / СОХРАНИТЬ */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={handleSave}
              className="w-15 h-15 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 font-black flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] border-3 border-slate-950 cursor-pointer hover:scale-110 active:scale-95 transition-all"
              title="Сохранить колоду"
            >
              <Swords className="w-7 h-7 stroke-[2.5]" />
            </button>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 mt-1 font-mono">
              В Бой
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubTab('showcase')}
            className={`flex flex-col items-center justify-center p-1 transition-colors cursor-pointer ${
              activeSubTab === 'showcase' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">4-ка ({battleCardIds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onSaveDeck({ ...currentDeck, cardIds: deckCardIds, battleCardIds, starLimit })}
            className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Готово</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
