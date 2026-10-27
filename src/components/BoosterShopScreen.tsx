/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, Coins, Gem, Sparkles, Star, Shield, Sword, Check, ArrowRight, Zap, RefreshCw, ShoppingCart } from 'lucide-react';
import { Card, ClanId } from '../types/game';
import { CARDS } from '../data/cards';
import { CLANS } from '../data/clans';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';

interface BoosterShopScreenProps {
  playerCredits: number;
  playerCrystals: number;
  onPurchaseBooster: (costCredits: number, costCrystals: number, cardsAdded: Card[]) => void;
  onOpenDeckBuilder?: () => void;
  onBackToHub?: () => void;
}

export interface BoosterPackInfo {
  id: string;
  name: string;
  cardCount: number;
  costCredits: number;
  costCrystals: number;
  minStars: number;
  maxStars: number;
  description: string;
  badge: string;
  clanExclusive?: ClanId;
}

const BOOSTER_PACKS: BoosterPackInfo[] = [
  {
    id: 'pack_starter',
    name: 'Базовый Бустер',
    cardCount: 3,
    costCredits: 3000,
    costCrystals: 0,
    minStars: 1,
    maxStars: 4,
    description: '3 случайные карты для расширения базовой коллекции новобранцев.',
    badge: 'Для новичков',
  },
  {
    id: 'pack_clan_synthesis',
    name: 'Клановый Синтез',
    cardCount: 3,
    costCredits: 7500,
    costCrystals: 0,
    minStars: 2,
    maxStars: 5,
    description: '3 карты повышенной мощности с гарантированной синергией кланов.',
    badge: 'Популярный',
  },
  {
    id: 'pack_efc_elite',
    name: 'Элитный Пак EFC',
    cardCount: 4,
    costCredits: 0,
    costCrystals: 45,
    minStars: 4,
    maxStars: 5,
    description: '4 турнирные карты высокой редкости. Гарантирован минимум 1 боец 5★.',
    badge: 'Рейтинг ELO',
  },
  {
    id: 'pack_olympus_legend',
    name: 'Легенды Олимпа',
    cardCount: 5,
    costCredits: 0,
    costCrystals: 90,
    minStars: 5,
    maxStars: 6,
    description: '5 карт высшего дивизиона. Высокий шанс выпадения флагманов 6★!',
    badge: 'Элитный Донат',
  },
];

// Витрина рынка карт (Marketplace)
const MARKETPLACE_CARDS = [
  { cardId: 'chrono_inverter', priceCredits: 8000, seller: 'CyberDealer' },
  { cardId: 'phase_cleaver', priceCredits: 12000, seller: 'AstralMaster' },
  { cardId: 'goliath_vanguard', priceCredits: 10000, seller: 'TitanForge' },
  { cardId: 'nightfall_assassin', priceCredits: 11000, seller: 'ShadowGuild' },
];

