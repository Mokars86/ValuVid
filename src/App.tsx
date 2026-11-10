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
import { CreatorProfileModal } from './components/discover/CreatorProfileModal';
import { ProductCheckoutModal } from './components/modals/ProductCheckoutModal';
import { supabase, fetchUserProfileFromSupabase } from './services/supabaseClient';
import { getUserAvatar } from './utils/userDirectory';
import { VideoItem } from './types';

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
    setShareToast,
    videos,
    setVideos,
    setFeedFilter,
    setCurrentVideoIndex,
    setDiscoverSearchQuery,
    selectedCreatorProfile,
    openCreatorProfile,
    closeCreatorProfile,
    playVideo,
    currentUser,
    selectedProduct,
    isProductCheckoutOpen,
    closeProductCheckout
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
    selectedSkillQuizVideo,
    selectedCreatorProfile
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
      selectedSkillQuizVideo,
      selectedCreatorProfile
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
      if (state.selectedCreatorProfile) {
        closeCreatorProfile();
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

  // Deep-linking URL query param listener (shared video & profile links)
  useEffect(() => {
    const handleIncomingUrl = async (urlStr: string) => {
      try {
        let videoParam: string | null = null;
        let userParam: string | null = null;
        let refParam: string | null = null;

        try {
          const url = new URL(urlStr);
          videoParam = url.searchParams.get('v') || url.searchParams.get('video');
          userParam = url.searchParams.get('user') || url.searchParams.get('creator') || url.searchParams.get('profile');
          refParam = url.searchParams.get('ref');

          // Check if path is in format /v/<videoId> or /@<username>
          if (!videoParam && url.pathname.startsWith('/v/')) {
            videoParam = url.pathname.replace(/^\/v\//, '').split('/')[0];
          }
          if (!userParam && url.pathname.startsWith('/@')) {
            userParam = url.pathname.replace(/^\/@/, '').split('/')[0];
          }
        } catch {
          // If relative URL or search string
          const search = urlStr.includes('?') ? urlStr.split('?')[1] : urlStr;
          const params = new URLSearchParams(search);
          videoParam = params.get('v') || params.get('video');
          userParam = params.get('user') || params.get('creator') || params.get('profile');
          refParam = params.get('ref');
        }

        if (refParam) {
          try {
            localStorage.setItem('valuvid_last_curator_ref', refParam);
          } catch {}
        }

        if (videoParam) {
          const vId = videoParam;
          let targetVideo: VideoItem | undefined = videos.find((v) => v.id === vId);

          // If not in current in-memory videos, check Supabase
          if (!targetVideo) {
            try {
              const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', vId)
                .maybeSingle();

              if (!error && data && data.category !== 'deleted' && data.category !== 'user_registry' && data.category !== 'like_record' && data.category !== 'follow_record') {
                targetVideo = {
                  id: data.id,
                  title: data.title || 'Shared Video',
                  caption: data.caption || '',
                  videoUrl: data.video_url || '/videos/jet_li_vs_vandam.mp4',
                  thumbnailUrl: data.thumbnail_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
                  category: data.category || 'trending',
                  hashtags: data.hashtags || ['valuvid'],
                  creator: data.creator_data || {
                    id: data.creator_id || 'creator',
                    name: 'ValuVid Creator',
                    username: 'creator',
                    followers: 0,
                    following: 0,
                  },
                  stats: data.stats || {
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    views: 1,
                    saves: 0,
                    tipsTotalGHS: 0,
                    tipsCount: 0,
                  },
                  audioTrack: data.audio_track || { title: 'Original Sound', artist: 'ValuVid' },
                  isPayPerUnlock: data.is_pay_per_unlock || false,
                  unlockPriceGHS: data.unlock_price_ghs || 0,
                  isUnlocked: !data.is_pay_per_unlock,
                  watchRewardGHSPerMin: 0.02,
                  durationSeconds: 30,
                  isAiContent: data.is_ai_content || false,
                  aiDisclosureType: data.ai_disclosure_type || 'none',
                  aiToolsUsed: data.ai_tools_used || [],
                };
              }
            } catch (err) {
              console.warn('[DeepLink] Failed to fetch video from Supabase:', err);
            }
          }

          if (targetVideo) {
            // Move/prepend target video to index 0 so it plays immediately on Feed
            setVideos((prev) => [targetVideo!, ...prev.filter((v) => v.id !== targetVideo!.id)]);
            setFeedFilter('foryou');
            setCurrentVideoIndex(0);
            setActiveTab('feed');
            setShareToast(`Playing: ${targetVideo.title || 'Shared Video'} 🎬`);
          } else {
            // Fallback: go to feed and play first video
            setActiveTab('feed');
            setCurrentVideoIndex(0);
            setShareToast('Video not found or removed');
          }

          // Clean URL query parameters to avoid re-triggering on state change
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (userParam) {
          const cleanUser = userParam.replace(/^@/, '').trim();
          
          if (currentUser && currentUser.username.toLowerCase() === cleanUser.toLowerCase()) {
            setActiveTab('profile');
          } else {
            const creatorVideo = videos.find(
              (v) => v.creator?.username?.toLowerCase() === cleanUser.toLowerCase()
            );
            const avatar = creatorVideo?.creator?.avatar || getUserAvatar(cleanUser);
            const name = creatorVideo?.creator?.name || cleanUser;

            try {
              const profileData = await fetchUserProfileFromSupabase(cleanUser);
              openCreatorProfile({
                id: cleanUser,
                name: name,
                username: cleanUser,
                avatar: avatar,
                bio: creatorVideo?.creator?.bio || `ValuVid Creator`,
                followers: profileData?.followers ?? creatorVideo?.creator?.followers ?? 0,
                following: profileData?.following ?? creatorVideo?.creator?.following ?? 0,
                isFollowing: false,
              });
            } catch {
              openCreatorProfile({
                id: cleanUser,
                name: name,
                username: cleanUser,
                avatar: avatar,
                bio: creatorVideo?.creator?.bio || `ValuVid Creator`,
                followers: creatorVideo?.creator?.followers ?? 0,
                following: creatorVideo?.creator?.following ?? 0,
                isFollowing: false,
              });
            }
          }

          setShareToast(`Viewing creator @${cleanUser} 👤`);

          // Clean URL query parameters
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        console.warn('[DeepLink] Parse error:', err);
      }
    };

    // 1. Initial page load query params
    if (typeof window !== 'undefined' && (window.location.search || window.location.pathname.startsWith('/v/') || window.location.pathname.startsWith('/@'))) {
      handleIncomingUrl(window.location.href);
    }

    // 2. Native Capacitor App deep link listener (for Android APK & iOS)
    if (Capacitor.isNativePlatform()) {
      const appUrlSub = CapacitorApp.addListener('appUrlOpen', (event) => {
        if (event && event.url) {
          handleIncomingUrl(event.url);
        }
      });
      return () => {
        appUrlSub.then((handle) => handle.remove()).catch(() => {});
      };
    }
  }, [videos, setVideos, setFeedFilter, setCurrentVideoIndex, setActiveTab, setDiscoverSearchQuery, openCreatorProfile, currentUser, setShareToast]);

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
      <CreatorProfileModal
        creator={selectedCreatorProfile}
        isOpen={Boolean(selectedCreatorProfile)}
        onClose={closeCreatorProfile}
        onSelectVideo={(video) => {
          playVideo(video);
          closeCreatorProfile();
        }}
      />
      <ProductCheckoutModal
        product={selectedProduct}
        isOpen={isProductCheckoutOpen}
        onClose={closeProductCheckout}
      />

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
