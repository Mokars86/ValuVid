import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Volume2, VolumeX, Heart, Sparkles } from 'lucide-react';
import { VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { resolveLiveVideoUrl } from '../../utils/mediaStorage';
import { useApp } from '../../context/AppContext';

interface VideoPlayerProps {
  video: VideoItem;
  isActive: boolean;
  onDoubleTapLike: () => void;
  isCleanScreen?: boolean;
  onToggleCleanScreen?: (clean: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  isActive, 
  onDoubleTapLike,
  isCleanScreen = false,
  onToggleCleanScreen
}) => {
  const { isFeedMuted, setIsFeedMuted } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 50, y: 50 });
  const [lastTapTime, setLastTapTime] = useState(0);
  const [activeSrc, setActiveSrc] = useState<string>(video.videoUrl || '');
  const pointerDownCoords = useRef<{ x: number; y: number } | null>(null);

  // Resolve video source (from IndexedDB local storage or public stream)
  useEffect(() => {
    let isMounted = true;
    resolveLiveVideoUrl(video.id, video.videoUrl || '').then((resolved) => {
      if (isMounted) {
        if (resolved) {
          setActiveSrc(resolved);
          setHasError(false);
        } else {
          setActiveSrc('');
          setHasError(!video.thumbnailUrl);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [video.id, video.videoUrl, video.thumbnailUrl]);

  // Synchronize playback with active feed slide and mute settings
  useEffect(() => {
    const vid = videoRef.current;
    const bgAudio = bgAudioRef.current;

    if (isActive) {
      if (vid) {
        vid.muted = isFeedMuted;
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.debug('[VideoPlayer] Play interrupted or waiting for load:', err);
            });
        }
      }

      if (bgAudio) {
        bgAudio.volume = video.musicVolume ?? 0.4;
        bgAudio.muted = isFeedMuted;
        bgAudio.play().catch(() => {});
      }
    } else {
      if (vid) {
        vid.pause();
      }
      if (bgAudio) {
        bgAudio.pause();
      }
      setIsPlaying(false);
    }
  }, [isActive, activeSrc, video.audioTrack?.audioUrl, video.musicVolume, isFeedMuted]);

  // Handle video playback failure
  const handleVideoError = useCallback(() => {
    console.warn('[VideoPlayer] Video source failed to play:', activeSrc);
    setHasError(true);
  }, [activeSrc]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownCoords.current = { x: e.clientX, y: e.clientY };
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If pointer moved significantly (user was swiping/dragging), ignore click
    if (pointerDownCoords.current) {
      const distance = Math.hypot(
        e.clientX - pointerDownCoords.current.x,
        e.clientY - pointerDownCoords.current.y
      );
      if (distance > 12) {
        return;
      }
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap detected -> Like video & floating heart animation
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setHeartPos({ x, y });
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);

      onDoubleTapLike();
      sounds.playLikePop();

      // Ensure video continues playing after like double tap
      const vid = videoRef.current;
      if (vid && vid.paused) {
        vid.play().catch(() => {});
        setIsPlaying(true);
      }

      setLastTapTime(now);
      return;
    }

    setLastTapTime(now);

    // If in Clean Screen mode, tap restores UI
    if (isCleanScreen) {
      if (onToggleCleanScreen) {
        onToggleCleanScreen(false);
      }
      sounds.playLikePop();
      return;
    }

    // Single tap -> TOGGLE PLAY / PAUSE!
    const vid = videoRef.current;
    const bgAudio = bgAudioRef.current;

    if (vid) {
      if (vid.paused || !isPlaying) {
        vid.muted = isFeedMuted;
        vid.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('[VideoPlayer] Play error:', err);
        });
        if (bgAudio) {
          bgAudio.muted = isFeedMuted;
          bgAudio.play().catch(() => {});
        }
      } else {
        vid.pause();
        if (bgAudio) {
          bgAudio.pause();
        }
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isFeedMuted;
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    if (bgAudioRef.current) {
      bgAudioRef.current.muted = nextMuted;
      if (!nextMuted) {
        bgAudioRef.current.volume = video.musicVolume ?? 0.4;
        bgAudioRef.current.play().catch(() => {});
      }
    }
    setIsFeedMuted(nextMuted);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={handleContainerClick}
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center cursor-pointer select-none"
    >
      {/* Video element or fallback visual */}
      {!hasError && activeSrc ? (
        <video
          ref={videoRef}
          src={activeSrc}
          poster={video.thumbnailUrl}
          loop
          playsInline
          autoPlay
          muted={isFeedMuted}
          onPlay={() => setIsPlaying(true)}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onCanPlay={() => {
            if (isActive && videoRef.current && videoRef.current.paused && isPlaying) {
              videoRef.current.muted = isFeedMuted;
              videoRef.current.play().catch(() => {});
            }
          }}
          onEnded={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(() => {});
            }
          }}
          onError={handleVideoError}
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : null}

      {/* Synchronized Background Music Audio Element (for videos or photo drops) */}
      {video.audioTrack?.audioUrl && (
        <audio
          ref={bgAudioRef}
          src={video.audioTrack.audioUrl}
          loop
          playsInline
        />
      )}

      {/* Dynamic aesthetic video simulator if offline or CDN error */}
      {(hasError || !activeSrc) && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-amber-950/40">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-xs"
          />
          <div className="relative z-10 flex flex-col items-center max-w-xs">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-3 animate-pulse">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 leading-snug">{video.title}</h3>
            <p className="text-xs text-amber-300 font-medium">ValuVid HD Stream Engine</p>
            <div className="mt-4 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] text-neutral-300">Live Attention Rewards Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause indicator overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[1px] pointer-events-none animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-xl">
            <Play className="w-8 h-8 text-white ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Floating double-tap heart animation */}
      {showHeartAnim && (
        <div
          className="absolute z-30 pointer-events-none animate-heart-float"
          style={{ left: `${heartPos.x}%`, top: `${heartPos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
        </div>
      )}

      {/* Volume toggle button in corner */}
      <button
        onClick={toggleMute}
        aria-label="Toggle mute"
        className="absolute top-16 right-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white border border-white/20 active:scale-95 transition-transform"
      >
        {isFeedMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
      </button>

      {/* Video vignette / gradient overlay for readable texts */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
    </div>
  );
};
