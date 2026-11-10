import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, Sparkles, Maximize2, Minimize2, X, RotateCw } from 'lucide-react';
import { VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { resolveLiveVideoUrl, getImmediateVideoUrl } from '../../utils/mediaStorage';
import { useApp } from '../../context/AppContext';
import { App as CapApp } from '@capacitor/app';

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
  const { isFeedMuted, setIsFeedMuted, isCinemaMode, setIsCinemaMode } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 50, y: 50 });
  const [lastTapTime, setLastTapTime] = useState(0);
  const [activeSrc, setActiveSrc] = useState<string>(() => getImmediateVideoUrl(video.id, video.videoUrl, video.title));
  const [isVideoReady, setIsVideoReady] = useState(false);
  const pointerDownCoords = useRef<{ x: number; y: number } | null>(null);

  // Landscape Detection & Cinema Theater Mode
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (video.videoResolution) {
      return video.videoResolution.width > video.videoResolution.height;
    }
    return false;
  });
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isScreenPortrait, setIsScreenPortrait] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : true
  );

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isCinemaMode && isActive) {
      resetControlsTimer();
    } else {
      setShowControls(true);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    }
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isCinemaMode, isActive, resetControlsTimer]);

  useEffect(() => {
    if (!isActive && isCinemaMode) {
      setIsCinemaMode(false);
    }
  }, [isActive, isCinemaMode, setIsCinemaMode]);

  useEffect(() => {
    const handleResize = () => {
      setIsScreenPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Native phone back button listener to exit Cinema Mode immediately
  useEffect(() => {
    if (!isCinemaMode) return;
    let listenerHandle: any = null;
    try {
      CapApp.addListener('backButton', () => {
        setIsCinemaMode(false);
      }).then((handle) => {
        listenerHandle = handle;
      });
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCinemaMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCinemaMode, setIsCinemaMode]);

  // Instant hardware playback: set source synchronously, then check local blob cache in background
  useEffect(() => {
    const immediate = getImmediateVideoUrl(video.id, video.videoUrl, video.title);
    setActiveSrc(immediate);
    setHasError(false);

    let isMounted = true;
    resolveLiveVideoUrl(video.id, video.videoUrl, video.title).then((resolved) => {
      if (isMounted) {
        if (resolved && resolved !== immediate) {
          setActiveSrc(resolved);
          setHasError(false);
        } else if (!immediate && !resolved) {
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
              setIsVideoReady(true);
            })
            .catch((err) => {
              console.debug('[VideoPlayer] Play interrupted or waiting for load:', err);
              // Autoplay recovery: if browser policy blocks unmuted autoplay without gesture, retry muted immediately
              if (err?.name === 'NotAllowedError') {
                vid.muted = true;
                setIsFeedMuted(true);
                vid.play().then(() => {
                  setIsPlaying(true);
                  setIsVideoReady(true);
                }).catch(() => {});
              }
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

    return () => {
      if (vid) {
        vid.pause();
      }
      if (bgAudio) {
        bgAudio.pause();
      }
    };
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

    // If in Cinema Mode and controls are currently hidden, single tap reveals them without pausing
    if (isCinemaMode && isActive) {
      if (!showControls) {
        resetControlsTimer();
        return;
      }
      resetControlsTimer();
    }

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

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resetControlsTimer();
    const rect = e.currentTarget.getBoundingClientRect();
    let ratio = 0;
    if (isScreenPortrait) {
      // Rotated 90deg clockwise: local horizontal axis maps to screen Y (top to bottom)
      ratio = (e.clientY - rect.top) / rect.height;
    } else {
      ratio = (e.clientX - rect.left) / rect.width;
    }
    ratio = Math.max(0, Math.min(1, ratio));
    if (videoRef.current && videoRef.current.duration) {
      const nextTime = ratio * videoRef.current.duration;
      videoRef.current.currentTime = nextTime;
      setPlaybackProgress(ratio * 100);
      setCurrentTimeSec(nextTime);
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
      style={{ touchAction: 'none' }}
      className={`overflow-hidden flex items-center justify-center cursor-pointer select-none touch-none ${
        (isCinemaMode && isActive)
          ? 'fixed inset-0 z-50 bg-black w-screen h-screen'
          : 'relative w-full h-full bg-black'
      }`}
    >
      {/* 0ms Instant Poster Layer: Prevents black-screen flash while video decoder warms up */}
      {video.thumbnailUrl && (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className={`absolute transition-all duration-300 pointer-events-none select-none z-1 ${
            (isCinemaMode && isActive)
              ? (isScreenPortrait ? 'w-[100vh] h-[100vw] object-contain rotate-90 max-w-none max-h-none' : 'w-full h-full object-contain')
              : (isLandscape ? 'w-full h-full object-contain' : 'w-full h-full object-cover')
          } ${
            isVideoReady ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
        />
      )}

      {/* Ambient Glow Backdrop for Horizontal Landscape Videos */}
      {isLandscape && !(isCinemaMode && isActive) && video.thumbnailUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-125 pointer-events-none select-none"
          style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
        />
      )}

      {/* Video element or fallback visual */}
      {!hasError && activeSrc ? (
        <video
          ref={videoRef}
          src={activeSrc}
          poster={video.thumbnailUrl}
          loop
          playsInline
          preload="auto"
          autoPlay
          muted={isFeedMuted}
          onLoadedMetadata={() => {
            setIsVideoReady(true);
            if (videoRef.current) {
              const w = videoRef.current.videoWidth;
              const h = videoRef.current.videoHeight;
              if (w && h && w > h * 1.05) {
                setIsLandscape(true);
              }
              setDurationSec(videoRef.current.duration || 0);
            }
            if (isActive && videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch((err) => {
                if (err?.name === 'NotAllowedError' && videoRef.current) {
                  videoRef.current.muted = true;
                  setIsFeedMuted(true);
                  videoRef.current.play().catch(() => {});
                }
              });
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const cur = videoRef.current.currentTime;
              const dur = videoRef.current.duration || 1;
              setPlaybackProgress((cur / dur) * 100);
              setCurrentTimeSec(cur);
              setDurationSec(videoRef.current.duration || 0);
            }
          }}
          onLoadedData={() => {
            setIsVideoReady(true);
            if (isActive && videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch((err) => {
                if (err?.name === 'NotAllowedError' && videoRef.current) {
                  videoRef.current.muted = true;
                  setIsFeedMuted(true);
                  videoRef.current.play().catch(() => {});
                }
              });
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            setIsVideoReady(true);
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setIsVideoReady(true);
          }}
          onPause={() => setIsPlaying(false)}
          onCanPlay={() => {
            setIsVideoReady(true);
            if (isActive && videoRef.current && videoRef.current.paused && isPlaying) {
              videoRef.current.muted = isFeedMuted;
              videoRef.current.play().catch((err) => {
                if (err?.name === 'NotAllowedError' && videoRef.current) {
                  videoRef.current.muted = true;
                  setIsFeedMuted(true);
                  videoRef.current.play().catch(() => {});
                }
              });
            }
          }}
          onEnded={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(() => {});
            }
          }}
          onError={handleVideoError}
          className={`pointer-events-none transition-all duration-300 z-2 ${
            (isCinemaMode && isActive)
              ? (isScreenPortrait ? 'w-[100vh] h-[100vw] object-contain rotate-90 max-w-none max-h-none' : 'w-full h-full object-contain')
              : (isLandscape ? 'w-full h-full object-contain' : 'w-full h-full object-cover')
          }`}
        />
      ) : null}

      {/* Sleek buffering indicator over poster layer while warming up */}
      {!isVideoReady && !hasError && activeSrc && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin" />
        </div>
      )}

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
      {!(isCinemaMode && isActive) && (
        <button
          onClick={toggleMute}
          aria-label="Toggle mute"
          className="absolute top-16 right-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white border border-white/20 active:scale-95 transition-transform"
        >
          {isFeedMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      )}

      {/* Horizontal Landscape Cinema Mode Button */}
      {isLandscape && !(isCinemaMode && isActive) && !isCleanScreen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsCinemaMode(true);
            sounds.playLikePop();
          }}
          className="absolute top-28 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 text-white shadow-xl active:scale-95 transition-all text-xs font-bold"
          title="Watch in Fullscreen Landscape"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Rotate View</span>
        </button>
      )}

      {/* Fullscreen Landscape Cinema Mode Overlay */}
      {isCinemaMode && isActive && (
        <div 
          className={`absolute inset-0 z-30 select-none flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          } ${
            isScreenPortrait
              ? 'w-[100vh] h-[100vw] rotate-90 origin-center p-3 sm:p-5'
              : 'w-full h-full p-3 sm:p-5'
          }`}
        >
          {/* Top Bar: Back/Close, Title, Creator, Duration, Mute & Exit */}
          <div className="flex items-center justify-between z-20 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent p-2.5 rounded-2xl backdrop-blur-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCinemaMode(false);
                }}
                className="w-9 h-9 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-transform shrink-0"
                aria-label="Exit rotate view"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate drop-shadow max-w-[200px] sm:max-w-xs">{video.title}</h3>
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <span className="text-amber-400">@{video.creator?.username}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-neutral-200 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                    {Math.floor(currentTimeSec)}s / {Math.floor(durationSec)}s
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetControlsTimer();
                  toggleMute(e);
                }}
                className="w-9 h-9 rounded-full bg-neutral-900/90 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
                aria-label={isFeedMuted ? 'Unmute' : 'Mute'}
              >
                {isFeedMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCinemaMode(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Center Play/Pause Indicator (Only visible if paused) */}
          <div className="flex-1 w-full flex items-center justify-center pointer-events-none">
            {!isPlaying && (
              <div 
                className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl animate-fade-in pointer-events-auto cursor-pointer active:scale-95 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                  resetControlsTimer();
                }}
              >
                <Play className="w-8 h-8 text-white ml-1 fill-white" />
              </div>
            )}
          </div>

          {/* Bottom Edge-Pinned Slim Duration Bar (YouTube/TikTok Style - NO blocking dark card) */}
          <div className="w-full z-20 pointer-events-auto pb-1 pt-3">
            <div 
              onClick={handleScrub}
              className="w-full py-2 cursor-pointer group flex items-center"
            >
              <div className="w-full bg-white/25 hover:bg-white/35 h-1 sm:h-1.5 rounded-full overflow-hidden transition-all duration-150 backdrop-blur-xs">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video vignette / gradient overlay for readable texts in normal vertical feed */}
      {!(isCinemaMode && isActive) && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
        </>
      )}
    </div>
  );
};
