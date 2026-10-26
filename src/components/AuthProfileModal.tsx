/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerRecord, PlayerDatabase, STARTER_AVATARS, getRankTitle } from '../logic/playerDb';
import { GitHubCloudSync } from '../logic/githubCloudSync';
import { ClanId } from '../types/game';
import { CLANS } from '../data/clans';
import {
  User, Mail, Key, Shield, Award, Edit3, Check, Plus, Database,
  Download, Upload, Trash2, ArrowRight, X, RefreshCw
} from 'lucide-react';
import { sound } from '../logic/sound';

interface AuthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: PlayerRecord;
  onPlayerUpdated: (player: PlayerRecord) => void;
  onOpenStarterClanModal: () => void;
}

export const AuthProfileModal: React.FC<AuthProfileModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  onPlayerUpdated,
  onOpenStarterClanModal,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'register' | 'switch' | 'database' | 'github'>('profile');
  const [nicknameInput, setNicknameInput] = useState(currentPlayer.nickname);
  const [nicknameSaved, setNicknameSaved] = useState(false);

  // GitHub Cloud Sync
  const [ghToken, setGhToken] = useState(() => GitHubCloudSync.getConfig().token || '');
  const [ghGistId, setGhGistId] = useState(() => GitHubCloudSync.getConfig().gistId || '');
  const [ghSyncStatus, setGhSyncStatus] = useState<string | null>(null);
  const [isGhSyncing, setIsGhSyncing] = useState<boolean>(false);

  // Форма регистрации
  const [regEmail, setRegEmail] = useState('');
  const [regLogin, setRegLogin] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regClan, setRegClan] = useState<ClanId>('titans');
  const [regError, setRegError] = useState('');

  // База данных
  const [playersList, setPlayersList] = useState<PlayerRecord[]>(PlayerDatabase.getAllPlayers());
  const [jsonExport, setJsonExport] = useState('');
  const [jsonImportInput, setJsonImportInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Редактирование выбранного игрока в базе
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editCrystals, setEditCrystals] = useState<number>(0);
  const [editElo, setEditElo] = useState<number>(1200);
  const [editNick, setEditNick] = useState<string>('');

  if (!isOpen) return null;

  const refreshList = () => {
    setPlayersList(PlayerDatabase.getAllPlayers());
  };

  const handleSaveNickname = () => {
    if (!nicknameInput.trim()) return;
    const updated = PlayerDatabase.updatePlayerNickname(currentPlayer.id, nicknameInput.trim());
    onPlayerUpdated(updated);
    setNicknameSaved(true);
    sound.playCardPlay();
    setTimeout(() => setNicknameSaved(false), 2000);
  };

  const handleSelectAvatar = (url: string) => {
    const updated = PlayerDatabase.updatePlayerData(currentPlayer.id, { avatarUrl: url });
    onPlayerUpdated(updated);
    sound.playSparkInject();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.includes('@')) {
      setRegError('Укажите корректный Gmail / адрес электронной почты');
      return;
    }
    if (!regLogin.trim() || !regPassword.trim()) {
      setRegError('Логин и пароль обязательны для заполнения');
      return;
    }

    const newPlayer = PlayerDatabase.registerPlayer({
      email: regEmail,
      username: regLogin,
      password: regPassword,
      nickname: regNickname.trim() || regLogin.trim(),
      starterClan: regClan,
    });

    onPlayerUpdated(newPlayer);
    sound.playVictory();
    refreshList();
    setActiveTab('profile');
    setRegError('');
  };

  const handleSwitchAccount = (player: PlayerRecord) => {
    PlayerDatabase.setActivePlayerId(player.id);
    onPlayerUpdated(player);
    sound.playCardPlay();
    setActiveTab('profile');
  };

  const handleStartEditPlayer = (p: PlayerRecord) => {
    setEditingPlayerId(p.id);
    setEditCredits(p.credits);
    setEditCrystals(p.crystals);
    setEditElo(p.elo);
    setEditNick(p.nickname);
  };

  const handleSaveEditedPlayer = (id: string) => {
    const updated = PlayerDatabase.updatePlayerData(id, {
      credits: Number(editCredits),
      crystals: Number(editCrystals),
      elo: Number(editElo),
      nickname: editNick,
    });
    if (id === currentPlayer.id) {
      onPlayerUpdated(updated);
    }
    setEditingPlayerId(null);
    refreshList();
    sound.playVictory();
  };

  const handleDeletePlayer = (id: string) => {
    if (playersList.length <= 1) {
      alert('Нельзя удалить единственного игрока');
      return;
    }
    PlayerDatabase.deletePlayer(id);
    const active = PlayerDatabase.getActivePlayer();
    onPlayerUpdated(active);
    refreshList();
  };

  const handleExport = () => {
    const exported = PlayerDatabase.exportDatabase();
    setJsonExport(exported);
    navigator.clipboard.writeText(exported);
    alert('База данных игроков скопирована в буфер обмена!');
  };

  const handleImport = () => {
    if (!jsonImportInput.trim()) return;
    const ok = PlayerDatabase.importDatabase(jsonImportInput.trim());
    if (ok) {
      setImportStatus('✅ База данных успешно импортирована и обновлена!');
      refreshList();
      onPlayerUpdated(PlayerDatabase.getActivePlayer());
      sound.playVictory();
    } else {
      setImportStatus('❌ Ошибка формата JSON. Проверьте синтаксис.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Учетная Запись и База Игроков</h2>
              <p className="text-xs text-slate-400">Quantum Sparks: Tactical CCG • v1.1.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Вкладки навигации */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Мой Профиль</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setRegError('');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'register'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Новый Игрок / Регистрация</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('switch');
              refreshList();
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'switch'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Смена Аккаунта ({playersList.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('database');
              refreshList();
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'database'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>База Данных (Редактор)</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'github'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Облако GitHub (Gist/Бэкап)</span>
          </button>
        </div>

        {/* Тело модального окна со скроллом */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ВКЛАДКА 1: ПРОФИЛЬ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Карточка основного профиля */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Аватар */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-xl shadow-amber-500/10">
                    <img
                      src={currentPlayer.avatarUrl}
                      alt={currentPlayer.nickname}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-center font-mono py-0.5 text-amber-300">
                      {currentPlayer.rankTitle}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 font-mono">
                    ID: {currentPlayer.id.substring(0, 12)}...
                  </span>
                </div>

                {/* Информация и редактирование ника */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        Игровой Никнейм (можно менять в любое время):
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={nicknameInput}
                          onChange={(e) => setNicknameInput(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-amber-400 transition-colors w-48 sm:w-64"
                        />
                        <button
                          onClick={handleSaveNickname}
                          className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Сохранить</span>
                        </button>
                        {nicknameSaved && (
                          <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Сохранено
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Рейтинг ELO:</div>
                      <div className="text-2xl font-black text-amber-400 font-mono">
                        {currentPlayer.elo} <span className="text-xs text-slate-400">PTS</span>
                      </div>
                    </div>
                  </div>

                  {/* Gmail & Учетка */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <Mail className="w-3.5 h-3.5 text-red-400" />
                        <span>Почта Gmail:</span>
                      </div>
                      <div className="text-xs font-mono text-slate-200 truncate">
                        {currentPlayer.email}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Логин:</span>
                      </div>
                      <div className="text-xs font-mono text-slate-200">
                        @{currentPlayer.username}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Стартовый Клан:</span>
                      </div>
                      <div className="text-xs font-bold text-amber-300 capitalize flex items-center justify-between">
                        <span>{currentPlayer.starterClan ? CLANS[currentPlayer.starterClan]?.name : 'Не выбран'}</span>
                        <button
                          onClick={onOpenStarterClanModal}
                          className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                        >
                          Сменить
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Статистика матчей */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Боев</div>
                      <div className="text-sm font-bold text-white font-mono">{currentPlayer.stats.battles}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-emerald-400">Побед</div>
                      <div className="text-sm font-bold text-emerald-300 font-mono">{currentPlayer.stats.wins}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-rose-400">Поражений</div>
                      <div className="text-sm font-bold text-rose-300 font-mono">{currentPlayer.stats.losses}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-amber-400">Винрейт</div>
                      <div className="text-sm font-bold text-amber-300 font-mono">{currentPlayer.stats.winRate}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Выбор аватара */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Сменить аватар персонажа:
                </h4>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {STARTER_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectAvatar(url)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        currentPlayer.avatarUrl === url
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30'
                          : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: РЕГИСТРАЦИЯ НОВОГО ИГРОКА */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="max-w-xl mx-auto space-y-4 py-2">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">Регистрация Нового Игрока</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Каждый аккаунт сохраняется независимо со своим стартовым кланом, балансом и картами.
                </p>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {regError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gmail / Электронная почта
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="commander@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Логин аккаунта
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="valkyrie_tactics"
                      value={regLogin}
                      onChange={(e) => setRegLogin(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Пароль
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Отображаемый Игровой Никнейм
                </label>
                <input
                  type="text"
                  placeholder="Валькирия-9"
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Стартовый Клан (вы начнете игру только с картами этого клана):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CLANS) as ClanId[]).map((cId) => (
                    <button
                      type="button"
                      key={cId}
                      onClick={() => setRegClan(cId)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        regClan === cId
                          ? 'border-amber-400 bg-amber-500/15 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{CLANS[cId].name}</div>
                      <div className="text-[10px] text-amber-400">{CLANS[cId].mathBonusDescription}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Зарегистрировать и Войти</span>
              </button>
            </form>
          )}

          {/* ВКЛАДКА 3: СМЕНА АККАУНТА */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Сохраненные профили на этом устройстве ({playersList.length}):
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playersList.map((p) => {
                  const isActive = p.id === currentPlayer.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        isActive
                          ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatarUrl}
                          alt={p.nickname}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{p.nickname}</span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                                ТЕКУЩИЙ
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {p.email} • {p.elo} ELO
                          </div>
                          <div className="text-[11px] text-amber-400">
                            Клан: {p.starterClan ? CLANS[p.starterClan]?.name : 'Все'}
                          </div>
                        </div>
                      </div>

                      {!isActive && (
                        <button
                          onClick={() => handleSwitchAccount(p)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Войти</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ВКЛАДКА 4: БАЗА ДАННЫХ (РЕДАКТОР ДАННЫХ) */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
                <strong>🔧 Локальная база данных игроков:</strong> Здесь вы можете напрямую отредактировать баланс кредитов, кристаллов, ELO-рейтинг или никнейм любого игрока, а также сделать экспорт/импорт базы данных в JSON.
              </div>

              {/* Таблица игроков */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Игрок / Ник</th>
                      <th className="px-3 py-3">Gmail / Логин</th>
                      <th className="px-3 py-3">Кредиты</th>
                      <th className="px-3 py-3">Кристаллы</th>
                      <th className="px-3 py-3">ELO</th>
                      <th className="px-4 py-3 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {playersList.map((p) => {
                      const isEditing = editingPlayerId === p.id;
                      return (
                        <tr key={p.id} className="hover:bg-slate-950/50">
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editNick}
                                onChange={(e) => setEditNick(e.target.value)}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-bold w-32"
                              />
                            ) : (
                              <div className="font-bold text-white flex items-center gap-2">
                                <img src={p.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                                <span>{p.nickname}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-400 font-mono">
                            {p.email}
                          </td>
                          <td className="px-3 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editCredits}
                                onChange={(e) => setEditCredits(Number(e.target.value))}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono w-24"
                              />
                            ) : (
                              <span className="font-mono text-amber-300">{p.credits.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editCrystals}
                                onChange={(e) => setEditCrystals(Number(e.target.value))}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono w-20"
                              />
                            ) : (
                              <span className="font-mono text-cyan-300">{p.crystals}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editElo}
                                onChange={(e) => setEditElo(Number(e.target.value))}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono w-20"
                              />
                            ) : (
                              <span className="font-mono text-emerald-400 font-bold">{p.elo}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveEditedPlayer(p.id)}
                                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                              >
                                Сохранить
                              </button>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleStartEditPlayer(p)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] cursor-pointer"
                                >
                                  Править
                                </button>
                                {playersList.length > 1 && (
                                  <button
                                    onClick={() => handleDeletePlayer(p.id)}
                                    className="p-1 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                    title="Удалить профиль"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Экспорт и Импорт JSON */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-amber-400" /> Экспорт Базы в JSON
                    </span>
                    <button
                      onClick={handleExport}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Скопировать JSON
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={jsonExport || PlayerDatabase.exportDatabase()}
                    className="w-full h-24 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 resize-none"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-cyan-400" /> Импорт Базы из JSON
                    </span>
                    <button
                      onClick={handleImport}
                      className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Применить
                    </button>
                  </div>
                  <textarea
                    placeholder="Вставьте JSON базы данных игроков сюда..."
                    value={jsonImportInput}
                    onChange={(e) => setJsonImportInput(e.target.value)}
                    className="w-full h-24 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 resize-none focus:outline-none focus:border-cyan-400"
                  />
                  {importStatus && (
                    <div className="text-[11px] font-semibold">{importStatus}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 5: ОБЛАКО GITHUB (СИНХРОНИЗАЦИЯ И БЭКАП) */}
          {activeTab === 'github' && (
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 space-y-2">
                <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Сохранение Базы Данных на GitHub для Тестеров</span>
                </div>
                <p>
                  GitHub позволяет бесплатно хранить и синхронизировать базы данных игроков через <strong>GitHub Gists</strong> или скачивать JSON-файл для добавления в Git-репозиторий проекта.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Опция 1: Синхронизация через GitHub Gist API */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="font-bold text-white text-sm">☁️ Облачная Синхронизация (Gist)</h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={ghToken}
                      onChange={(e) => setGhToken(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Создается на github.com/settings/tokens (scope: gist)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gist ID (заполняется автоматически после первого сохранения)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7f8a9b2c..."
                      value={ghGistId}
                      onChange={(e) => setGhGistId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isGhSyncing || !ghToken.trim()}
                      onClick={async () => {
                        setIsGhSyncing(true);
                        setGhSyncStatus('⏳ Сохранение базы данных в GitHub Gist...');
                        const res = await GitHubCloudSync.saveDatabaseToGist(
                          PlayerDatabase.exportDatabase(),
                          ghToken,
                          ghGistId
                        );
                        setIsGhSyncing(false);
                        if (res.success && res.gistId) {
                          setGhGistId(res.gistId);
                          setGhSyncStatus(`✅ База успешно сохранена в GitHub! Gist ID: ${res.gistId}`);
                          sound.playVictory();
                        } else {
                          setGhSyncStatus(`❌ ${res.error || 'Ошибка сохранения'}`);
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Сохранить в GitHub</span>
                    </button>

                    <button
                      type="button"
                      disabled={isGhSyncing || !ghGistId.trim()}
                      onClick={async () => {
                        setIsGhSyncing(true);
                        setGhSyncStatus('⏳ Загрузка базы данных из GitHub Gist...');
                        const res = await GitHubCloudSync.loadDatabaseFromGist(ghGistId, ghToken);
                        setIsGhSyncing(false);
                        if (res.success && res.data) {
                          const ok = PlayerDatabase.importDatabase(res.data);
                          if (ok) {
                            setGhSyncStatus('✅ База успешно загружена с GitHub и применена!');
                            refreshList();
                            onPlayerUpdated(PlayerDatabase.getActivePlayer());
                            sound.playVictory();
                          } else {
                            setGhSyncStatus('❌ Ошибка парсинга данных из Gist');
                          }
                        } else {
                          setGhSyncStatus(`❌ ${res.error || 'Ошибка загрузки'}`);
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Загрузить с GitHub</span>
                    </button>
                  </div>

                  {ghSyncStatus && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-semibold">
                      {ghSyncStatus}
                    </div>
                  )}
                </div>

                {/* Опция 2: Скачать файл для коммита в репозиторий */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">📁 Файл для Репозитория Git</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Вы можете скачать актуальный снимок всей базы данных игроков в файл <code>quantum_sparks_players.json</code> и закоммитить его прямо в репозиторий GitHub. Все тестеры смогут загрузить его себе в 1 клик.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300">
                      Всего профилей в базе: {playersList.length} шт.<br />
                      Активный игрок: {currentPlayer.nickname} ({currentPlayer.elo} ELO)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const data = PlayerDatabase.exportDatabase();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'quantum_sparks_players.json';
                      a.click();
                      URL.revokeObjectURL(url);
                      sound.playVictory();
                    }}
                    className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать quantum_sparks_players.json</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