export const BoosterShopScreen: React.FC<BoosterShopScreenProps> = ({
  playerCredits,
  playerCrystals,
  onPurchaseBooster,
  onOpenDeckBuilder,
  onBackToHub,
}) => {
  const [activeTab, setActiveTab] = useState<'boosters' | 'market'>('boosters');
  const [unpackedCards, setUnpackedCards] = useState<Card[] | null>(null);
  const [currentPackName, setCurrentPackName] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  // Открытие бустера
  const handleBuyPack = (pack: BoosterPackInfo) => {
    if (playerCredits < pack.costCredits || playerCrystals < pack.costCrystals) {
      showNotification('Недостаточно ресурсов для покупки этого бустера!');
      return;
    }

    sound.playVictory();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

    // Генерируем случайные карты по лимиту звезд бустера
    const pool = CARDS.filter(c => c.stars >= pack.minStars && c.stars <= pack.maxStars);
    const chosen: Card[] = [];
    const available = pool.length > 0 ? [...pool] : [...CARDS];

    for (let i = 0; i < pack.cardCount; i++) {
      const idx = Math.floor(Math.random() * available.length);
      chosen.push(available[idx] || CARDS[0]);
    }

    setCurrentPackName(pack.name);
    setUnpackedCards(chosen);
    onPurchaseBooster(pack.costCredits, pack.costCrystals, chosen);
  };

  // Покупка на рынке
  const handleBuyMarketCard = (card: Card, price: number) => {
    if (playerCredits < price) {
      showNotification('Недостаточно кредитов для покупки карты на рынке!');
      return;
    }
    sound.playVictory();
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    onPurchaseBooster(price, 0, [card]);
    showNotification(`Карта «${card.name}» успешно приобретена и добавлена в вашу коллекцию!`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 font-sans select-none space-y-4">
      {/* Верхняя навигация и кнопка возврата в Хаб */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {onBackToHub && (
          <button
            type="button"
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <span>⬅ Назад в Хаб</span>
          </button>
        )}

        {statusNotice && (
          <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold animate-pulse">
            {statusNotice}
          </div>
        )}
      </div>

      {/* Шапка магазина с балансом */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-xs font-mono font-bold uppercase">
              Торговая Палата
            </span>
            <span className="text-xs text-slate-400 font-mono">Олимп Сектор 7</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
            Магазин Бустеров & Рынок Карт
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-0.5">
            Пополняйте коллекцию новыми персонажами через бустерпаки за игровые кредиты и донатные кристаллы или приобретайте конкретные карты на открытом рынке.
          </p>
        </div>

        {/* Счетчики баланса игрока */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl shadow-md shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-amber-500/30">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 tabular-nums">
              {playerCredits.toLocaleString('ru-RU')}
            </span>
            <span className="text-[10px] text-slate-500">КР</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-purple-500/30">
            <Gem className="w-4 h-4 text-purple-400" />
            <span className="font-mono text-xs sm:text-sm font-bold text-purple-300 tabular-nums">
              {playerCrystals}
            </span>
            <span className="text-[10px] text-slate-500">КРИСТ</span>
          </div>
        </div>
      </div>

      {/* Вкладки: Бустерпаки / Рынок */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('boosters')}
          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors ${
            activeTab === 'boosters'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Бустерпаки (Пакеты Карт)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors ${
            activeTab === 'market'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Рынок Карт (Аукцион)
        </button>
      </div>

      {/* ================= 1. БУСТЕРПАКИ ================= */}
      {activeTab === 'boosters' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BOOSTER_PACKS.map((pack) => {
            const canAfford = playerCredits >= pack.costCredits && playerCrystals >= pack.costCrystals;

            return (
              <div
                key={pack.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-400/60 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden group"
              >
                {/* Фоновый блик */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-amber-400 border border-slate-700">
                      {pack.badge}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      {pack.cardCount} карты
                    </span>
                  </div>

                  {/* Иконка пака */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-slate-950 border border-white/10 flex items-center justify-center text-amber-400 mx-auto my-3 shadow-inner group-hover:scale-110 transition-transform">
                    <Package className="w-8 h-8" />
                  </div>

                  <h3 className="font-black text-lg text-white text-center">{pack.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-amber-300 font-mono my-1">
                    <span>Редкость: {pack.minStars}★ — {pack.maxStars}★</span>
                  </div>

                  <p className="text-xs text-slate-400 text-center mt-2 leading-relaxed">
                    {pack.description}
                  </p>
                </div>

                {/* Цена и кнопка покупки */}
                <div className="mt-5 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-center gap-2 mb-2 font-mono font-bold text-sm">
                    {pack.costCredits > 0 && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Coins className="w-4 h-4 text-amber-400" />
                        {pack.costCredits.toLocaleString('ru-RU')}
                      </span>
                    )}
                    {pack.costCrystals > 0 && (
                      <span className="flex items-center gap-1 text-purple-300">
                        <Gem className="w-4 h-4 text-purple-400" />
                        {pack.costCrystals}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleBuyPack(pack)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer transition-transform hover:scale-102"
                  >
                    Открыть Бустер ✦
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= 2. РЫНОК КАРТ ================= */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Здесь бойцы Олимпа выставляют дубликаты карт. Вы можете мгновенно купить нужного персонажа за кредиты:</span>
            {onOpenDeckBuilder && (
              <button
                type="button"
                onClick={onOpenDeckBuilder}
                className="text-amber-400 hover:underline font-bold"
              >
                Моя Коллекция &rsaquo;
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {MARKETPLACE_CARDS.map((item) => {
              const card = CARDS.find(c => c.id === item.cardId);
              if (!card) return null;
              const clan = CLANS[card.clanId];

              return (
                <div
                  key={item.cardId}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                      <span>Продавец: {item.seller}</span>
                      <span className="text-amber-400 font-bold">{card.stars}★</span>
                    </div>

                    <div className="w-full h-32 rounded-xl overflow-hidden relative mb-2">
                      <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                      <div className="absolute bottom-1 left-2 font-black text-xs text-white uppercase">{card.name}</div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mb-2">
                      Клан: {clan?.name} · Сила {card.basePower} / Урон {card.baseDamage}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-amber-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-400" /> {item.priceCredits.toLocaleString('ru-RU')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBuyMarketCard(card, item.priceCredits)}
                      className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase cursor-pointer"
                    >
                      Купить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= МОДАЛКА РАСПАКОВКИ БУСТЕРА ================= */}
      {unpackedCards && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-center shadow-[0_0_60px_rgba(245,158,11,0.5)]">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-1">
              Бустер «{currentPackName}» открыт!
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Получено {unpackedCards.length} новых карт в вашу боевую коллекцию:
            </p>

            {/* Выпавшие карты */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              {unpackedCards.map((card, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-2xl bg-slate-950 border-2 border-amber-400/80 shadow-lg flex flex-col justify-between animate-bounce"
                  style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }}
                >
                  <div className="w-full h-28 rounded-xl overflow-hidden relative">
                    <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-black text-xs text-white uppercase truncate">{card.name}</div>
                    <div className="flex items-center justify-center gap-0.5 text-amber-400 my-0.5">
                      {Array.from({ length: card.stars }).map((_, s) => (
                        <Star key={s} className="w-2.5 h-2.5 fill-current" />
                      ))}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Сила {card.basePower} / Урон {card.baseDamage}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setUnpackedCards(null)}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Отлично, продолжить
              </button>
              {onOpenDeckBuilder && (
                <button
                  type="button"
                  onClick={() => {
                    setUnpackedCards(null);
                    onOpenDeckBuilder();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Перейти в Конструктор Колод
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
