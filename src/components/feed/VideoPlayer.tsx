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
  const { isFeedMuted, setIsFeedMuted } = useApp();
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
  const [isTheaterFullscreen, setIsTheaterFullscreen] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isScreenPortrait, setIsScreenPortrait] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : true
  );

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

  // Native phone back button listener to exit Theater Mode immediately
  useEffect(() => {
    if (!isTheaterFullscreen) return;
    let listenerHandle: any = null;
    try {
      CapApp.addListener('backButton', () => {
        setIsTheaterFullscreen(false);
      }).then((handle) => {
        listenerHandle = handle;
      });
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsTheaterFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTheaterFullscreen]);

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
      style={{ touchAction: 'none' }}
      className={`overflow-hidden flex items-center justify-center cursor-pointer select-none touch-none ${
        isTheaterFullscreen
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
            isTheaterFullscreen
              ? (isScreenPortrait ? 'w-[100vh] h-[100vw] object-contain rotate-90 max-w-none max-h-none' : 'w-full h-full object-contain')
              : (isLandscape ? 'w-full h-full object-contain' : 'w-full h-full object-cover')
          } ${
            isVideoReady ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
        />
      )}

      {/* Ambient Glow Backdrop for Horizontal Landscape Videos */}
      {isLandscape && !isTheaterFullscreen && video.thumbnailUrl && (
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
            if (videoRef.current && isTheaterFullscreen) {
              const cur = videoRef.current.currentTime;
              const dur = videoRef.current.duration || 1;
              setPlaybackProgress((cur / dur) * 100);
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
            isTheaterFullscreen
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
      {!isTheaterFullscreen && (
        <button
          onClick={toggleMute}
          aria-label="Toggle mute"
          className="absolute top-16 right-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white border border-white/20 active:scale-95 transition-transform"
        >
          {isFeedMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      )}

      {/* Horizontal Landscape Cinema Mode Button */}
      {isLandscape && !isTheaterFullscreen && !isCleanScreen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsTheaterFullscreen(true);
            sounds.playLikePop();
          }}
          className="absolute top-28 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 text-white shadow-xl active:scale-95 transition-all text-xs font-bold"
          title="Watch in Fullscreen Landscape"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Rotate View</span>
        </button>
      )}

      {/* Fullscreen Landscape Theater Mode Overlay */}
      {isTheaterFullscreen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-0 z-30 flex flex-col justify-between select-none pointer-events-none ${
            isScreenPortrait
              ? 'w-[100vh] h-[100vw] rotate-90 origin-center p-4'
              : 'w-full h-full p-4 sm:p-6'
          }`}
        >
          {/* Top Bar with Title, Handle & Exit Button */}
          <div className="flex items-center justify-between z-20 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent p-2.5 rounded-2xl backdrop-blur-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsTheaterFullscreen(false)}
                className="w-9 h-9 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-transform shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate drop-shadow">{video.title}</h3>
                <p className="text-[11px] text-amber-400 font-mono">@{video.creator?.username} • 16:9 Landscape</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleMute}
                className="w-9 h-9 rounded-full bg-neutral-900/90 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
              >
                {isFeedMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
              <button
                type="button"
                onClick={() => setIsTheaterFullscreen(false)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Interactive Tap Zone to Play / Pause in Fullscreen */}
          <div 
            onClick={() => {
              const vid = videoRef.current;
              if (vid) {
                if (vid.paused) {
                  vid.play().catch(() => {});
                  setIsPlaying(true);
                } else {
                  vid.pause();
                  setIsPlaying(false);
                }
              }
            }}
            className="flex-1 w-full flex items-center justify-center cursor-pointer pointer-events-auto my-2"
          >
            {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-xl pointer-events-none">
                <Play className="w-8 h-8 text-white ml-1 fill-white" />
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="flex flex-col gap-2 z-20 bg-neutral-950/85 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-neutral-800 pointer-events-auto">
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                if (videoRef.current && videoRef.current.duration) {
                  videoRef.current.currentTime = ratio * videoRef.current.duration;
                }
              }}
              className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden cursor-pointer"
            >
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-150"
                style={{ width: `${playbackProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-300 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  const vid = videoRef.current;
                  if (vid) {
                    if (vid.paused) {
                      vid.play().catch(() => {});
                      setIsPlaying(true);
                    } else {
                      vid.pause();
                      setIsPlaying(false);
                    }
                  }
                }}
                className="text-white hover:text-amber-400 font-bold flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 fill-white text-white" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <span className="text-[11px] text-neutral-400 font-mono">
                {videoRef.current ? Math.floor(videoRef.current.currentTime) : 0}s / {videoRef.current ? Math.floor(videoRef.current.duration || 0) : 0}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Video vignette / gradient overlay for readable texts in normal vertical feed */}
      {!isTheaterFullscreen && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
        </>
      )}
    </div>
  );
};
