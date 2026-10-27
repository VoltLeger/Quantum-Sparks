/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Trophy, 
  Shield, 
  Swords, 
  Layers, 
  Flame, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Coins, 
  Gem,
  Award,
  ChevronRight,
  Database,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  Lock as LockIcon
} from 'lucide-react';
import { PlayerRecord, STARTER_AVATARS, getRankTitle, PlayerDatabase } from '../logic/playerDb';
import { CLANS } from '../data/clans';
import { CARDS } from '../data/cards';
import { CardView } from './CardView';
import { Card } from '../types/game';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: PlayerRecord;
  onPlayerUpdated: (updated: PlayerRecord) => void;
  onOpenStarterClanModal: () => void;
  onOpenDeckBuilder?: () => void;
  onOpenCampaign?: () => void;
  onOpenRegistration?: () => void;
  onSwitchPlayer?: (player: PlayerRecord) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  onPlayerUpdated,
  onOpenStarterClanModal,
  onOpenDeckBuilder,
  onOpenCampaign,
  onOpenRegistration,
  onSwitchPlayer,
}) => {
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [newNick, setNewNick] = useState(currentPlayer.nickname);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'collection' | 'database'>('overview');
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerRecord[]>(() => PlayerDatabase.getAllPlayers());
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [databaseMessage, setDatabaseMessage] = useState<string | null>(null);
  const [copiedDb, setCopiedDb] = useState<boolean>(false);

  // Sync player list when opened
  useEffect(() => {
    setAllPlayers(PlayerDatabase.getAllPlayers());
  }, [isOpen, currentPlayer.id]);

  if (!isOpen) return null;

  const clan = currentPlayer.starterClan ? CLANS[currentPlayer.starterClan] : null;

  const handleSaveNickname = () => {
    if (!newNick.trim()) return;
    const updated = PlayerDatabase.updatePlayerData(currentPlayer.id, {
      nickname: newNick.trim(),
    });
    onPlayerUpdated(updated);
    setIsEditingNick(false);
  };

  const handleSelectAvatar = (url: string) => {
    const updated = PlayerDatabase.updatePlayerData(currentPlayer.id, {
      avatarUrl: url,
    });
    onPlayerUpdated(updated);
    setShowAvatarPicker(false);
  };

  const totalMatches = currentPlayer.stats.battles || 0;
  const wins = currentPlayer.stats.wins || 0;
  const losses = currentPlayer.stats.losses || 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const unlockedCards = CARDS.filter(c => currentPlayer.unlockedCardIds.includes(c.id));

  // XP & Level calculations
  const playerLevel = Math.max(1, Math.floor(currentPlayer.elo / 100));
  const currentLevelXp = (currentPlayer.elo % 100) * 20;
  const nextLevelXp = 2000;
  const xpPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl text-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Профиль Игрока</h3>
              <p className="text-[11px] text-slate-400">Личные достижения, боевая статистика и коллекция</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center px-4 pt-3 gap-2 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Обзор и Статистика
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collection')}
            className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'collection'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Коллекция Карт</span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-amber-300 text-[10px] rounded-full font-mono">
              {unlockedCards.length}/{CARDS.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAllPlayers(PlayerDatabase.getAllPlayers());
              setActiveTab('database');
            }}
            className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>База Данных</span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-cyan-300 text-[10px] rounded-full font-mono">
              {allPlayers.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'overview' ? (
            <>
              {/* Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                {/* Avatar with click to change */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg shadow-amber-500/10 bg-slate-950 flex items-center justify-center">
                    {currentPlayer.avatarUrl ? (
                      <img
                        src={currentPlayer.avatarUrl}
                        alt={currentPlayer.nickname}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-10 h-10 text-amber-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md cursor-pointer transition-transform group-hover:scale-110"
                    title="Сменить аватар"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Nickname, Rank, Clan info */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {!isEditingNick ? (
                      <>
                        <h4 className="text-lg font-black text-white truncate">{currentPlayer.nickname}</h4>
                        <button
                          type="button"
                          onClick={() => setIsEditingNick(true)}
                          className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                          title="Редактировать никнейм"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newNick}
                          onChange={(e) => setNewNick(e.target.value)}
                          maxLength={16}
                          className="bg-slate-950 border border-amber-400 px-2 py-0.5 rounded-lg text-sm text-white font-bold outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveNickname}
                          className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingNick(false)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-bold text-amber-300">{getRankTitle(currentPlayer.elo)}</span>
                    <span>·</span>
                    <span className="font-mono text-cyan-300 font-bold">{currentPlayer.elo} ELO</span>
                    {clan && (
                      <>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: clan.color }}>{clan.name}</span>
                      </>
                    )}
                  </div>

                  {/* Level & XP Progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>Уровень {playerLevel}</span>
                      <span>{currentLevelXp} / {nextLevelXp} XP ({xpPercent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Selector Drawer */}
              {showAvatarPicker && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Выберите боевой аватар:</span>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(false)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Закрыть
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {STARTER_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAvatar(url)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
                          currentPlayer.avatarUrl === url ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Combat Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Всего дуэлей</div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">{totalMatches}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Победы</div>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">{wins}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Поражения</div>
                  <div className="text-lg font-black font-mono text-rose-400 mt-0.5">{losses}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Винрейт</div>
                  <div className="text-lg font-black font-mono text-amber-300 mt-0.5">{winRate}%</div>
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenDeckBuilder) onOpenDeckBuilder();
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                        Конструктор Боевой Колоды
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Выбрать 4 карты для выхода на арену ({currentPlayer.currentDeck.battleCardIds.length}/4)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenCampaign) onOpenCampaign();
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/30 hover:border-amber-400/60 flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Swords className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs text-amber-300 group-hover:text-amber-200 transition-colors">
                        Вступительная Кампания: Получить первые 10 карт
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Пройти 4 обучающих поединка или забрать стартовый набор
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={onOpenStarterClanModal}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-400/50 flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                        Сменить Стартовый Клан
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Текущий выбор: {clan?.name || 'Не выбран'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              </div>
            </>
          ) : activeTab === 'collection' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Разблокировано карт: <strong className="text-white">{unlockedCards.length}</strong> из {CARDS.length}</span>
                <span className="text-[11px]">Нажмите на карту для просмотра деталей</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {unlockedCards.map(card => (
                  <div key={card.id} onClick={() => setInspectedCard(card)}>
                    <CardView card={card} size="compact" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Вкладка Базы Данных */
            <div className="space-y-4">
              {/* Поясняющая плашка */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                      <span>Локальная База Игроков</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-mono">
                        quantum_sparks_player_db_v1
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Все профили, колоды и статистика хранятся в постоянном хранилище браузера (LocalStorage).
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenRegistration && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenRegistration();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow cursor-pointer transition-transform active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Новый Игрок</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const json = PlayerDatabase.exportToJson();
                        navigator.clipboard.writeText(json);
                        setCopiedDb(true);
                        setDatabaseMessage('JSON базы скопирован в буфер обмена!');
                        setTimeout(() => {
                          setCopiedDb(false);
                          setDatabaseMessage(null);
                        }, 2500);
                      } catch (e) {
                        setDatabaseMessage('Ошибка при экспорте');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Скопировать JSON базы в буфер обмена"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{copiedDb ? 'Скопировано!' : 'Экспорт JSON'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Импортировать профили из JSON"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Импорт</span>
                  </button>
                </div>
              </div>

              {databaseMessage && (
                <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between">
                  <span>{databaseMessage}</span>
                  <button type="button" onClick={() => setDatabaseMessage(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Список сохраненных игроков в БД */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 px-1 flex items-center justify-between">
                  <span>Зарегистрированные профили ({allPlayers.length}):</span>
                  <span className="text-[11px] text-slate-500">Нажмите «Войти», чтобы переключить активную учетную запись</span>
                </div>

                {allPlayers.map((player) => {
                  const isCurrent = player.id === currentPlayer.id;
                  const pClan = player.starterClan ? CLANS[player.starterClan] : null;

                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={player.avatarUrl}
                          alt={player.nickname}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{player.nickname}</span>
                            {pClan && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                                style={{ backgroundColor: `${pClan.color}25`, color: pClan.color }}
                              >
                                {pClan.name}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {player.elo} ELO
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                            <span>ID: <strong className="font-mono text-slate-300">{player.id.slice(0, 12)}...</strong></span>
                            <span>•</span>
                            <span>Карт: <strong className="text-white">{player.unlockedCardIds.length}</strong></span>
                            <span>•</span>
                            <span>Бои: <strong className="text-emerald-400">{player.stats.wins}W</strong> / <strong className="text-rose-400">{player.stats.losses}L</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isCurrent ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Активный
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                PlayerDatabase.setActivePlayerId(player.id);
                                if (onSwitchPlayer) {
                                  onSwitchPlayer(player);
                                }
                                setDatabaseMessage(`Переключено на профиль "${player.nickname}"`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors"
                            >
                              Войти
                            </button>
                            {allPlayers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  PlayerDatabase.deletePlayer(player.id);
                                  setAllPlayers(PlayerDatabase.getAllPlayers());
                                  setDatabaseMessage(`Игрок "${player.nickname}" удален из базы.`);
                                }}
                                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 text-xs font-bold cursor-pointer transition-colors"
                                title="Удалить тестового игрока"
                              >
                                ✕
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Модальное окно импорта JSON */}
              {showImportModal && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Импорт базы данных (Вставьте JSON)</span>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder='{"players": [...], "activePlayerId": "..."}'
                    className="w-full h-24 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const success = PlayerDatabase.importFromJson(importJsonText);
                        if (success) {
                          const active = PlayerDatabase.getActivePlayer();
                          setAllPlayers(PlayerDatabase.getAllPlayers());
                          onPlayerUpdated(active);
                          setShowImportModal(false);
                          setImportJsonText('');
                          setDatabaseMessage('База данных успешно импортирована!');
                        } else {
                          setDatabaseMessage('Ошибка: Неверный формат JSON');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Применить JSON
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal for inspected card */}
        {inspectedCard && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase font-mono">Просмотр Карты</span>
                <button
                  type="button"
                  onClick={() => setInspectedCard(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-center">
                <div className="w-48">
                  <CardView card={inspectedCard} size="urban" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="text-amber-400 font-bold">{inspectedCard.name}</div>
                <div className="text-slate-300 italic text-[11px] leading-relaxed">
                  "{inspectedCard.lore}"
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-cyan-300">Механика: </strong>
                  {inspectedCard.ability.mathFormulaDescription}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedCard(null)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
