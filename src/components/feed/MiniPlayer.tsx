import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Maximize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getImmediateVideoUrl, resolveLiveVideoUrl } from '../../utils/mediaStorage';

export const MiniPlayer: React.FC = () => {
  const {
    miniPlayerVideo,
    closeMiniPlayer,
    expandMiniPlayer,
    isFeedMuted,
    setIsFeedMuted,
    reportActivePlayback,
    activeTab,
    isNativePip,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [src, setSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const seekAppliedRef = useRef(false);

  useEffect(() => {
    if (!miniPlayerVideo?.video) {
      setSrc('');
      return;
    }
    const v = miniPlayerVideo.video;
    seekAppliedRef.current = false;
    const immediate = getImmediateVideoUrl(v.id, v.videoUrl, v.title);
    setSrc(immediate);

    let active = true;
    resolveLiveVideoUrl(v.id, v.videoUrl, v.title)
      .then((resolved) => {
        if (active && resolved) {
          setSrc(resolved);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [miniPlayerVideo?.video?.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !src || !miniPlayerVideo) return;
    vid.muted = isFeedMuted;
    vid.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [src, isFeedMuted, miniPlayerVideo]);

  useEffect(() => {
    const handleVisibility = () => {
      const vid = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<any> }) | null;
      if (!vid || !miniPlayerVideo) return;
      if (document.visibilityState === 'hidden') {
        if (!vid.paused && document.pictureInPictureEnabled && typeof vid.requestPictureInPicture === 'function') {
          vid.requestPictureInPicture().catch(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        if (document.pictureInPictureElement === vid && typeof document.exitPictureInPicture === 'function') {
          document.exitPictureInPicture().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [miniPlayerVideo]);

  useEffect(() => {
    const handleNativeStop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('valuvid-native-stop', handleNativeStop);
    return () => window.removeEventListener('valuvid-native-stop', handleNativeStop);
  }, []);

  useEffect(() => {
    if (miniPlayerVideo?.video && activeTab === 'create') {
      reportActivePlayback(miniPlayerVideo.video, videoRef.current?.currentTime || 0, false);
    }
  }, [activeTab, miniPlayerVideo, reportActivePlayback]);

  if (!miniPlayerVideo || activeTab === 'feed' || activeTab === 'create' || !src) {
    return null;
  }

  const { video, currentTime } = miniPlayerVideo;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isFeedMuted;
    setIsFeedMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  return (
    <div
      onClick={isNativePip ? undefined : expandMiniPlayer}
      role="region"
      aria-label="Floating mini video player"
      className={
        isNativePip
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center'
          : 'fixed bottom-20 right-3 lg:bottom-6 lg:right-6 z-40 w-32 sm:w-40 aspect-[9/14] rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl shadow-black/70 cursor-pointer group select-none animate-fade-in'
      }
    >
      <video
        ref={videoRef}
        src={src}
        poster={video.thumbnailUrl}
        loop
        playsInline
        autoPlay
        muted={isFeedMuted}
        onLoadedMetadata={() => {
          const vid = videoRef.current;
          if (vid) {
            if (vid.videoWidth && vid.videoHeight && vid.videoWidth > vid.videoHeight * 1.05) {
              setIsLandscape(true);
            } else {
              setIsLandscape(false);
            }
            if (!seekAppliedRef.current && currentTime > 0 && vid.duration > currentTime) {
              seekAppliedRef.current = true;
              vid.currentTime = currentTime;
            }
          }
        }}
        onPlaying={() => {
          setIsPlaying(true);
          reportActivePlayback(video, videoRef.current?.currentTime || 0, true);
        }}
        onPause={() => {
          setIsPlaying(false);
          reportActivePlayback(video, videoRef.current?.currentTime || 0, false);
        }}
        className={`w-full h-full ${isLandscape ? 'object-contain' : 'object-cover'}`}
      />

      {/* Top Gradient & Controls */}
      {!isNativePip && (
      <div className="absolute inset-x-0 top-0 p-1.5 bg-gradient-to-b from-black/75 to-transparent flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            expandMiniPlayer();
          }}
          className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/15"
          title="Return to fullscreen"
          aria-label="Return to fullscreen"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeMiniPlayer();
          }}
          className="w-6 h-6 rounded-full bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center border border-white/15 transition-colors"
          title="Close mini player"
          aria-label="Close mini player"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      )}

      {/* Bottom Gradient & Playback Controls */}
      {!isNativePip && (
      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col gap-1">
        <span className="text-[9px] font-bold text-white/90 truncate px-0.5">
          @{video.creator?.username || 'creator'}
        </span>
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center border border-white/20"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-white" />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center border border-white/20"
            title={isFeedMuted ? 'Unmute' : 'Mute'}
            aria-label={isFeedMuted ? 'Unmute' : 'Mute'}
          >
            {isFeedMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      )}
    </div>
  );
};
