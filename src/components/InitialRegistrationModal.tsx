/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Key, 
  Shield, 
  Sparkles, 
  Swords, 
  Check, 
  AlertCircle, 
  Users, 
  ChevronRight, 
  Database,
  Lock,
  ArrowRight
} from 'lucide-react';
import { PlayerRecord, PlayerDatabase, STARTER_AVATARS, getRankTitle } from '../logic/playerDb';
import { ClanId } from '../types/game';
import { CLANS } from '../data/clans';
import { sound } from '../logic/sound';
import confetti from 'canvas-confetti';

interface InitialRegistrationModalProps {
  isOpen: boolean;
  onRegistered: (newPlayer: PlayerRecord) => void;
  onSelectExistingPlayer: (player: PlayerRecord) => void;
  canClose?: boolean;
  onClose?: () => void;
}

export const InitialRegistrationModal: React.FC<InitialRegistrationModalProps> = ({
  isOpen,
  onRegistered,
  onSelectExistingPlayer,
  canClose = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  // Registration Form State
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClan, setSelectedClan] = useState<ClanId>('titans');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(STARTER_AVATARS[0]);
  const [errorMessage, setErrorMessage] = useState('');

  // Login / Switch State
  const [existingPlayers, setExistingPlayers] = useState<PlayerRecord[]>(() => PlayerDatabase.getAllPlayers());

  if (!isOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nickname.trim()) {
      setErrorMessage('Пожалуйста, введите ваш игровой никнейм');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Введите корректный email адрес');
      return;
    }
    if (password.length < 4) {
      setErrorMessage('Пароль должен содержать минимум 4 символа');
      return;
    }

    try {
      const newPlayer = PlayerDatabase.registerPlayer({
        email: email.trim(),
        username: nickname.trim().toLowerCase().replace(/\s+/g, '_'),
        password: password.trim(),
        nickname: nickname.trim(),
        starterClan: selectedClan,
      });

      // Update avatar
      const playerWithAvatar = PlayerDatabase.updatePlayerData(newPlayer.id, {
        avatarUrl: selectedAvatar,
      });

      sound.playVictory();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      onRegistered(playerWithAvatar);
    } catch (err) {
      setErrorMessage('Ошибка при регистрации. Попробуйте другой никнейм.');
    }
  };

  const handleLoginSubmit = (player: PlayerRecord) => {
    sound.playCardSelect();
    PlayerDatabase.setActivePlayerId(player.id);
    onSelectExistingPlayer(player);
  };

  const clanList: ClanId[] = ['titans', 'astral_guardians', 'technocrats', 'shadow_walkers', 'syndicate_of_chaos'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-xl w-full shadow-2xl text-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              QS
            </div>
            <div>
              <h3 className="font-black text-base text-white">Регистрация в Quantum Sparks</h3>
              <p className="text-xs text-slate-400">Создайте боевой аккаунт для сохранения прогресса и карт</p>
            </div>
          </div>

          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab switch */}
        <div className="flex items-center px-5 pt-3 gap-2 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
            className={`pb-2.5 text-xs font-black transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Регистрация Нового Игрока</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setExistingPlayers(PlayerDatabase.getAllPlayers());
              setErrorMessage('');
            }}
            className={`pb-2.5 text-xs font-black transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'login'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Выбрать Аккаунт из Базы ({existingPlayers.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Nickname & Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    Игровой Позывной (Никнейм)*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Например, CyberRaptor"
                      maxLength={18}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white text-xs font-bold outline-none"
                      required
                    />
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    Email / Логин*
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@gmail.com"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white text-xs font-bold outline-none"
                      required
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Пароль аккаунта*
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 4 символа"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white text-xs font-bold outline-none"
                    required
                  />
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* 2. Starter Clan Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  Выберите Стартовый Клан (Определяет начальные карты):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {clanList.map(clanId => {
                    const c = CLANS[clanId];
                    const isSelected = selectedClan === clanId;
                    return (
                      <div
                        key={clanId}
                        onClick={() => setSelectedClan(clanId)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate" style={{ color: isSelected ? c.color : '#ffffff' }}>
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {c.mathBonusDescription}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Choose Avatar */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  Выберите Аватар:
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {STARTER_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
                        selectedAvatar === url
                          ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200">
                <strong className="block text-amber-300 mb-0.5">Внимание:</strong>
                После регистрации откроется <strong>Вступительная Кампания</strong>. Пройдите 4 стартовые главы, чтобы собрать первые 10 карт и открыть доступ к сетевым боям!
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
              >
                <span>Зарегистрироваться и Начать Игру</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          ) : (
            /* Login / Select player from Database */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Игроки, сохраненные в базе данных:</span>
                <span className="font-mono text-cyan-300 font-bold">{existingPlayers.length} профилей</span>
              </div>

              <div className="space-y-2">
                {existingPlayers.map(p => {
                  const clan = p.starterClan ? CLANS[p.starterClan] : null;
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-400/60 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.avatarUrl}
                          alt={p.nickname}
                          className="w-10 h-10 rounded-xl object-cover border border-amber-400/50 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">{p.nickname}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="text-amber-400 font-mono">{p.elo} ELO</span>
                            <span>·</span>
                            <span style={{ color: clan?.color || '#94a3b8' }}>{clan?.name || 'Клан не выбран'}</span>
                            <span>·</span>
                            <span className="font-mono">{p.credits.toLocaleString('ru-RU')} КР</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoginSubmit(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer transition-colors shrink-0"
                      >
                        Войти
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                >
                  + Создать еще один новый аккаунт
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
