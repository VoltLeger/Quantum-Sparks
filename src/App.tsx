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
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { GameSettingsModal } from './components/GameSettingsModal';
import { StarterCampaignScreen } from './components/StarterCampaignScreen';
import { OrientationBanner } from './components/OrientationBanner';
import { SandboxResolver } from './components/SandboxResolver';
import { TechDocumentation } from './components/TechDocumentation';
import { InitialRegistrationModal } from './components/InitialRegistrationModal';
import { Deck, Card, ClanId } from './types/game';
import { PlayerRecord, PlayerDatabase, getStarterDeckForClan } from './logic/playerDb';
import { SettingsDatabase } from './logic/settingsDb';
import { CARDS } from './data/cards';
import { sound } from './logic/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hub');

  // Persistent settings from database
  const initialSettings = SettingsDatabase.loadSettings();
  const [isMuted, setIsMuted] = useState<boolean>(initialSettings.isMuted);
  const [combatSpeed, setCombatSpeed] = useState<'normal' | 'fast'>(initialSettings.combatSpeed);

  // Active player profile from local database
  const [playerProfile, setPlayerProfile] = useState<PlayerRecord>(() => PlayerDatabase.getActivePlayer());

  // Registration modal state: show on first launch if not yet registered
  const [isInitialRegistrationOpen, setIsInitialRegistrationOpen] = useState<boolean>(() => {
    const hasRegistered = localStorage.getItem('quantum_sparks_player_registered_v1');
    return !hasRegistered;
  });

  // Modals
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState<boolean>(false);
  const [isStarterClanModalOpen, setIsStarterClanModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Daily login rewards
  const [claimedDays, setClaimedDays] = useState<number[]>([1]);
  const [currentDailyDay, setCurrentDailyDay] = useState<number>(2);

  // Completed missions
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);

  // Synchronized current deck
  const [currentDeck, setCurrentDeck] = useState<Deck>(playerProfile.currentDeck);

  // If new player without starter clan, show starter clan modal
  useEffect(() => {
    if (!playerProfile.starterClan) {
      setIsStarterClanModalOpen(true);
    }
  }, [playerProfile.starterClan]);

  const handleUpdatePlayerProfile = (updated: PlayerRecord) => {
    setPlayerProfile(updated);
    setCurrentDeck(updated.currentDeck);
  };

  const handlePlayerRegistered = (newPlayer: PlayerRecord) => {
    localStorage.setItem('quantum_sparks_player_registered_v1', 'true');
    setPlayerProfile(newPlayer);
    setCurrentDeck(newPlayer.currentDeck);
    setIsInitialRegistrationOpen(false);
    // Переход к кампании для получения первых 10 карт
    setActiveTab('campaign');
  };

  const handleSelectExistingPlayer = (player: PlayerRecord) => {
    localStorage.setItem('quantum_sparks_player_registered_v1', 'true');
    setPlayerProfile(player);
    setCurrentDeck(player.currentDeck);
    setIsInitialRegistrationOpen(false);
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

  const handleSelectStarterClan = (clanId: ClanId) => {
    const updated = PlayerDatabase.selectStarterClan(playerProfile.id, clanId);
    setPlayerProfile(updated);
    setCurrentDeck(updated.currentDeck);
    setIsStarterClanModalOpen(false);
  };

  // Claim campaign chapter reward
  const handleClaimCampaignReward = (
    chapterId: number,
    cardIds: string[],
    credits: number,
    crystals: number
  ) => {
    const newCredits = playerProfile.credits + credits;
    const newCrystals = playerProfile.crystals + crystals;
    const newUnlocked = Array.from(new Set([...playerProfile.unlockedCardIds, ...cardIds]));

    // If deck has less than 4 cards, fill it up
    let newBattleCards = [...currentDeck.battleCardIds];
    if (newBattleCards.length < 4) {
      const needed = cardIds.filter(id => !newBattleCards.includes(id));
      newBattleCards = [...newBattleCards, ...needed].slice(0, 4);
    }

    const updatedDeck: Deck = {
      ...currentDeck,
      cardIds: Array.from(new Set([...currentDeck.cardIds, ...cardIds])),
      battleCardIds: newBattleCards,
    };

    const updated = PlayerDatabase.updatePlayerData(playerProfile.id, {
      credits: newCredits,
      crystals: newCrystals,
      unlockedCardIds: newUnlocked,
      currentDeck: updatedDeck,
    });

    setPlayerProfile(updated);
    setCurrentDeck(updatedDeck);
  };

  // Reset player progress completely to fresh starter state
  const handleResetProgress = () => {
    const starterClan: ClanId = 'titans';
    const starterInfo = getStarterDeckForClan(starterClan);

    const resetPlayer: PlayerRecord = {
      ...playerProfile,
      credits: 5000,
      crystals: 50,
      elo: 1000,
      unlockedCardIds: starterInfo.starterCards,
      currentDeck: {
        id: 'deck_starter_reset',
        name: starterInfo.deckName,
        cardIds: starterInfo.starterCards,
        battleCardIds: starterInfo.battleCards,
        starLimit: 22,
      },
      stats: {
        battles: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      },
      updatedAt: new Date().toISOString(),
    };

    const saved = PlayerDatabase.updatePlayerData(playerProfile.id, resetPlayer);
    setPlayerProfile(saved);
    setCurrentDeck(saved.currentDeck);
    setActiveTab('campaign');
  };

  // Claim daily reward
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

  // Claim clan mission
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

  // Purchase booster or market card
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Уведомление о повороте экрана в альбомный режим для мобильных устройств */}
      <OrientationBanner />

      {/* Единое главное меню навигации */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        playerCredits={playerProfile.credits}
        playerCrystals={playerProfile.crystals}
        playerSparks={12}
        playerNickname={playerProfile.nickname}
        playerAvatarUrl={playerProfile.avatarUrl}
        playerElo={playerProfile.elo}
        onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Основная рабочая область приложения */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'hub' && (
          <MobileUrbanHub
            currentDeck={currentDeck}
            onStartBattle={() => setActiveTab('arena')}
            onNavigateTab={(tab) => setActiveTab(tab)}
            unlockedCardsCount={playerProfile.unlockedCardIds.length}
          />
        )}

        {activeTab === 'campaign' && (
          <StarterCampaignScreen
            unlockedCardIds={playerProfile.unlockedCardIds}
            onClaimCampaignReward={handleClaimCampaignReward}
            onBackToHub={() => setActiveTab('hub')}
            onStartDuel={() => setActiveTab('arena')}
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
            combatSpeed={combatSpeed}
          />
        )}

        {activeTab === 'pvp' && (
          <MultiplayerPvPScreen
            playerProfile={playerProfile}
            playerDeck={currentDeck}
            onBackToHub={() => setActiveTab('hub')}
            onUpdatePlayer={handleUpdatePlayerProfile}
            isCampaignCompleted={playerProfile.unlockedCardIds.length >= 10}
            onGoToCampaign={() => setActiveTab('campaign')}
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
            onBackToHub={() => setActiveTab('hub')}
          />
        )}

        {activeTab === 'shop' && (
          <BoosterShopScreen
            playerCredits={playerProfile.credits}
            playerCrystals={playerProfile.crystals}
            onPurchaseBooster={handlePurchaseBooster}
            onOpenDeckBuilder={() => setActiveTab('deck')}
            onBackToHub={() => setActiveTab('hub')}
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

      {/* Модальное окно Профиля Игрока (Личный Кабинет) */}
      <PlayerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentPlayer={playerProfile}
        onPlayerUpdated={handleUpdatePlayerProfile}
        onOpenStarterClanModal={() => {
          setIsProfileModalOpen(false);
          setIsStarterClanModalOpen(true);
        }}
        onOpenDeckBuilder={() => {
          setIsProfileModalOpen(false);
          setActiveTab('deck');
        }}
        onOpenCampaign={() => {
          setIsProfileModalOpen(false);
          setActiveTab('campaign');
        }}
        onOpenRegistration={() => {
          setIsProfileModalOpen(false);
          setIsInitialRegistrationOpen(true);
        }}
        onSwitchPlayer={(player: PlayerRecord) => {
          handleUpdatePlayerProfile(player);
        }}
      />

      {/* Модальное окно Настроек Игры */}
      <GameSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        combatSpeed={combatSpeed}
        setCombatSpeed={setCombatSpeed}
        onResetProgress={handleResetProgress}
        onOpenCampaign={() => {
          setIsSettingsModalOpen(false);
          setActiveTab('campaign');
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

      {/* Окно Регистрации / Входа Нового Игрока на Старте */}
      <InitialRegistrationModal
        isOpen={isInitialRegistrationOpen}
        onRegistered={handlePlayerRegistered}
        onSelectExistingPlayer={handleSelectExistingPlayer}
        canClose={Boolean(localStorage.getItem('quantum_sparks_player_registered_v1'))}
        onClose={() => setIsInitialRegistrationOpen(false)}
      />

      {/* Лаконичный футер */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Quantum Sparks: Tactical CCG</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono font-bold">Версия v1.2.1</span>
            <span>·</span>
            <span className="font-mono text-cyan-400">Android APK Auto-Build</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('campaign')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Кампания
            </button>
            <span>·</span>
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
