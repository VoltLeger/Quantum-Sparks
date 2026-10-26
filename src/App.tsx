/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { MobileUrbanHub } from './components/MobileUrbanHub';
import { GameModesScreen, GameModeItem } from './components/GameModesScreen';
import { HearthstoneBattleScreen } from './components/HearthstoneBattleScreen';
import { MultiplayerPvPScreen } from './components/MultiplayerPvPScreen';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { DeckBuilder } from './components/DeckBuilder';
import { ClanMissionsScreen } from './components/ClanMissionsScreen';
import { BoosterShopScreen } from './components/BoosterShopScreen';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { StarterClanModal } from './components/StarterClanModal';
import { AuthProfileModal } from './components/AuthProfileModal';
import { SandboxResolver } from './components/SandboxResolver';
import { TechDocumentation } from './components/TechDocumentation';
import { Deck, Card, ClanId } from './types/game';
import { PlayerRecord, PlayerDatabase } from './logic/playerDb';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hub');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Профиль активного игрока из локальной БД
  const [playerProfile, setPlayerProfile] = useState<PlayerRecord>(() => PlayerDatabase.getActivePlayer());

  // Модальные окна
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState<boolean>(false);
  const [isStarterClanModalOpen, setIsStarterClanModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Ежедневный вход (7 дней)
  const [claimedDays, setClaimedDays] = useState<number[]>([1]);
  const [currentDailyDay, setCurrentDailyDay] = useState<number>(2);

  // Завершенные миссии кланов
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);

  // Синхронизация текущей боевой колоды игрока
  const [currentDeck, setCurrentDeck] = useState<Deck>(playerProfile.currentDeck);

  // Если игрок только создан и не выбрал клан, открываем выбор стартового клана
  useEffect(() => {
    if (!playerProfile.starterClan) {
      setIsStarterClanModalOpen(true);
    }
  }, [playerProfile.starterClan]);

  const handleUpdatePlayerProfile = (updated: PlayerRecord) => {
    setPlayerProfile(updated);
    setCurrentDeck(updated.currentDeck);
  };

  const handleSaveDeck = (updatedDeck: Deck) => {
    setCurrentDeck(updatedDeck);
    const updated = PlayerDatabase.updatePlayerData(playerProfile.id, { currentDeck: updatedDeck });
    setPlayerProfile(updated);
    setActiveTab('arena');
  };

  const handleSelectGameMode = (mode: GameModeItem) => {
    setCurrentDeck(prev => ({ ...prev, starLimit: mode.starLimit }));
    setActiveTab('arena');
  };

  // Выбор стартового клана (начинаем строго с картами одного клана!)
  const handleSelectStarterClan = (clanId: ClanId) => {
    const updated = PlayerDatabase.selectStarterClan(playerProfile.id, clanId);
    setPlayerProfile(updated);
    setCurrentDeck(updated.currentDeck);
    setIsStarterClanModalOpen(false);
  };

  // Получение ежедневной награды
  const handleClaimDailyReward = (day: number, reward: { credits: number; crystals: number; cardId?: string }) => {
    const newCredits = playerProfile.credits + reward.credits;
    const newCrystals = playerProfile.crystals + reward.crystals;
    const newCardIds = reward.cardId
      ? Array.from(new Set([...playerProfile.unlockedCardIds, reward.cardId]))
      : playerProfile.unlockedCardIds;

    const updated = PlayerDatabase.updatePlayerData(playerProfile.id, {
      credits: newCredits,
      crystals: newCrystals,
      unlockedCardIds: newCardIds,
      currentDeck: reward.cardId
        ? { ...currentDeck, cardIds: Array.from(new Set([...currentDeck.cardIds, reward.cardId])) }
        : currentDeck,
    });

    setPlayerProfile(updated);
    setCurrentDeck(updated.currentDeck);
    setClaimedDays(prev => [...prev, day]);
  };

  // Получение награды за клановую миссию
  const handleClaimMission = (missionId: string, credits: number, crystals: number, cardId?: string) => {
    const newCredits = playerProfile.credits + credits;
    const newCrystals = playerProfile.crystals + crystals;
    const newCardIds = cardId
      ? Array.from(new Set([...playerProfile.unlockedCardIds, cardId]))
      : playerProfile.unlockedCardIds;

    const updated = PlayerDatabase.updatePlayerData(playerProfile.id, {
      credits: newCredits,
      crystals: newCrystals,
      unlockedCardIds: newCardIds,
      currentDeck: cardId
        ? { ...currentDeck, cardIds: Array.from(new Set([...currentDeck.cardIds, cardId])) }
        : currentDeck,
    });

    setPlayerProfile(updated);
    setCurrentDeck(updated.currentDeck);
    setCompletedMissionIds(prev => [...prev, missionId]);
  };

  // Покупка бустера или карты на рынке
  const handlePurchaseBooster = (costCredits: number, costCrystals: number, cardsAdded: Card[]) => {
    const newCredits = Math.max(0, playerProfile.credits - costCredits);
    const newCrystals = Math.max(0, playerProfile.crystals - costCrystals);
    const addedIds = cardsAdded.map(c => c.id);
    const newUnlocked = Array.from(new Set([...playerProfile.unlockedCardIds, ...addedIds]));
    const newDeckCardIds = Array.from(new Set([...currentDeck.cardIds, ...addedIds]));

    const updated = PlayerDatabase.updatePlayerData(playerProfile.id, {
      credits: newCredits,
      crystals: newCrystals,
      unlockedCardIds: newUnlocked,
      currentDeck: { ...currentDeck, cardIds: newDeckCardIds },
    });

    setPlayerProfile(updated);
    setCurrentDeck(updated.currentDeck);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Верхнее меню навигации */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        playerCredits={playerProfile.credits}
        playerCrystals={playerProfile.crystals}
        playerNickname={playerProfile.nickname}
        playerAvatarUrl={playerProfile.avatarUrl}
        playerElo={playerProfile.elo}
        onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Основной контент */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'hub' && (
          <MobileUrbanHub
            currentDeck={currentDeck}
            onStartBattle={() => setActiveTab('modes')}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'modes' && (
          <GameModesScreen
            currentDeck={currentDeck}
            onSelectMode={handleSelectGameMode}
            onOpenDeckBuilder={() => setActiveTab('deck')}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'arena' && (
          <HearthstoneBattleScreen
            playerDeck={currentDeck}
            onOpenDeckBuilder={() => setActiveTab('deck')}
            onOpenDocs={() => setActiveTab('docs')}
            onBackToHub={() => setActiveTab('hub')}
          />
        )}

        {activeTab === 'pvp' && (
          <MultiplayerPvPScreen
            playerProfile={playerProfile}
            playerDeck={currentDeck}
            onBackToHub={() => setActiveTab('hub')}
            onUpdatePlayer={handleUpdatePlayerProfile}
          />
        )}

        {activeTab === 'tutorial' && <InteractiveTutorial />}

        {activeTab === 'deck' && (
          <DeckBuilder
            currentDeck={currentDeck}
            onSaveDeck={handleSaveDeck}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'missions' && (
          <ClanMissionsScreen
            completedMissionIds={completedMissionIds}
            onClaimMission={handleClaimMission}
            onGoToBattle={() => setActiveTab('arena')}
          />
        )}

        {activeTab === 'shop' && (
          <BoosterShopScreen
            playerCredits={playerProfile.credits}
            playerCrystals={playerProfile.crystals}
            onPurchaseBooster={handlePurchaseBooster}
            onOpenDeckBuilder={() => setActiveTab('deck')}
          />
        )}

        {activeTab === 'sandbox' && <SandboxResolver />}

        {activeTab === 'docs' && <TechDocumentation />}
      </main>

      {/* Модальное окно выбора стартового клана */}
      <StarterClanModal
        isOpen={isStarterClanModalOpen}
        onSelectClan={handleSelectStarterClan}
        currentStarterClan={playerProfile.starterClan}
        onClose={playerProfile.starterClan ? () => setIsStarterClanModalOpen(false) : undefined}
      />

      {/* Модальное окно профиля игрока и базы данных */}
      <AuthProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentPlayer={playerProfile}
        onPlayerUpdated={handleUpdatePlayerProfile}
        onOpenStarterClanModal={() => {
          setIsProfileModalOpen(false);
          setIsStarterClanModalOpen(true);
        }}
      />

      {/* Модальное окно ежедневных наград */}
      <DailyRewardsModal
        isOpen={isDailyRewardsOpen}
        onClose={() => setIsDailyRewardsOpen(false)}
        claimedDays={claimedDays}
        currentDay={currentDailyDay}
        onClaimDay={handleClaimDailyReward}
      />

      {/* Лаконичный футер */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Quantum Sparks: Tactical CCG</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono font-bold">Версия v1.2.0</span>
            <span>·</span>
            <span className="font-mono text-cyan-400">Android APK Auto-Build</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('pvp')}
              className="hover:text-rose-400 transition-colors cursor-pointer"
            >
              Сетевой PvP
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('arena')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Экран Боя
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('missions')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Миссии Кланов
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('shop')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Магазин Бустеров
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('deck')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Конструктор Колод
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
