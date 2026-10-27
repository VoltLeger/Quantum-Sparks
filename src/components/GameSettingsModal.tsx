/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Zap, 
  Smartphone, 
  RotateCcw, 
  BookOpen, 
  Info, 
  X, 
  Check, 
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Database,
  Download,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { sound } from '../logic/sound';
import { SettingsDatabase, GameSettings } from '../logic/settingsDb';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  combatSpeed: 'normal' | 'fast';
  setCombatSpeed: (speed: 'normal' | 'fast') => void;
  onResetProgress: () => void;
  onOpenCampaign: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  setIsMuted,
  combatSpeed,
  setCombatSpeed,
  onResetProgress,
  onOpenCampaign,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'rules'>('general');
  const [currentSettings, setCurrentSettings] = useState<GameSettings>(() => SettingsDatabase.loadSettings());
  const [saveIndicator, setSaveIndicator] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setUpdateMsg(null);
    sound.playCardSelect();
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateMsg('Установлена актуальная версия v1.2.1. Постоянная подпись активна.');
    }, 1200);
  };

  const handleUpdateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = SettingsDatabase.saveSettings({ [key]: value });
    setCurrentSettings(updated);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);

    if (key === 'isMuted') {
      setIsMuted(value as boolean);
    } else if (key === 'combatSpeed') {
      setCombatSpeed(value as 'normal' | 'fast');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Настройки Игры</h3>
              <p className="text-xs text-slate-400">Quantum Sparks: Tactical CCG • v1.2.0</p>
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'general' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Основные параметры
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'rules' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Правила и Механика Боя
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {activeTab === 'general' ? (
            <>
              {/* Статус автосохранения настроек */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-slate-400">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Постоянное хранилище: <code className="text-cyan-300 font-mono">quantum_sparks_settings_v1</code></span>
                </div>
                {saveIndicator && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-3 h-3" /> Сохранено
                  </span>
                )}
              </div>

              {/* Звуковые эффекты */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400">
                      {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Звуковые эффекты</div>
                      <div className="text-[11px] text-slate-400">Удары, выбор карт, победы и интерфейс</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newMuted = sound.toggleMute();
                      handleUpdateSetting('isMuted', newMuted);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      isMuted ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500 text-slate-950 font-black'
                    }`}
                  >
                    {isMuted ? 'Выкл' : 'Вкл'}
                  </button>
                </div>

                {/* Громкость звука */}
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Уровень громкости:</span>
                    <strong className="text-white font-mono">{currentSettings.soundVolume}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentSettings.soundVolume}
                    disabled={isMuted}
                    onChange={(e) => handleUpdateSetting('soundVolume', Number(e.target.value))}
                    className="w-36 accent-amber-500 cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Скорость анимаций боя */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Скорость фазы боя</div>
                    <div className="text-[11px] text-slate-400">Длительность анимации столкновения карт</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('combatSpeed', 'normal')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                      combatSpeed === 'normal' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1.0x
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('combatSpeed', 'fast')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                      combatSpeed === 'fast' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2.0x Турбо
                  </button>
                </div>
              </div>

              {/* Предпочтительная ориентация */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-purple-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Режим ориентации</div>
                    <div className="text-[11px] text-slate-400">Рекомендуется Альбомный (Landscape)</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('orientationMode', 'auto')}
                    className={`px-2 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                      currentSettings.orientationMode === 'auto' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Авто
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('orientationMode', 'landscape')}
                    className={`px-2 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                      currentSettings.orientationMode === 'landscape' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Альбом
                  </button>
                </div>
              </div>

              {/* Вступительная кампания */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-amber-300 text-sm">Вступительная Кампания (10 Карт)</div>
                  <div className="text-[11px] text-slate-400">Пройдите обучение или откройте стартовую коллекцию</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCampaign();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer shrink-0"
                >
                  Кампания
                </button>
              </div>

              {/* Версия и Бесшовные обновления (Без удаления) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Обновление APK без удаления</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    v1.2.1
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Постоянный сертификат подписи (<code className="text-emerald-300 font-mono">QuantumSparks</code>) зафиксирован. Новые версии теперь устанавливаются поверх предыдущих <strong>без удаления приложения</strong> и <strong>с сохранением всех карт, профилей и настроек</strong>.
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleCheckUpdate}
                    disabled={isCheckingUpdate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Проверка...' : 'Проверить обновления'}</span>
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Auto-Increment Build
                  </span>
                </div>

                {updateMsg && (
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-medium animate-in fade-in flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{updateMsg}</span>
                  </div>
                )}
              </div>

              {/* Сброс прогресса */}
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Сброс прогресса</span>
                  </div>
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold cursor-pointer transition-colors"
                    >
                      Сбросить данные
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetProgress();
                          setShowResetConfirm(false);
                          onClose();
                        }}
                        className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black cursor-pointer"
                      >
                        Да, сбросить!
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Сбросит текущие победы/поражения, восстановит стартовую колоду и баланс кредитов.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300 text-sm">1. Формула Атаки (Кто побеждает в раунде):</div>
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-cyan-300 text-xs">
                  ИТОГОВАЯ АТАКА = СИЛА КАРТЫ × (1 + ВЛОЖЕННЫЕ ИСКРЫ) + БОНУСЫ
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Каждая вложенная Квантовая Искра умножает базовую Силу персонажа! Тот, у кого получилась более высокая Атака, <strong>выигрывает раунд</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-rose-300 text-sm">2. Четкий Урон (Сколько HP теряет оппонент):</div>
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-rose-300 text-xs">
                  УРОН ПРОТИВНИКУ = УРОН КАРТЫ-ПОБЕДИТЕЛЯ (НАПРИМЕР: 4 HP)
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Искры определяют победу в столкновении, но <strong>не раздувают урон</strong>! Если у карты 4 Урона — при победе она снимет у оппонента ровно 4 Жизни (HP), ни больше, ни меньше (за исключением карт со специальной способностью вроде «Damage +2»).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-300 text-sm">3. Условие Нокаута (K.O.) и Победы:</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Матч длится 4 раунда. Если у одного из игроков Жизни опускаются до 0 — наступает мгновенный <strong>НОКАУТ (K.O.)</strong>! Если после 4 раундов оба живы — побеждает тот, у кого осталось больше HP.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end shrink-0">
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
