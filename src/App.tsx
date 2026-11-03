import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AppProvider, useApp } from './context/AppContext';
import { DeviceShell } from './components/layout/DeviceShell';
import { BottomNav } from './components/layout/BottomNav';
import { FeedScreen } from './components/feed/FeedScreen';
import { DiscoverScreen } from './components/discover/DiscoverScreen';
import { CreateStudio } from './components/create/CreateStudio';
import { ValuWallet } from './components/wallet/ValuWallet';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { QuickTipModal } from './components/modals/QuickTipModal';
import { CashoutDrawer } from './components/modals/CashoutDrawer';
import { ContentUnlockModal } from './components/modals/ContentUnlockModal';
import { VideoAnalyticsModal } from './components/modals/VideoAnalyticsModal';
import { CommentDrawer } from './components/modals/CommentDrawer';
import { ShareModal } from './components/modals/ShareModal';
import { SaveVideoModal } from './components/modals/SaveVideoModal';
import { SplashScreen } from './components/splash/SplashScreen';
import { FundingEconomicsModal } from './components/modals/FundingEconomicsModal';
import { ProSubscriptionModal } from './components/modals/ProSubscriptionModal';
import { SponsorBountyModal } from './components/modals/SponsorBountyModal';
import { WinPoolModal } from './components/modals/WinPoolModal';
import { AiTransparencyModal } from './components/modals/AiTransparencyModal';
import { ValuSplitModal } from './components/modals/ValuSplitModal';
import { CommunityGoalModal } from './components/modals/CommunityGoalModal';
import { SkillQuizModal } from './components/modals/SkillQuizModal';
import { SettingsPage } from './components/settings/SettingsPage';
import { AuthModal } from './components/auth/AuthModal';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    authModalOpen,
    setAuthModalOpen,
    showSettings,
    setShowSettings,
    commentDrawerVideo,
    closeCommentDrawer,
    shareModalVideo,
    closeShareModal,
    saveModalVideo,
    closeSaveModal,
    tipModalVideo,
    closeTipModal,
    cashoutDrawerOpen,
    closeCashoutDrawer,
    unlockPromptVideo,
    closeUnlockPrompt,
    analyticsVideo,
    closeAnalytics,
    showFundingModal,
    setShowFundingModal,
    showProModal,
    setShowProModal,
    showSponsorModal,
    setShowSponsorModal,
    showWinPoolModal,
    setShowWinPoolModal,
    selectedAiDisclosureVideo, 
    closeAiDisclosureModal,
    selectedValuSplitVideo,
    closeValuSplitModal,
    selectedCommunityGoalVideo,
    closeCommunityGoalModal,
    selectedSkillQuizVideo,
    closeSkillQuizModal,
    setShareToast
  } = useApp();

  // Keep a ref to the latest state for the hardware back button handler
  const stateRef = useRef({
    activeTab,
    authModalOpen,
    showSettings,
    commentDrawerVideo,
    shareModalVideo,
    saveModalVideo,
    tipModalVideo,
    cashoutDrawerOpen,
    unlockPromptVideo,
    analyticsVideo,
    showFundingModal,
    showProModal,
    showSponsorModal,
    showWinPoolModal,
    selectedAiDisclosureVideo,
    selectedValuSplitVideo,
    selectedCommunityGoalVideo,
    selectedSkillQuizVideo
  });

  useEffect(() => {
    stateRef.current = {
      activeTab,
      authModalOpen,
      showSettings,
      commentDrawerVideo,
      shareModalVideo,
      saveModalVideo,
      tipModalVideo,
      cashoutDrawerOpen,
      unlockPromptVideo,
      analyticsVideo,
      showFundingModal,
      showProModal,
      showSponsorModal,
      showWinPoolModal,
      selectedAiDisclosureVideo,
      selectedValuSplitVideo,
      selectedCommunityGoalVideo,
      selectedSkillQuizVideo
    };
  });

  const lastBackPressTimeRef = useRef<number>(0);

  // Phone hardware & gesture back key integration
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListenerPromise = CapacitorApp.addListener('backButton', () => {
      const state = stateRef.current;

      // 1. Modals / Overlays dismissal priority
      if (state.authModalOpen) {
        setAuthModalOpen(false);
        return;
      }
      if (state.showSettings) {
        setShowSettings(false);
        return;
      }
      if (state.commentDrawerVideo) {
        closeCommentDrawer();
        return;
      }
      if (state.shareModalVideo) {
        closeShareModal();
        return;
      }
      if (state.saveModalVideo) {
        closeSaveModal();
        return;
      }
      if (state.tipModalVideo) {
        closeTipModal();
        return;
      }
      if (state.cashoutDrawerOpen) {
        closeCashoutDrawer();
        return;
      }
      if (state.unlockPromptVideo) {
        closeUnlockPrompt();
        return;
      }
      if (state.analyticsVideo) {
        closeAnalytics();
        return;
      }
      if (state.showFundingModal) {
        setShowFundingModal(false);
        return;
      }
      if (state.showProModal) {
        setShowProModal(false);
        return;
      }
      if (state.showSponsorModal) {
        setShowSponsorModal(false);
        return;
      }
      if (state.showWinPoolModal) {
        setShowWinPoolModal(false);
        return;
      }
      if (state.selectedAiDisclosureVideo) {
        closeAiDisclosureModal();
        return;
      }
      if (state.selectedValuSplitVideo) {
        closeValuSplitModal();
        return;
      }
      if (state.selectedCommunityGoalVideo) {
        closeCommunityGoalModal();
        return;
      }
      if (state.selectedSkillQuizVideo) {
        closeSkillQuizModal();
        return;
      }

      // 2. Tab Navigation: return to main Feed
      if (state.activeTab !== 'feed') {
        setActiveTab('feed');
        return;
      }

      // 3. Already on Feed: press twice within 2 seconds to exit app
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        lastBackPressTimeRef.current = now;
        setShareToast('Press back again to exit ValuVid');
      }
    });

    return () => {
      backListenerPromise.then((handle) => handle.remove());
    };
  }, [
    setAuthModalOpen,
    setShowSettings,
    closeCommentDrawer,
    closeShareModal,
    closeTipModal,
    closeCashoutDrawer,
    closeUnlockPrompt,
    closeAnalytics,
    setShowFundingModal,
    setShowProModal,
    setShowSponsorModal,
    setShowWinPoolModal,
    closeAiDisclosureModal,
    closeValuSplitModal,
    closeCommunityGoalModal,
    closeSkillQuizModal,
    setActiveTab,
    setShareToast
  ]);

  return (
    <DeviceShell>
      {/* Screen Views */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'feed' && <FeedScreen />}
        {activeTab === 'discover' && <DiscoverScreen />}
        {activeTab === 'create' && <CreateStudio />}
        {activeTab === 'wallet' && <ValuWallet />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Overlays & Modals */}
      <QuickTipModal />
      <CashoutDrawer />
      <ContentUnlockModal />
      <VideoAnalyticsModal />
      <CommentDrawer />
      <ShareModal />
      <SaveVideoModal />
      <FundingEconomicsModal />
      <ProSubscriptionModal />
      <SponsorBountyModal />
      <WinPoolModal />
      <AiTransparencyModal video={selectedAiDisclosureVideo} onClose={closeAiDisclosureModal} />
      <ValuSplitModal video={selectedValuSplitVideo} onClose={closeValuSplitModal} />
      <CommunityGoalModal video={selectedCommunityGoalVideo} onClose={closeCommunityGoalModal} />
      <SkillQuizModal video={selectedSkillQuizVideo} onClose={closeSkillQuizModal} />
      <SettingsPage />
      <AuthModal />

      {/* Launch Splash Screen */}
      <SplashScreen />
    </DeviceShell>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
