/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Check, 
  Copy, 
  Gift, 
  Target, 
  ShoppingBag, 
  Users, 
  User, 
  Settings, 
  BookOpen,
  Swords
} from 'lucide-react';
import { sound } from '../logic/sound';
import { AnimatedResourceIndicator } from './AnimatedResourceIndicator';

export type ActiveTab = 'hub' | 'campaign' | 'modes' | 'arena' | 'pvp' | 'tutorial' | 'deck' | 'missions' | 'shop' | 'sandbox' | 'docs';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onResetMatch?: () => void;
  playerCredits?: number;
  playerCrystals?: number;
  playerSparks?: number;
  onOpenDailyRewards?: () => void;
  playerNickname?: string;
  playerAvatarUrl?: string;
  playerElo?: number;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  setIsMuted,
  playerCredits = 28500,
  playerCrystals = 145,
  playerSparks = 12,
  onOpenDailyRewards,
  playerNickname = 'Taldanok',
  playerAvatarUrl,
  playerElo = 1340,
  onOpenProfile,
  onOpenSettings,
}) => {
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [copiedBash, setCopiedBash] = useState(false);

  const toggleSound = () => {
    const nextState = sound.toggleMute();
    setIsMuted(nextState);
  };

  const bashScript = `# 1. Добавить изменения и сделать коммит
git add .
git commit -m "feat: release v1.2.0 (combat mechanics overhaul & 10-card campaign)"

# 2. Отправить в ветку main (запустит GitHub Actions, соберет APK и создаст релиз v1.2.0)
git push origin main

# 3. Создать тег релиза
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0`;

  const copyBash = () => {
    navigator.clipboard.writeText(bashScript);
    setCopiedBash(true);
    setTimeout(() => setCopiedBash(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
        {/* Zone 1: Single Unified Brand & Player Profile Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('hub')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            title="Главное меню / Хаб"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 font-black text-sm tracking-tighter shadow-md shadow-amber-500/20">
              QS
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                Quantum Sparks
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">
                v1.2.0 Tactical CCG
              </span>
            </div>
          </button>

          {/* Dedicated Single Player Profile Button */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400/80 transition-all cursor-pointer group shadow-xs"
              title="Открыть меню профиля игрока"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400/60 shrink-0 bg-slate-950 flex items-center justify-center">
                {playerAvatarUrl ? (
                  <img
                    src={playerAvatarUrl}
                    alt={playerNickname}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors leading-tight truncate max-w-[80px] sm:max-w-[120px]">
                  {playerNickname}
                </div>
                <div className="text-[10px] text-amber-400 font-mono leading-tight">
                  {playerElo} ELO
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('hub')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'hub'
                ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            Хаб
          </button>
          <button
            onClick={() => setActiveTab('campaign')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1 ${
              activeTab === 'campaign'
                ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                : 'hover:text-amber-300 text-amber-400/90'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Кампания (10 Карт)</span>
          </button>
          <button
            onClick={() => setActiveTab('arena')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'arena'
                ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            Экран Боя
          </button>
          <button
            onClick={() => setActiveTab('modes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'modes'
                ? 'text-yellow-400 font-bold border-b-2 border-yellow-400'
                : 'hover:text-white'
            }`}
          >
            Режимы
          </button>
          <button
            onClick={() => setActiveTab('pvp')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1 ${
              activeTab === 'pvp'
                ? 'text-rose-400 font-bold border-b-2 border-rose-400'
                : 'hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-rose-400" />
            <span>Сетевой PvP</span>
          </button>
          <button
            onClick={() => setActiveTab('deck')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'deck'
                ? 'text-purple-400 font-bold border-b-2 border-purple-400'
                : 'hover:text-white'
            }`}
          >
            Колода
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1 ${
              activeTab === 'shop'
                ? 'text-purple-400 font-bold border-b-2 border-purple-400'
                : 'hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
            <span>Магазин</span>
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1 ${
              activeTab === 'missions'
                ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Миссии</span>
          </button>
        </nav>

        {/* Zone 3: Animated Resource Indicators (Sparks, Credits, Crystals) & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Animated Quantum Sparks Indicator (Framer Motion Transitions) */}
          <AnimatedResourceIndicator
            type="sparks"
            value={playerSparks}
            label="Искры"
          />

          {/* Animated Credits Indicator */}
          <div className="hidden sm:inline-flex">
            <AnimatedResourceIndicator
              type="credits"
              value={playerCredits}
            />
          </div>

          {/* Animated Crystals Indicator */}
          <div className="hidden md:inline-flex">
            <AnimatedResourceIndicator
              type="crystals"
              value={playerCrystals}
            />
          </div>

          {/* Daily Gifts button */}
          {onOpenDailyRewards && (
            <button
              type="button"
              onClick={onOpenDailyRewards}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold cursor-pointer transition-colors"
              title="Ежедневный вход (Календарь наград)"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span className="hidden sm:inline">Подарки</span>
            </button>
          )}

          {/* Release & Build APK button */}
          <button
            type="button"
            onClick={() => setShowReleaseModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold shadow-xs cursor-pointer transition-all"
            title="Информация о релизе v1.2.0 и сборке Android APK"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">v1.2.0</span>
            <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[9px] font-black rounded">APK</span>
          </button>

          {/* Settings Modal Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title="Настройки игры и правила"
            >
              <Settings className="w-4 h-4 text-slate-400 hover:text-amber-400" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Release modal for APK */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Релиз игры & Авто-сборка APK</h3>
                  <p className="text-xs text-emerald-400 font-mono">Quantum Sparks: Tactical CCG • v1.2.0</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReleaseModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                <div className="text-slate-400">Название игры: <strong className="text-white">Quantum Sparks: Tactical CCG</strong></div>
                <div className="text-slate-400">Версия релиза: <strong className="text-emerald-400">v1.2.0</strong></div>
                <div className="text-slate-400">Android Package: <strong className="text-amber-300">com.quantumsparks.tacticalccg</strong></div>
                <div className="text-slate-400">CI/CD Pipeline: <strong className="text-cyan-300">.github/workflows/build-apk.yml (Auto-Release on Push & Tag)</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1.5">🚀 Как работает автоматическая сборка APK и Релиз:</h4>
                <p className="text-slate-300 leading-relaxed">
                  При каждом <strong>git push</strong> в ветку <code>main</code> GitHub Actions автоматически компилирует проект, создает релиз <code>v1.2.0</code> и прикрепляет к нему <strong>QuantumSparks-v1.2.0.apk</strong>.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">Команды в Git Bash для релиза v1.2.0:</span>
                  <button
                    type="button"
                    onClick={copyBash}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-mono cursor-pointer"
                  >
                    {copiedBash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBash ? 'Скопировано!' : 'Копировать'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                  {bashScript}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                <strong className="block mb-1 text-emerald-300">Где скачать готовый APK?</strong>
                После пуша перейдите в ваш репозиторий GitHub во вкладку <strong>Releases</strong> (или <strong>Actions</strong>) и скачайте файл <code>QuantumSparks-v1.2.0.apk</code> прямо на телефон.
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowReleaseModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors"
              >
                Понятно, закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile subnavigation bar */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 gap-3 text-xs font-medium border-t border-slate-900 no-scrollbar bg-slate-950/90">
        <button
          onClick={() => setActiveTab('hub')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'hub' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Хаб
        </button>
        <button
          onClick={() => setActiveTab('campaign')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'campaign' ? 'text-amber-400 font-bold' : 'text-amber-400/80'}`}
        >
          Кампания (10 Карт)
        </button>
        <button
          onClick={() => setActiveTab('arena')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'arena' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          Бой
        </button>
        <button
          onClick={() => setActiveTab('modes')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'modes' ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}
        >
          Режимы
        </button>
        <button
          onClick={() => setActiveTab('pvp')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'pvp' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}
        >
          Сетевой PvP
        </button>
        <button
          onClick={() => setActiveTab('deck')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'deck' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
        >
          Колода
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'shop' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
        >
          Магазин
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`whitespace-nowrap shrink-0 ${activeTab === 'missions' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Миссии
        </button>
      </div>
    </header>
  );
};
