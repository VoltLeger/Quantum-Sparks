/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Code2, Sparkles, BookOpen, Layers, Copy, Check, Shield, Zap } from 'lucide-react';
import { CLANS } from '../data/clans';

export const TechDocumentation: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [docTab, setDocTab] = useState<'schemas' | 'resolver' | 'cards' | 'tutorial_script' | 'balance'>('schemas');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cardJsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Card",
    type: "object",
    required: ["id", "name", "clanId", "stars", "basePower", "baseDamage", "ability"],
    properties: {
      id: { type: "string", description: "Уникальный строковый идентификатор карты" },
      name: { type: "string", description: "Отображаемое название карты" },
      clanId: {
        type: "string",
        enum: ["titans", "astral_guardians", "technocrats", "shadow_walkers", "syndicate_of_chaos"],
        description: "Принадлежность к одному из 5 кланов"
      },
      stars: {
        type: "integer",
        minimum: 1,
        maximum: 6,
        description: "Редкость и сила карты (1★ - 6★)"
      },
      basePower: {
        type: "integer",
        minimum: 1,
        description: "Базовая Сила (Защита / Здоровье карты)"
      },
      baseDamage: {
        type: "integer",
        minimum: 0,
        description: "Базовый Урон (Атака карты)"
      },
      ability: {
        type: "object",
        required: ["id", "name", "timing", "description", "mathFormulaDescription"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          timing: { type: "string", enum: ["defensive", "offensive", "passive"] },
          description: { type: "string" },
          mathFormulaDescription: { type: "string" }
        }
      },
      artworkKeyword: { type: "string" },
      lore: { type: "string" }
    }
  };

  const clanJsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Clan",
    type: "object",
    required: ["id", "name", "motto", "color", "mathBonusDescription"],
    properties: {
      id: {
        type: "string",
        enum: ["titans", "astral_guardians", "technocrats", "shadow_walkers", "syndicate_of_chaos"]
      },
      name: { type: "string" },
      motto: { type: "string" },
      color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
      description: { type: "string" },
      mathBonusDescription: { type: "string" }
    }
  };

  const deckJsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Deck",
    type: "object",
    required: ["id", "name", "cardIds", "battleCardIds", "starLimit"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      cardIds: {
        type: "array",
        items: { type: "string" },
        minItems: 6,
        maxItems: 11,
        description: "Колода игрока: от 6 до 11 карт"
      },
      battleCardIds: {
        type: "array",
        items: { type: "string" },
        minItems: 4,
        maxItems: 4,
        description: "Ровно 4 карты, отобранные для текущего 4-раундового матча"
      },
      starLimit: {
        type: "integer",
        enum: [22, 25, 33, 999],
        description: "Ограничение по сумме звезд (22★, 25★, 33★ или 999=Безлимит)"
      }
    }
  };

  const playerProfileJsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "PlayerProfile",
    type: "object",
    required: ["id", "username", "ratingElo", "unlockedCardIds", "decks", "activeDeckId", "stats"],
    properties: {
      id: { type: "string" },
      username: { type: "string" },
      ratingElo: { type: "integer", minimum: 0 },
      unlockedCardIds: { type: "array", items: { type: "string" } },
      decks: { type: "array", items: { $ref: "#/definitions/Deck" } },
      activeDeckId: { type: "string" },
      stats: {
        type: "object",
        properties: {
          matchesPlayed: { type: "integer" },
          victories: { type: "integer" },
          draws: { type: "integer" },
          defeats: { type: "integer" },
          totalSparksInvested: { type: "integer" }
        }
      }
    }
  };

  const resolverCodeSnippet = `// Точная реализация боевого резолвера с 5-фазной очерёдностью
export function resolve_round(
  player1_card: Card,
  player1_sparks: number,
  player2_card: Card,
  player2_sparks: number,
  roundNumber: number = 1
): RoundResolutionResult {
  // ФАЗА 1: ВСКРЫТИЕ КАРТ (Snapshot базовых параметров)
  let p1Power = player1_card.basePower;
  let p1Damage = player1_card.baseDamage;
  let p2Power = player2_card.basePower;
  let p2Damage = player2_card.baseDamage;

  // ФАЗА 2: ПАССИВНЫЕ БОНУСЫ КЛАНОВ (Баффы -> Дебаффы)
  // 2.1. Баффы своих карт:
  if (player1_card.clanId === 'titans') { p1Power += 2; p1Damage += 2; }
  if (player2_card.clanId === 'titans') { p2Power += 2; p2Damage += 2; }
  if (player1_card.clanId === 'syndicate_of_chaos') { p1Damage += player1_card.stars; }
  if (player2_card.clanId === 'syndicate_of_chaos') { p2Damage += player2_card.stars; }

  // 2.2. Дебаффы врага:
  if (player1_card.clanId === 'astral_guardians') { p2Power = Math.max(1, p2Power - 2); }
  if (player2_card.clanId === 'astral_guardians') { p1Power = Math.max(1, p1Power - 2); }
  if (player1_card.clanId === 'shadow_walkers') { p2Damage = Math.max(4, p2Damage - 10); }
  if (player2_card.clanId === 'shadow_walkers') { p1Damage = Math.max(4, p1Damage - 10); }

  // ФАЗА 3: ТРАТА КВАНТОВЫХ ИСКР (+1 к Силе, +2 к Урону за искру)
  p1Power += player1_sparks * 1;
  p1Damage += player1_sparks * 2;
  p2Power += player2_sparks * 1;
  p2Damage += player2_sparks * 2;

  // ФАЗА 4: АКТИВАЦИЯ УМЕНИЙ КАРТ (Защитные -> Атакующие)
  // 4.1. Защитные:
  if (player1_card.ability.id === 'quantum_transposition' && p1Power > p1Damage) {
    [p1Power, p1Damage] = [p1Damage, p1Power]; // Обмен Силы и Урона!
  }
  if (player2_card.ability.id === 'quantum_transposition' && p2Power > p2Damage) {
    [p2Power, p2Damage] = [p2Damage, p2Power];
  }

  // 4.2. Атакующие:
  let p1Piercing = player1_card.ability.id === 'phase_pierce' && player1_sparks >= 4;
  let p2Piercing = player2_card.ability.id === 'phase_pierce' && player2_sparks >= 4;

  if (player1_card.ability.id === 'harmonic_overdrive' && p1Power > p2Power) {
    p1Damage = Math.floor(p1Damage * 2.5); // x2.5 Урон при превосходстве Силы
  }
  if (player2_card.ability.id === 'harmonic_overdrive' && p2Power > p1Power) {
    p2Damage = Math.floor(p2Damage * 2.5);
  }

  // ФАЗА 5: ПОДСЧЕТ ИТОГОВОГО УРОНА И ВЫБЫВАНИЕ КАРТ
  let p1Surviving = p2Piercing ? 0 : p1Power - p2Damage;
  let p2Surviving = p1Piercing ? 0 : p2Power - p1Damage;
  let p1Alive = p1Surviving > 0;
  let p2Alive = p2Surviving > 0;

  let winner = p1Alive && !p2Alive ? 'player1'
             : !p1Alive && p2Alive ? 'player2'
             : p1Surviving > p2Surviving ? 'player1'
             : p2Surviving > p1Surviving ? 'player2' : 'draw';

  return { roundNumber, p1Power, p1Damage, p2Power, p2Damage, p1Surviving, p2Surviving, winner };
}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* GDD Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest">
          <BookOpen className="w-4 h-4" />
          <span>Game Design Document & System Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Техническая Спецификация Tactical CCG «Quantum Sparks»
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl mt-2 leading-relaxed">
          Архитектура базы данных, порядок очерёдности боевой системы (Order of Resolution), математика баланса ресурсов и примеры программной реализации.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => setDocTab('schemas')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            docTab === 'schemas'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          1. Схемы Базы Данных (JSON)
        </button>
        <button
          type="button"
          onClick={() => setDocTab('resolver')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            docTab === 'resolver'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          2. Логика resolve_round()
        </button>
        <button
          type="button"
          onClick={() => setDocTab('cards')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            docTab === 'cards'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          3. Три Флагманские Карты
        </button>
        <button
          type="button"
          onClick={() => setDocTab('tutorial_script')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            docTab === 'tutorial_script'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          4. Сценарий Туториала
        </button>
        <button
          type="button"
          onClick={() => setDocTab('balance')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            docTab === 'balance'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          5. Анализ Баланса & Кланы
        </button>
      </div>

      {/* TAB 1: JSON SCHEMAS */}
      {docTab === 'schemas' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
            База данных игры построена на документно-ориентированной модели. Ниже представлены строгие JSON Schema спецификации для сущностей: <code className="text-cyan-400">Card</code>, <code className="text-amber-400">Clan</code>, <code className="text-purple-400">Deck</code> и <code className="text-emerald-400">PlayerProfile</code>.
          </div>

          {/* Card Schema */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-cyan-300">schema_cards.json</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(cardJsonSchema, null, 2), 'cardSchema')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'cardSchema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'cardSchema' ? 'Скопировано!' : 'Копировать JSON'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 bg-slate-950/60">
              {JSON.stringify(cardJsonSchema, null, 2)}
            </pre>
          </div>

          {/* Clan Schema */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold font-mono text-amber-300">schema_clans.json</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(clanJsonSchema, null, 2), 'clanSchema')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'clanSchema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'clanSchema' ? 'Скопировано!' : 'Копировать JSON'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 bg-slate-950/60">
              {JSON.stringify(clanJsonSchema, null, 2)}
            </pre>
          </div>

          {/* Deck Schema */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold font-mono text-purple-300">schema_decks.json (6-11 карт, 4 боевые)</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(deckJsonSchema, null, 2), 'deckSchema')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'deckSchema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'deckSchema' ? 'Скопировано!' : 'Копировать JSON'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 bg-slate-950/60">
              {JSON.stringify(deckJsonSchema, null, 2)}
            </pre>
          </div>

          {/* Player Profile Schema */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono text-emerald-300">schema_player_profile.json</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(playerProfileJsonSchema, null, 2), 'profileSchema')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'profileSchema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'profileSchema' ? 'Скопировано!' : 'Копировать JSON'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 bg-slate-950/60">
              {JSON.stringify(playerProfileJsonSchema, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: RESOLVE_ROUND */}
      {docTab === 'resolver' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">
              Порядок разрешения боевого раунда (Order of Resolution)
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              В тактических карточных играх ключевой детерминирующий фактор честного матча — строгая очерёдность применения модификаторов. Функция <code className="text-amber-400 font-mono">resolve_round()</code> гарантирует 100% повторяемость расчёта и исключает состояние гонки (Race Condition):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 font-mono">
              <li><span className="text-cyan-400 font-bold font-sans">Фаза 1: Вскрытие карт.</span> Фиксация базовой Силы (HP) и Урона (ATK).</li>
              <li><span className="text-amber-400 font-bold font-sans">Фаза 2: Пассивные бонусы Кланов.</span> Сначала применяются баффы своих карт (Титаны: +2/+2, Синдикат: +звезды), затем дебаффы оппонента (Астральные: -2 Силы min 1, Теневики: -10 Урона min 4).</li>
              <li><span className="text-purple-400 font-bold font-sans">Фаза 3: Трата Квантовых искр.</span> Инъекция статов по формуле: +1 к Силе и +2 к Урону за каждую искру.</li>
              <li><span className="text-rose-400 font-bold font-sans">Фаза 4: Активация Умений.</span> Сначала защитные (обмен статов, срез входящего урона), затем атакующие (множитель урона x2.5, абсолютный фазовый пробой).</li>
              <li><span className="text-emerald-400 font-bold font-sans">Фаза 5: Подсчет урона & Летальность.</span> Одновременное нанесение урона по Силе. Выбывание уничтоженных карт.</li>
            </ol>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold font-mono text-amber-300">resolve_round.ts</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(resolverCodeSnippet, 'resolverCode')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'resolverCode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'resolverCode' ? 'Скопировано!' : 'Копировать код'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto bg-slate-950/60 leading-relaxed">
              {resolverCodeSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: THREE EXEMPLAR CARDS */}
      {docTab === 'cards' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
            Три флагманские карты с уникальными математическими умениями, кардинально меняющими сценарий боя:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400">4★ Технократы</span>
                <span className="text-xs font-mono text-slate-500">Utility / Swap</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                «Хроно-Инвертор»
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-cyan-400 font-bold">Сила: 14</span>
                <span className="text-amber-400 font-bold">Урон: 6</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-blue-300">«Квантовая Транспозиция»</div>
                <p className="text-slate-400 leading-relaxed">
                  Если перед фазой атаки Сила карты превышает Урон, меняет Силу и Урон местами. При победе в раунде возвращает владельцу +2 Квантовые искры (вампиризм).
                </p>
                <div className="font-mono text-[11px] text-blue-400 pt-1 border-t border-slate-800">
                  Формула: if (Power &gt; Damage) [P, D] = [D, P]; refund = 2
                </div>
              </div>
              <p className="text-xs text-slate-400">
                <strong>Тактика:</strong> Игрок выставляет карту с гигантской защитой (14 HP). В фазе умений эта защита мгновенно обращается в сокрушительный удар 14 Урона, уничтожая даже 6★ оппонентов!
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">5★ Астральные Стражи</span>
                <span className="text-xs font-mono text-slate-500">Offensive / Pierce</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                «Фазовый Рассекатель»
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-cyan-400 font-bold">Сила: 10</span>
                <span className="text-amber-400 font-bold">Урон: 14</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-cyan-300">«Фазовый Пробой»</div>
                <p className="text-slate-400 leading-relaxed">
                  Если на усиление карты потрачено ≥ 4 Квантовых искр, её урон полностью игнорирует Силу/Броню противника (вражеская Сила считается равной 0).
                </p>
                <div className="font-mono text-[11px] text-cyan-400 pt-1 border-t border-slate-800">
                  Формула: if (sparks &gt;= 4) enemyEffectivePower = 0
                </div>
              </div>
              <p className="text-xs text-slate-400">
                <strong>Тактика:</strong> Главный контрпик против Титанов с их 20+ Силы. Инвестиция ровно 4 искр превращает атаку в гарантированный фатальный чистый урон.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">6★ Титаны</span>
                <span className="text-xs font-mono text-slate-500">Offensive / Multiplier</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                «Квантовый Резонанс»
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-cyan-400 font-bold">Сила: 16</span>
                <span className="text-amber-400 font-bold">Урон: 11</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-amber-300">«Гармонический Овердрайв»</div>
                <p className="text-slate-400 leading-relaxed">
                  Если итоговая Сила этой карты строго выше Силы карты противника, Урон умножается на x2.5 (с округлением вниз).
                </p>
                <div className="font-mono text-[11px] text-amber-400 pt-1 border-t border-slate-800">
                  Формула: if (self.P &gt; enemy.P) Damage = floor(Damage * 2.5)
                </div>
              </div>
              <p className="text-xs text-slate-400">
                <strong>Тактика:</strong> Базовая Сила 16 + клан Титанов (+2) = 18 Силы. С 2 искрами Сила достигает 20! Урон в овердрайве подскакивает с 17 до 42, устраивая колоссальный Overkill!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TUTORIAL SCRIPT */}
      {docTab === 'tutorial_script' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
            Пошаговый сценарий интерактивного онбординга для новых игроков мобильной CCG. Сценарий построен по принципу постепенного раскрытия сложности (Progressive Disclosure):
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-400">
                <span>ЭТАП 1</span>
                <span>·</span>
                <span>АНАТОМИЯ КАРТ И БАЗОВОЕ СТОЛКНОВЕНИЕ</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                Цель: Научить читать статы Силы и Урона без лишних ресурсов
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <strong>Нарратив:</strong> Инструктор сообщает: «Командир, перед вами поле боя из 4 раундов. Вы выставляете одну карту против карты противника».
                <br />
                <strong>Игровой процесс:</strong> Игроку даётся 1 карта (Сила 8, Урон 5) против врага (Сила 5, Урон 4). Искры заблокированы на 0. В фазе столкновения 5 урона уничтожают 5 Силы врага, а Сила игрока остаётся 4 HP.
                <br />
                <strong>Инсайт:</strong> Игрок понимает: Сила = выживаемость, Урон = атака.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-amber-400">
                <span>ЭТАП 2</span>
                <span>·</span>
                <span>КВАНТОВЫЕ ИСКРЫ И ЭКОНОМИКА БЮДЖЕТА</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                Цель: Понять ценность ресурса и формулу +1 Силы / +2 Урона
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <strong>Нарратив:</strong> «Враг выставил тяжелого робота с защитой 11 HP. Базовой атаки вашей карты (9 Силы, 6 Урона) недостаточно! Вложите искры!»
                <br />
                <strong>Игровой процесс:</strong> Открывается доступ к стартовому пулу из 12 искр. Игрок инвестирует 3 искры: Сила становится 9 + 3 = 12, Урон становится 6 + (3 * 2) = 12. Враг уничтожен!
                <br />
                <strong>Инсайт:</strong> Игрок видит прямую математическую отдачу от каждой искры (+1/+2) и осознаёт, что потраченные искры не возвращаются автоматически.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-purple-400">
                <span>ЭТАП 3</span>
                <span>·</span>
                <span>СИНЕРГИИ КЛАНОВ И МАТЕМАТИЧЕСКИЕ ТРИГГЕРЫ</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                Цель: Освоить фазовые способности (Trigger Condition)
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <strong>Нарратив:</strong> «Перед вами Голиаф Титанов с 17 единицами брони! Обычным уроном его не пробить. Призовите Фазовый Рассекатель Астральных Стражей!»
                <br />
                <strong>Игровой процесс:</strong> Условие способности: «При трате ≥ 4 искр урон игнорирует броню». Игрок выставляет 4 искры. В 4-й фазе загорается индикатор «Фазовый Пробой». Сила Голиафа обнуляется, чистая победа!
                <br />
                <strong>Инсайт:</strong> Игрок учится комбинировать правильный объем искр под конкретные пороги умений.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BALANCE & CLANS */}
      {docTab === 'balance' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
            Сравнительный баланс 5 Кланов и звёздных лимитов колоды (22★, 25★, 33★, Unlimited):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(CLANS).map(clan => (
              <div key={clan.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: clan.color }}
                  />
                  <h4 className="text-sm font-bold text-white">{clan.name}</h4>
                </div>
                <div className="text-xs text-amber-300 font-mono mt-1">
                  {clan.mathBonusDescription}
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {clan.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-white text-sm">Звёздные Лимиты (Star Budgeting):</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Лимит 22★ (Рейтинговый стандарт):</strong> Заставляет игроков использовать комбинации вроде (5★, 5★, 6★, 6★) — 22 звезды ровно, либо балансировать дешевые карты с мощными бонусами.</li>
              <li><strong className="text-slate-200">Лимит 25★ & 33★:</strong> Позволяет формировать колоды с несколькими легендарными картами 6★.</li>
              <li><strong className="text-slate-200">Безлимитный режим:</strong> Максимальное противостояние титанических мощностей и супер-комбо.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
