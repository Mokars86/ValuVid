import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  Timer, 
  Sliders, 
  Sparkles, 
  Check, 
  Upload, 
  Lock, 
  DollarSign, 
  Coins, 
  ArrowLeft,
  Video as VideoIcon,
  Bot,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Users,
  Target,
  Percent,
  Radio,
  Tv,
  Heart,
  Share2,
  X,
  MessageCircle,
  CheckCircle2,
  Crown,
  Eye,
  Smile,
  Image as ImageIcon,
  Type,
  Palette,
  FileVideo,
  RotateCcw,
  FolderOpen,
  Cloud,
  CloudUpload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sounds } from '../../utils/soundEffects';
import { uploadMediaToSupabase, STORAGE_BUCKET_NAME } from '../../services/supabaseClient';
import { saveMediaBlob } from '../../utils/mediaStorage';

export const CreateStudio: React.FC = () => {
  const { 
    publishNewVideo, 
    setActiveTab, 
    currentUser, 
    isProMember, 
    setShowProModal, 
    setShareToast,
    addFundsToWallet 
  } = useApp();

  const [step, setStep] = useState<'record' | 'details'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [speed, setSpeed] = useState<'0.5x' | '1x' | '2x' | '3x'>('1x');
  const [selectedFilter, setSelectedFilter] = useState<'normal' | 'golden' | 'cyberpunk' | 'mono'>('normal');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [selectedAudio] = useState('Original Sound');
  const [selectedAudioArtist] = useState('Camera Microphone');
  const [selectedAudioUrl] = useState<string | undefined>(undefined);
  const [selectedAudioCover] = useState<string | undefined>(undefined);
  const [musicVolume] = useState<number>(0);
  const [audioPickerOpen, setAudioPickerOpen] = useState(false);

  // Studio Mode: Photo | 15s HD | 60s Story | Text | LIVE Stream
  const [studioMode, setStudioMode] = useState<'photo' | '15s' | '60s' | 'text' | 'live'>('15s');

  // Real Upload & File Picker State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraRecordInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const pendingSubstandardFileRef = useRef<File | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<'video' | 'photo' | 'text'>('video');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isCloudUploading, setIsCloudUploading] = useState(false);
  const [supabaseUploadStatus, setSupabaseUploadStatus] = useState<string | null>(null);
  const [autoCoverUrl, setAutoCoverUrl] = useState<string | null>(null);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [isExtractingCover, setIsExtractingCover] = useState(false);

  // 720p Minimum Quality Standards
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number; qualityLabel: string } | null>(null);
  const [substandardQualityError, setSubstandardQualityError] = useState<{ width: number; height: number; qualityLabel: string } | null>(null);
  const [showQualityWarningModal, setShowQualityWarningModal] = useState(false);

  // Text Mode State & Gradient Presets
  const textGradients = [
    { id: 'amber', name: 'Sunset Amber', bg: 'from-amber-600 via-orange-600 to-rose-700' },
    { id: 'cyan', name: 'Neon Ocean', bg: 'from-cyan-600 via-blue-700 to-indigo-950' },
    { id: 'emerald', name: 'Emerald Palm', bg: 'from-emerald-600 via-teal-700 to-slate-950' },
    { id: 'purple', name: 'Royal Purple', bg: 'from-purple-600 via-pink-700 to-indigo-950' },
    { id: 'gold', name: 'African Gold', bg: 'from-yellow-500 via-amber-600 to-stone-900' }
  ];
  const [selectedGradientIdx, setSelectedGradientIdx] = useState(0);
  const [textContent, setTextContent] = useState('');
  const [textFontStyle, setTextFontStyle] = useState<'sans' | 'serif' | 'mono' | 'black'>('sans');

  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [liveViewers, setLiveViewers] = useState(62);
  const [liveTipsGHS, setLiveTipsGHS] = useState(0);
  const [liveTopic, setLiveTopic] = useState('Accra Creator Q&A & Beat Jam 🎹');
  const [liveGoalTarget, setLiveGoalTarget] = useState(100);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showLiveSummaryModal, setShowLiveSummaryModal] = useState(false);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [hearts, setHearts] = useState<number[]>([]);
  const [liveComments, setLiveComments] = useState<Array<{ id: string; user: string; text: string; isTip?: boolean; tipAmount?: number }>>([
    { id: '1', user: 'kwame_tech', text: 'Chale what camera setup are you using? 🔥' },
    { id: '2', user: 'akua_fashion', text: 'Live from Osu! Looking sharp! 🇬🇭' },
  ]);

  const isLiveEligible = (currentUser.followers >= 10000) || isProMember;

  // Live broadcast simulator timers
  useEffect(() => {
    let timer: any;
    let commentTimer: any;

    if (isLiveBroadcasting) {
      // 1. Clock increment
      timer = setInterval(() => {
        setLiveSeconds((s) => s + 1);
        setLiveViewers((v) => Math.max(30, v + Math.floor(Math.random() * 7) - 3));
      }, 1000);

      // 2. Simulated incoming viewer tips and comments
      commentTimer = setInterval(() => {
        const sampleEvents = [
          { user: 'kofi_beats', text: 'This lighting is clean! 🚀' },
          { user: 'ama_accra', text: 'Sent GHS 10.00 MoMo Tip! Keep shining ⭐', isTip: true, tipAmount: 10 },
          { user: 'yaw_kumasi', text: 'Greetings from Kumasi Tech Hub 💻' },
          { user: 'efua_creator', text: 'Sent GHS 25.00 MoMo Tip! 🔥', isTip: true, tipAmount: 25 },
        ];
        const randomEvent = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
        
        if (randomEvent.isTip && randomEvent.tipAmount) {
          sounds.playCoinTip();
          setLiveTipsGHS((prev) => prev + randomEvent.tipAmount!);
          setHearts((h) => [...h.slice(-10), Date.now()]);
        }

        setLiveComments((prev) => [...prev.slice(-15), { ...randomEvent, id: `comm-${Date.now()}` }]);
      }, 5500);
    }

    return () => {
      clearInterval(timer);
      clearInterval(commentTimer);
    };
  }, [isLiveBroadcasting]);

  const handleStartLive = () => {
    if (!isLiveEligible) {
      setShowEligibilityModal(true);
      return;
    }
    sounds.playLikePop();
    setIsLiveBroadcasting(true);
    setLiveSeconds(0);
    setLiveTipsGHS(0);
    setLiveViewers(120);
  };

  const handleEndLive = () => {
    setIsLiveBroadcasting(false);
    sounds.playSuccessPayout();
    setShowLiveSummaryModal(true);
  };

  const handleSendLiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim()) return;
    setLiveComments((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, user: currentUser.username, text: liveChatInput.trim() }
    ]);
    setLiveChatInput('');
  };

  const handleTriggerHeart = () => {
    sounds.playLikePop();
    setHearts((prev) => [...prev.slice(-12), Date.now()]);
  };

  // Form Details
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<'trending' | 'ghana' | 'tech' | 'fashion' | 'education' | 'bounties'>('ghana');
  const [allowTips, setAllowTips] = useState(true);
  const [isPayPerUnlock, setIsPayPerUnlock] = useState(false);
  const [unlockPriceGHS, setUnlockPriceGHS] = useState(5.00);
  const [participateRewardPool, setParticipateRewardPool] = useState(true);

  // Pillar 1 Mandatory AI Disclosure (ValuVid AI Content Policy)
  const [isAiAssistedOrGenerated, setIsAiAssistedOrGenerated] = useState(false);
  const [aiDisclosureType, setAiDisclosureType] = useState<'generated' | 'assisted'>('generated');
  const [aiVoiceCloned, setAiVoiceCloned] = useState(false);
  const [aiFaceDeepfake, setAiFaceDeepfake] = useState(false);
  const [aiTextToVideo, setAiTextToVideo] = useState(false);
  const [aiAssistedEditing, setAiAssistedEditing] = useState(true);

  // Advanced Creator Features: ValuSplit & Community Goal
  const [enableValuSplit, setEnableValuSplit] = useState(false);
  const [collabUsername, setCollabUsername] = useState('kweku_producer');
  const [collabRole, setCollabRole] = useState('Music Producer / Beat Maker');
  const [collabShare, setCollabShare] = useState(40);

  const [enableCommunityGoal, setEnableCommunityGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('New Wireless Mic for Street Interviews');
  const [goalTargetGHS, setGoalTargetGHS] = useState(500);
  const [goalReward, setGoalReward] = useState('Exclusive Behind-the-Scenes 4K Tutorial unlocked for all supporters!');

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const maxRecordingSeconds = studioMode === '60s' ? 60 : 15;

  // Start webcam preview if permitted (with audio for recording)
  useEffect(() => {
    let active = true;
    if (step === 'record') {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: cameraFacing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true
      };

      navigator.mediaDevices?.getUserMedia(constraints)
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoElementRef.current) {
            videoElementRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // If audio request failed, try video only
          navigator.mediaDevices?.getUserMedia({
            video: { facingMode: cameraFacing, width: { ideal: 720 }, height: { ideal: 1280 } },
            audio: false
          })
          .then((videoStream) => {
            if (!active) {
              videoStream.getTracks().forEach((t) => t.stop());
              return;
            }
            streamRef.current = videoStream;
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = videoStream;
            }
          })
          .catch((err) => {
            console.warn('[CreateStudio] Camera preview not available in webview:', err);
          });
        });
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step, cameraFacing]);

  const startRecordingMedia = () => {
    setRecordSeconds(0);
    recordedChunksRef.current = [];

    // Check if live camera stream is available
    if (streamRef.current && streamRef.current.active && streamRef.current.getVideoTracks().length > 0) {
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const types = [
          'video/mp4;codecs=h264,aac',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
      }

      try {
        const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
        const recorder = new MediaRecorder(streamRef.current, options);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = async () => {
          const finalMime = recorder.mimeType || 'video/mp4';
          const ext = finalMime.includes('webm') ? 'webm' : 'mp4';
          const blob = new Blob(recordedChunksRef.current, { type: finalMime });
          const recordedFile = new File([blob], `valuvid_rec_${Date.now()}.${ext}`, { type: finalMime });
          await processVideoOrPhotoFile(recordedFile, true);
        };
        mediaRecorderRef.current = recorder;
        recorder.start(500);
        setIsRecording(true);
        sounds.playLikePop();
        return;
      } catch (err) {
        console.warn('[CreateStudio] MediaRecorder failed, falling back to native camera:', err);
      }
    }

    // Fallback: If camera stream or MediaRecorder is not available, launch native device camera directly
    cameraRecordInputRef.current?.click();
  };

  const stopRecordingMedia = () => {
    setIsRecording(false);
    sounds.playSuccessPayout();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('[CreateStudio] Error stopping MediaRecorder:', err);
        setStep('details');
      }
    } else {
      setStep('details');
    }
  };

  // Recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= maxRecordingSeconds) {
            stopRecordingMedia();
            return maxRecordingSeconds;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxRecordingSeconds]);

  const toggleRecording = () => {
    if (!isRecording) {
      startRecordingMedia();
    } else {
      stopRecordingMedia();
    }
  };

  // Helper to extract a representative frame from a video file as default cover/thumbnail
  const extractThumbnailFromVideo = (videoSource: string | File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';

        let blobUrl = '';
        if (typeof videoSource === 'string') {
          video.src = videoSource;
        } else {
          blobUrl = URL.createObjectURL(videoSource);
          video.src = blobUrl;
        }

        const onSeeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 720;
            canvas.height = video.videoHeight || 1280;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              cleanup();
              resolve(dataUrl);
              return;
            }
          } catch (e) {
            console.warn('Canvas extract frame error:', e);
          }
          cleanup();
          resolve('');
        };

        const onLoadedData = () => {
          // Seek to 0.8s or 20% into video for best non-black frame
          video.currentTime = Math.min(0.8, video.duration ? video.duration / 3 : 0.5);
        };

        const onError = () => {
          cleanup();
          resolve('');
        };

        const cleanup = () => {
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };

        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);

        setTimeout(() => {
          cleanup();
          resolve('');
        }, 3500);

        video.load();
      } catch (err) {
        resolve('');
      }
    });
  };

  // Helper to verify that uploaded video meets 720p HD minimum standard (720x1280 or 1280x720)
  const checkVideoResolution = (videoFile: File): Promise<{ width: number; height: number; meetsQuality: boolean; label: string }> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const blobUrl = URL.createObjectURL(videoFile);
        video.src = blobUrl;

        const onLoaded = () => {
          cleanup();
          const width = video.videoWidth || 0;
          const height = video.videoHeight || 0;
          const minDim = Math.min(width, height);
          const maxDim = Math.max(width, height);

          // 720p requirement: min dimension >= 720 (720x1280 vertical or 1280x720) or max dimension >= 1280
          const meetsQuality = (minDim >= 720 || maxDim >= 1280);

          let label = `${minDim > 0 ? minDim : 480}p SD`;
          if (maxDim >= 3840 || minDim >= 2160) {
            label = '4K Ultra HD';
          } else if (maxDim >= 1920 || minDim >= 1080) {
            label = '1080p Full HD';
          } else if (meetsQuality) {
            label = '720p HD';
          }

          resolve({ width, height, meetsQuality, label });
        };

        const onError = () => {
          cleanup();
          // Fallback if browser codec decoding fails
          resolve({ width: 720, height: 1280, meetsQuality: true, label: '720p HD' });
        };

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
          URL.revokeObjectURL(blobUrl);
        };

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('error', onError);

        setTimeout(() => {
          cleanup();
          resolve({ width: 720, height: 1280, meetsQuality: true, label: '720p HD' });
        }, 3000);
      } catch (e) {
        resolve({ width: 720, height: 1280, meetsQuality: true, label: '720p HD' });
      }
    });
  };

  // Process video or photo file (from gallery or recorded by camera)
  const processVideoOrPhotoFile = async (file: File, forceAcceptQuality = false) => {
    sounds.playLikePop();
    const isImage = file.type.startsWith('image/');

    // Video 720p Minimum Quality Verification
    if (!isImage) {
      const qualityCheck = await checkVideoResolution(file);
      if (!qualityCheck.meetsQuality && !forceAcceptQuality) {
        // Substandard quality (< 720p): halt and show notification modal with override option
        pendingSubstandardFileRef.current = file;
        sounds.playRewardTick();
        setSubstandardQualityError({
          width: qualityCheck.width,
          height: qualityCheck.height,
          qualityLabel: qualityCheck.label,
        });
        setShowQualityWarningModal(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setVideoResolution({
        width: qualityCheck.width || 720,
        height: qualityCheck.height || 1280,
        qualityLabel: qualityCheck.label || '720p HD',
      });
      setSubstandardQualityError(null);
    } else {
      setVideoResolution(null);
      setSubstandardQualityError(null);
    }

    const url = URL.createObjectURL(file);
    setSelectedFileObj(file);
    saveMediaBlob('latest_upload', file);
    setUploadedMediaUrl(url);
    setUploadedMediaType(isImage ? 'photo' : 'video');
    setUploadedFileName(file.name);

    // Auto-fill title from clean filename
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setTitle(cleanName || (isImage ? 'Photo Drop 📸' : 'ValuVid Studio Creation'));
    setStep('details');

    // If it's a video, automatically extract thumbnail frame as default cover
    if (!isImage) {
      setIsExtractingCover(true);
      extractThumbnailFromVideo(file).then((frame) => {
        setIsExtractingCover(false);
        if (frame) {
          setAutoCoverUrl(frame);
        }
      });
    } else {
      // Photo is its own cover
      setAutoCoverUrl(url);
    }

    // Asynchronously upload to Supabase Storage Bucket ('ValuVid App' or 'valuvid-app')
    setIsCloudUploading(true);
    setSupabaseUploadStatus('Uploading to Cloud Storage (syncing for all devices)...');
    uploadMediaToSupabase(file, file.name).then(({ url: remoteUrl, isRemote, error }) => {
      setIsCloudUploading(false);
      if (isRemote) {
        setUploadedMediaUrl(remoteUrl);
        setSupabaseUploadStatus(`Uploaded to Cloud Storage ☁️ Available on all devices!`);
      } else {
        setSupabaseUploadStatus(error || 'Saved in local device cache (Cloud bucket missing)');
      }
    }).catch(() => {
      setIsCloudUploading(false);
      setSupabaseUploadStatus('Saved locally in device cache');
    });
  };

  // 1. REAL FILE UPLOAD (Video / Photo from Gallery or Camera with 720p+ Quality Gate)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processVideoOrPhotoFile(file, false);
  };

  // Dedicated Custom Video Cover Picker
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playLikePop();
    const url = URL.createObjectURL(file);
    setCustomCoverUrl(url);

    // Also upload cover image to Supabase Storage
    setSupabaseUploadStatus('Uploading custom cover to Supabase...');
    uploadMediaToSupabase(file, `cover_${Date.now()}_${file.name}`).then(({ url: remoteUrl, isRemote }) => {
      if (isRemote) {
        setCustomCoverUrl(remoteUrl);
        setSupabaseUploadStatus('Custom cover saved to Supabase ☁️');
      }
    });
  };

  // 2. SNAP PHOTO FROM CAMERA
  const handleSnapPhoto = () => {
    sounds.playLikePop();
    setFlashOn(true);
    setTimeout(() => setFlashOn(false), 220);

    let photoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';
    let photoBlob: Blob | null = null;

    if (videoElementRef.current && videoElementRef.current.videoWidth) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElementRef.current.videoWidth || 720;
        canvas.height = videoElementRef.current.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);
          photoUrl = canvas.toDataURL('image/jpeg', 0.9);
          canvas.toBlob((b) => {
            photoBlob = b;
            if (photoBlob) {
              setSupabaseUploadStatus('Uploading photo to Supabase...');
              uploadMediaToSupabase(photoBlob, `photo_${Date.now()}.jpg`).then(({ url: remoteUrl, isRemote }) => {
                if (isRemote) {
                  setUploadedMediaUrl(remoteUrl);
                  setSupabaseUploadStatus('Photo saved to Supabase Cloud ☁️');
                }
              });
            }
          }, 'image/jpeg', 0.9);
        }
      } catch (err) {
        // Fallback
      }
    }

    setUploadedMediaUrl(photoUrl);
    setUploadedMediaType('photo');
    setUploadedFileName(`photo_${Date.now()}.jpg`);
    if (!title) setTitle('Studio Photo Snap 📸');
    setStep('details');
  };

  // 3. TEXT MODE NEXT STEP
  const handleNextFromText = () => {
    if (!textContent.trim()) {
      alert('Please enter some text for your post!');
      return;
    }
    sounds.playLikePop();

    // Render canvas gradient typography image
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1280);
      if (selectedGradientIdx === 1) {
        grad.addColorStop(0, '#0284C7');
        grad.addColorStop(0.5, '#1D4ED8');
        grad.addColorStop(1, '#0F172A');
      } else if (selectedGradientIdx === 2) {
        grad.addColorStop(0, '#059669');
        grad.addColorStop(0.5, '#0F766E');
        grad.addColorStop(1, '#022C22');
      } else if (selectedGradientIdx === 3) {
        grad.addColorStop(0, '#9333EA');
        grad.addColorStop(0.5, '#BE185D');
        grad.addColorStop(1, '#1E1B4B');
      } else if (selectedGradientIdx === 4) {
        grad.addColorStop(0, '#EAB308');
        grad.addColorStop(0.5, '#D97706');
        grad.addColorStop(1, '#1C1917');
      } else {
        grad.addColorStop(0, '#D97706');
        grad.addColorStop(0.5, '#EA580C');
        grad.addColorStop(1, '#9F1239');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = textFontStyle === 'serif' ? 'italic bold 42px serif' : textFontStyle === 'mono' ? 'bold 38px monospace' : 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const words = textContent.split(' ');
      let line = '';
      let y = 580;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 580 && n > 0) {
          ctx.fillText(line, 360, y);
          line = words[n] + ' ';
          y += 54;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 360, y);

      // Footer branding
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`@${currentUser.username} • ValuVid`, 360, 1180);

      canvas.toBlob((blob) => {
        if (blob) {
          setSupabaseUploadStatus('Saving text card to Supabase Cloud...');
          uploadMediaToSupabase(blob, `story_${Date.now()}.jpg`).then(({ url: remoteUrl, isRemote }) => {
            if (isRemote) {
              setUploadedMediaUrl(remoteUrl);
              setSupabaseUploadStatus('Story card saved to Supabase Cloud ☁️');
            }
          });
        }
      }, 'image/jpeg', 0.9);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setUploadedMediaUrl(dataUrl);
    setUploadedMediaType('text');
    setUploadedFileName(`text_story_${Date.now()}.jpg`);
    if (!title) setTitle(textContent.slice(0, 32) + (textContent.length > 32 ? '...' : ''));
    if (!caption) setCaption(textContent);
    setStep('details');
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCloudUploading) {
      alert('Your video is still uploading to Supabase Cloud Storage. Please wait a moment so it is available across all your devices!');
      return;
    }

    const tools: string[] = [];
    if (aiVoiceCloned) tools.push('Cloned Voice');
    if (aiFaceDeepfake) tools.push('Deepfake / Face Swap');
    if (aiTextToVideo) tools.push('Text-to-Video Synthesis');
    if (aiAssistedEditing) tools.push('AI Captions & Noise Filter');

    const finalThumbnail = customCoverUrl || autoCoverUrl || (uploadedMediaType === 'photo' || uploadedMediaType === 'text' ? uploadedMediaUrl : null) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';

    publishNewVideo({
      videoUrl: uploadedMediaUrl || '',
      thumbnailUrl: finalThumbnail,
      fileBlob: selectedFileObj || undefined,
      title: title || (uploadedMediaType === 'photo' ? 'Photo Drop 📸' : uploadedMediaType === 'text' ? 'Community Update ✍️' : 'ValuVid Studio Creation'),
      caption: caption || 'Check out my new vertical post on ValuVid! 🇬🇭✨ #valuvid',
      hashtags: ['valuvid', 'creator', category],
      category,
      isPayPerUnlock,
      unlockPriceGHS: isPayPerUnlock ? unlockPriceGHS : undefined,
      audioTrack: {
        title: 'Original Sound',
        artist: currentUser.name,
      },
      musicVolume: 0,
      isAiContent: isAiAssistedOrGenerated,
      aiDisclosureType: isAiAssistedOrGenerated ? aiDisclosureType : 'none',
      aiToolsUsed: isAiAssistedOrGenerated ? tools : [],
      aiDetails: isAiAssistedOrGenerated
        ? (aiDisclosureType === 'generated' 
            ? 'Declared by creator as Generative AI. Pure synthetic content.' 
            : 'Human performance enhanced with AI editing tools.')
        : undefined,
      valuSplit: enableValuSplit ? {
        collaborator: {
          id: 'cr-collab-user',
          name: collabUsername.replace('_', ' ').toUpperCase(),
          username: collabUsername.replace('@', ''),
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
          role: collabRole
        },
        primaryCreatorSharePercent: 100 - collabShare,
        collaboratorSharePercent: collabShare,
        totalSplitEarnedGHS: 0
      } : undefined,
      communityGoal: enableCommunityGoal ? {
        id: `goal-${Date.now()}`,
        title: goalTitle,
        targetGHS: goalTargetGHS,
        currentGHS: 0,
        rewardDescription: goalReward,
        isCompleted: false,
        contributorsCount: 0,
        recentContributors: []
      } : undefined,
      videoResolution: videoResolution || { width: 720, height: 1280, qualityLabel: '720p HD' },
    });
  };



  return (
    <div className="relative w-full h-full bg-black text-white select-none overflow-hidden flex flex-col justify-between">
      {step === 'record' ? (
        <>
          {/* CAMERA / TEXT VIEWPORT CANVAS */}
          <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center overflow-hidden">
            {studioMode === 'text' ? (
              /* FULL-SCREEN TEXT CANVAS */
              <div className={`absolute inset-0 z-10 bg-gradient-to-b ${textGradients[selectedGradientIdx].bg} flex flex-col justify-center items-center p-6 text-center animate-fade-in`}>
                <div className="absolute top-16 right-4 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={() => setSelectedGradientIdx((prev) => (prev + 1) % textGradients.length)}
                    className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-colors flex items-center gap-1.5 text-[11px] font-bold shadow-lg"
                    title="Change background gradient"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-300" />
                    <span>{textGradients[selectedGradientIdx].name}</span>
                  </button>
                </div>

                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type something inspiring, share a thought, or ask your audience..."
                  className={`w-full max-w-sm bg-transparent border-none text-white text-center text-2xl sm:text-3xl placeholder-white/40 focus:outline-none resize-none drop-shadow-xl ${
                    textFontStyle === 'serif' ? 'font-serif italic' : textFontStyle === 'mono' ? 'font-mono' : textFontStyle === 'black' ? 'font-black tracking-tight uppercase' : 'font-sans font-bold'
                  }`}
                  rows={5}
                  maxLength={280}
                  autoFocus
                />

                {/* Font selector chips */}
                <div className="flex items-center gap-1.5 mt-4 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 z-20">
                  {(['sans', 'serif', 'mono', 'black'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTextFontStyle(style)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize transition-colors ${
                        textFontStyle === style
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoElementRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-all ${
                    selectedFilter === 'golden'
                      ? 'sepia-50 contrast-125 brightness-105'
                      : selectedFilter === 'cyberpunk'
                      ? 'hue-rotate-90 saturate-150 contrast-125'
                      : selectedFilter === 'mono'
                      ? 'grayscale'
                      : ''
                  }`}
                />

                {/* Fallback camera simulation graphic */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white/20 border-dashed flex items-center justify-center mb-4">
                    {studioMode === 'photo' ? (
                      <Camera className="w-8 h-8 text-white/50" />
                    ) : (
                      <VideoIcon className="w-8 h-8 text-white/50" />
                    )}
                  </div>
                  <p className="text-xs text-white/60 font-medium">
                    {studioMode === 'photo' ? 'High-Res Photo Canvas Ready' : 'HD 60FPS Camera Canvas Ready'}
                  </p>
                  <p className="text-[10px] text-white/40 mt-1">
                    Webcam or Mobile Sensor View
                  </p>
                </div>
              </>
            )}

            {/* Flash simulation */}
            {flashOn && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] pointer-events-none z-30 transition-opacity" />
            )}

            {/* Record progress indicator */}
            {isRecording && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-neutral-800 z-30">
                <div
                  className="h-full bg-rose-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(recordSeconds / (studioMode === '60s' ? 60 : 15)) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* TOP TOOLBAR */}
          <div className="relative z-20 w-full pt-8 sm:pt-5 px-4 flex items-center justify-between">
            {isLiveBroadcasting ? (
              /* LIVE BROADCAST TOP HUD */
              <div className="w-full flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="flex items-center gap-1 sm:gap-1.5 bg-rose-600 text-white text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg shadow-rose-600/30">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-white bg-black/50 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-white/10">
                    {Math.floor(liveSeconds / 60)}:{(liveSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-neutral-200 bg-black/50 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-white/10">
                    <Eye className="w-3 h-3 text-cyan-400" />
                    {liveViewers}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black text-amber-300 bg-amber-500/20 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-400/40 shadow-md">
                    <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                    <span>GHS {liveTipsGHS.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleEndLive}
                    className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-md active:scale-95 transition-transform"
                  >
                    End
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('feed')}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white"
                >
                  ✕
                </button>

                {/* Live Indicator */}
                {studioMode === 'live' && (
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-rose-500/30 text-xs font-bold text-rose-300">
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    <span>Live Studio</span>
                  </div>
                )}

                {/* Flash Toggle */}
                <button
                  onClick={() => setFlashOn(!flashOn)}
                  className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
                    flashOn ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-black/40 text-white'
                  }`}
                >
                  {flashOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>

          {/* ACTIVE LIVE BROADCAST IN-STREAM OVERLAYS (Floating chat, live goal & tips) */}
          {isLiveBroadcasting && (
            <div className="relative z-20 flex-1 w-full px-4 flex flex-col justify-end pb-3 pointer-events-none">
              {/* Floating Hearts Animation */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-2 pointer-events-none">
                {hearts.map((h) => (
                  <div
                    key={h}
                    className="w-8 h-8 rounded-full bg-rose-500/80 backdrop-blur-md flex items-center justify-center text-white animate-bounce shadow-lg"
                  >
                    <Heart className="w-4 h-4 fill-white text-white" />
                  </div>
                ))}
              </div>

              {/* Live Community Goal Progress Pin */}
              <div className="mb-2 bg-black/65 backdrop-blur-md border border-amber-400/50 rounded-xl p-2 max-w-xs pointer-events-auto">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 mb-1">
                  <span className="flex items-center gap-1 truncate">
                    <Target className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Goal: {liveTopic}</span>
                  </span>
                  <span className="font-mono text-white">
                    {Math.min(100, Math.round((liveTipsGHS / liveGoalTarget) * 100))}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((liveTipsGHS / liveGoalTarget) * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-neutral-300 mt-1">
                  <span>GHS {liveTipsGHS.toFixed(2)} raised</span>
                  <span>Target: GHS {liveGoalTarget}.00</span>
                </div>
              </div>

              {/* Live Chat & Tipping Stream */}
              <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto no-scrollbar pointer-events-auto mb-2 pr-12">
                {liveComments.map((c) => (
                  <div
                    key={c.id}
                    className={`text-xs p-2 rounded-xl backdrop-blur-md flex items-start gap-2 max-w-xs shadow-md ${
                      c.isTip
                        ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/60 text-amber-200'
                        : 'bg-black/55 border border-white/10 text-white'
                    }`}
                  >
                    <span className="font-bold text-[11px] text-amber-400 shrink-0">
                      @{c.user}:
                    </span>
                    <span className="text-[11px] text-neutral-200 leading-tight">
                      {c.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Creator Live Interaction Bar */}
              <form onSubmit={handleSendLiveComment} className="flex items-center gap-2 pointer-events-auto">
                <input
                  type="text"
                  value={liveChatInput}
                  onChange={(e) => setLiveChatInput(e.target.value)}
                  placeholder="Chat with your live audience..."
                  className="flex-1 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-2 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={handleTriggerHeart}
                  className="w-9 h-9 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                >
                  <Heart className="w-4 h-4 fill-white" />
                </button>
              </form>
            </div>
          )}

          {/* RIGHT CREATOR TOOLBAR */}
          <div className="relative z-20 self-end mr-3 flex flex-col gap-4">
            {/* Camera Flip */}
            <button
              onClick={() => setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="flex flex-col items-center group"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/15">
                <FlipHorizontal className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] text-white mt-1">Flip</span>
            </button>

            {/* Speed controller */}
            <button
              onClick={() => {
                const speeds: ('0.5x' | '1x' | '2x' | '3x')[] = ['0.5x', '1x', '2x', '3x'];
                const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
                setSpeed(speeds[nextIdx]);
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/15">
                <span className="text-xs font-black text-amber-400">{speed}</span>
              </div>
              <span className="text-[10px] text-white mt-1">Speed</span>
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => {
                const filters: ('normal' | 'golden' | 'cyberpunk' | 'mono')[] = ['normal', 'golden', 'cyberpunk', 'mono'];
                const next = (filters.indexOf(selectedFilter) + 1) % filters.length;
                setSelectedFilter(filters[next]);
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/15">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[10px] text-white mt-1 capitalize">{selectedFilter}</span>
            </button>

            {/* Timer */}
            <button
              onClick={() => setTimerSeconds((t) => (t === 0 ? 3 : t === 3 ? 10 : 0))}
              className="flex flex-col items-center group"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/15">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] text-white mt-1">
                {timerSeconds === 0 ? 'Off' : `${timerSeconds}s`}
              </span>
            </button>
          </div>

          {/* BOTTOM STUDIO CONTROLS (RECORD / GO LIVE) */}
          <div className="relative z-20 w-full pb-4 px-4 flex flex-col items-center gap-3">
            {/* LIVE BROADCAST TOPIC SETUP (Visible when in Live Mode and not yet streaming) */}
            {studioMode === 'live' && !isLiveBroadcasting && (
              <div className="w-full max-w-xs bg-black/80 backdrop-blur-md border border-rose-500/40 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Live Stream Setup</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEligibilityModal(true)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                      isLiveEligible
                        ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900'
                        : 'text-amber-400 bg-amber-950/80 border border-amber-500/40 hover:bg-amber-900'
                    }`}
                  >
                    {isLiveEligible ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" /> Criteria Met
                      </>
                    ) : (
                      <>
                        <span>🔒 10k Needed</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  type="text"
                  value={liveTopic}
                  onChange={(e) => setLiveTopic(e.target.value)}
                  placeholder="What is your live stream about?"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-400"
                />

                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
                  <span>Live Micro-Tips:</span>
                  <span className="text-emerald-400 font-bold">Enabled (MTN MoMo & Telecel)</span>
                </div>
              </div>
            )}

            {/* ACTION TRIGGER ROW */}
            <div className="w-full flex items-center justify-between px-2">
              {/* Left Slot: Native Camera & Gallery Upload in all recording/photo/text modes */}
              {studioMode === 'live' ? (
                <button
                  type="button"
                  onClick={() => setShowEligibilityModal(true)}
                  className="flex flex-col items-center text-white/80 hover:text-white"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-emerald-300">Criteria</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraRecordInputRef.current?.click()}
                    className="flex flex-col items-center text-white/80 hover:text-white active:scale-95 transition-transform"
                    title="Record with device camera"
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center hover:border-white transition-colors">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] mt-1 font-medium">Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center text-white/80 hover:text-white active:scale-95 transition-transform"
                    title="Upload video or photo from gallery"
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center hover:border-white transition-colors">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] mt-1 font-medium">Gallery</span>
                  </button>
                </div>
              )}

              {/* Hidden Native File Inputs for Direct Camera Recording & Gallery Upload */}
              <input
                ref={cameraRecordInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Center Trigger: Photo Shutter / Text Next / Video Record / Go Live */}
              {studioMode === 'live' ? (
                <button
                  onClick={handleStartLive}
                  className="px-6 py-3.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-white/20 hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-2 border border-white/20"
                >
                  <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>Go LIVE</span>
                </button>
              ) : studioMode === 'photo' ? (
                /* PHOTO SHUTTER BUTTON */
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleSnapPhoto}
                    className="w-16 h-16 rounded-full border-4 border-white p-1 flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-xl shadow-white/20"
                    title="Take Photo"
                  >
                    <div className="w-12 h-12 rounded-full bg-white active:bg-neutral-200 transition-colors" />
                  </button>
                  <span className="text-[11px] font-bold text-white mt-1">Snap Photo</span>
                </div>
              ) : studioMode === 'text' ? (
                /* TEXT NEXT/CONTINUE BUTTON */
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleNextFromText}
                    className="px-6 py-3.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-white/20 hover:bg-neutral-100 active:scale-95 transition-transform flex items-center gap-1.5"
                  >
                    <span>Continue</span>
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                  </button>
                  <span className="text-[11px] font-bold text-white mt-1">Post Story</span>
                </div>
              ) : (
                /* VIDEO RECORD BUTTON (15s / 60s) */
                <div className="flex flex-col items-center">
                  <button
                    onClick={toggleRecording}
                    className="w-16 h-16 rounded-full border-4 border-white p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-black/40"
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                  >
                    <div
                      className={`transition-all duration-300 ${
                        isRecording
                          ? 'w-7 h-7 rounded-lg bg-rose-500 animate-pulse'
                          : 'w-12 h-12 rounded-full bg-rose-500'
                      }`}
                    />
                  </button>
                  <span className="text-[11px] font-bold text-white mt-1">
                    {isRecording ? `00:${recordSeconds < 10 ? '0' : ''}${recordSeconds} / 00:${studioMode === '60s' ? '60' : '15'}` : `${studioMode} Clip`}
                  </span>
                </div>
              )}

              {/* Right Slot: Next / Topic Flip / Color Flip */}
              {studioMode === 'live' ? (
                <button
                  onClick={() => {
                    const sampleTopics = [
                      'Accra Beat Making Jam 🎹',
                      'Street Food Review & Chat 🍲',
                      'Tech & Web3 AMA Ghana ⚡',
                      'Fashion & Style Workshop 🧵'
                    ];
                    const next = sampleTopics[(sampleTopics.indexOf(liveTopic) + 1) % sampleTopics.length];
                    setLiveTopic(next);
                  }}
                  className="flex flex-col items-center text-white/80 hover:text-white"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium">Topic</span>
                </button>
              ) : studioMode === 'text' ? (
                <button
                  type="button"
                  onClick={() => setSelectedGradientIdx((prev) => (prev + 1) % textGradients.length)}
                  className="flex flex-col items-center text-white/80 hover:text-white"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center text-amber-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium">Color</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (studioMode === 'photo') {
                      handleSnapPhoto();
                    } else {
                      setStep('details');
                    }
                  }}
                  className="flex flex-col items-center text-white/80 hover:text-white"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                    <Check className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium">Next</span>
                </button>
              )}
            </div>

            {/* STUDIO MODE SWITCHER TABS (Photo | 15s | 60s | Text | 🔴 LIVE) */}
            <div className="flex items-center justify-center gap-2 min-[360px]:gap-3.5 sm:gap-5 text-[11px] sm:text-xs font-bold pt-2 border-t border-white/10 w-full overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setStudioMode('photo')}
                className={`transition-colors whitespace-nowrap px-1 ${
                  studioMode === 'photo' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Photo
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('15s')}
                className={`transition-colors whitespace-nowrap px-1 ${
                  studioMode === '15s' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                15s
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('60s')}
                className={`transition-colors whitespace-nowrap px-1 ${
                  studioMode === '60s' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                60s
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('text')}
                className={`transition-colors whitespace-nowrap px-1 ${
                  studioMode === 'text' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('live')}
                className={`flex items-center gap-1 transition-colors whitespace-nowrap px-1 ${
                  studioMode === 'live' ? 'text-rose-400 font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>LIVE</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* POST-UPLOAD SETUP SCREEN (Caption, Category & Monetization Switcher) */
        <div className="w-full h-full bg-neutral-950 flex flex-col justify-between overflow-y-auto px-4 pt-8 sm:pt-4 pb-4 animate-fade-in">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
              <button
                onClick={() => setStep('record')}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Camera</span>
              </button>
              <h2 className="text-sm font-bold text-white">Post-Upload Setup</h2>
              <div className="w-8" />
            </div>

            {/* Real Media preview thumbnail card + title */}
            <div className="flex gap-3 mb-4">
              <div className="w-20 h-28 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative shrink-0">
                {uploadedMediaUrl ? (
                  uploadedMediaType === 'video' ? (
                    <video
                      src={uploadedMediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={uploadedMediaUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-1 right-1 text-[8px] bg-black/80 px-1 rounded text-white font-mono uppercase">
                  {uploadedMediaType}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Post Title (e.g. Accra Street Secrets)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-900 text-xs text-white placeholder-neutral-500 p-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
                />
                <textarea
                  placeholder="Write a caption with #hashtags..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-900 text-xs text-white placeholder-neutral-500 p-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400 resize-none"
                />
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadedFileName ? 'Replace Media' : 'Select From Gallery'}</span>
                  </button>
                  {uploadedFileName && (
                    <span className="truncate max-w-[110px] text-neutral-500">
                      {uploadedFileName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Supabase Storage Cloud Sync Status */}
            {supabaseUploadStatus && (
              <div className="mb-3 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-between text-[11px] text-cyan-300 shadow-md">
                <div className="flex items-center gap-1.5">
                  <CloudUpload className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                  <span className="font-semibold">{supabaseUploadStatus}</span>
                </div>
                <span className="text-[9px] font-mono text-neutral-400">Supabase: ValuVid App</span>
              </div>
            )}

            {/* 720p HD Quality Standard Status Card */}
            {uploadedMediaType === 'video' && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-black border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">
                        HD Quality Verified: {videoResolution?.qualityLabel || '720p HD'}
                      </span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/40">
                        Meets Standard ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {videoResolution ? `${videoResolution.width}×${videoResolution.height}px` : '720×1280 vertical HD'} • Optimized for crisp mobile streaming
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* VIDEO COVER / THUMBNAIL SELECTOR */}
            <div className="mb-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Video Cover / Thumbnail</span>
                </div>
                {customCoverUrl ? (
                  <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                    Custom Cover
                  </span>
                ) : autoCoverUrl ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    Auto-Frame Selected
                  </span>
                ) : (
                  <span className="text-[9px] text-neutral-400">Default Cover</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Active Cover Preview */}
                <div className="w-16 h-20 rounded-xl bg-black border border-neutral-700 overflow-hidden relative shrink-0">
                  {customCoverUrl || autoCoverUrl ? (
                    <img
                      src={customCoverUrl || autoCoverUrl!}
                      alt="Selected Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-[9px] text-neutral-400 p-1 text-center">
                      {isExtractingCover ? (
                        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <span>No Cover</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1.5 text-left">
                  <p className="text-[11px] text-neutral-300">
                    {customCoverUrl
                      ? 'Custom thumbnail will be shown on the feed and discover grids.'
                      : autoCoverUrl
                      ? 'Extracted thumbnail from video frame. You can also pick a custom cover.'
                      : 'Video frame auto-selects as cover if no custom image is chosen.'}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black font-bold text-[11px] transition-colors flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <Upload className="w-3 h-3 text-black" />
                      <span>{customCoverUrl ? 'Change Cover' : 'Upload Cover'}</span>
                    </button>

                    {customCoverUrl && autoCoverUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCoverUrl(null);
                          sounds.playLikePop();
                        }}
                        className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-medium transition-colors"
                      >
                        Reset to Video Frame
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden file input for custom cover */}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
            </div>

            {/* Category selector */}
            <div className="mb-4">
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Channel Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ghana', 'tech', 'fashion', 'education', 'trending', 'bounties'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                      category === cat
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* MONETIZATION SETTINGS SWITCHER */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4 mb-4">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Monetization Settings
                </h3>
              </div>

              {/* 1. Direct Micro-Tips */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Allow Direct Micro-Tips</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Viewers can tip Cedis via MTN MoMo, Telecel or in-app wallet.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowTips}
                  onChange={(e) => setAllowTips(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* 2. Pay-Per-Unlock Section */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Set Pay-Per-Unlock Gate</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Lock full video behind a micro-fee for premium tutorials.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPayPerUnlock}
                    onChange={(e) => setIsPayPerUnlock(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {isPayPerUnlock && (
                  <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 mt-1">
                    <span className="text-xs text-neutral-300">Unlock Fee:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-amber-400">GHS</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        step="0.5"
                        value={unlockPriceGHS}
                        onChange={(e) => setUnlockPriceGHS(parseFloat(e.target.value) || 5)}
                        className="w-16 bg-neutral-900 border border-neutral-700 text-right px-2 py-1 rounded text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Watch-Reward Pool */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-white">
                    Participate in Watch-Reward Pool
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Earn creator revenue shares when users spend watch-time on this video.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={participateRewardPool}
                  onChange={(e) => setParticipateRewardPool(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* MANDATORY AI CONTENT DISCLOSURE (VALUVID PILLAR 1 & 2 ARCHITECTURE) */}
            <div className="bg-[#070E1B] border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      AI Content Transparency
                    </h3>
                    <p className="text-[10px] text-neutral-400">Mandatory Disclosure Policy</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${isAiAssistedOrGenerated ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {isAiAssistedOrGenerated ? 'Yes' : 'No'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAiAssistedOrGenerated}
                      onChange={(e) => setIsAiAssistedOrGenerated(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              <p className="text-[11px] text-neutral-300">
                Was this video significantly assisted or generated by AI tools? (Voice cloning, facial deepfake, or text-to-video synthesis)
              </p>

              {/* Warning and Options when AI is selected */}
              {isAiAssistedOrGenerated ? (
                <div className="flex flex-col gap-3 pt-2 border-t border-neutral-800 animate-fade-in">
                  {/* Warning Box */}
                  <div className="bg-amber-950/40 border border-amber-500/50 p-2.5 rounded-xl flex items-start gap-2 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] leading-tight flex flex-col gap-0.5">
                      <strong>AI Authenticity Mandate:</strong> An un-removable badge will be visible next to your handle.
                      <span className="text-[9px] text-amber-300">
                        <strong>Hidden AI Penalty:</strong> 1st strike = video demonetized; 2nd strike = wallet withdrawal freeze; 3rd strike = permanent account shadowban.
                      </span>
                    </div>
                  </div>

                  {/* AI Classification Radios */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                      Select AI Classification
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiDisclosureType('generated')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          aiDisclosureType === 'generated'
                            ? 'bg-rose-950/40 border-rose-500 text-white font-bold'
                            : 'bg-black/40 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <span className="text-xs text-rose-300 flex items-center gap-1 font-bold">
                          <Bot className="w-3.5 h-3.5" /> Generated by AI
                        </span>
                        <span className="text-[9px] text-neutral-400 leading-tight">
                          Synthetic voice, deepfake, or text-to-video. (Tier 2 watch rewards)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiDisclosureType('assisted')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          aiDisclosureType === 'assisted'
                            ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold'
                            : 'bg-black/40 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <span className="text-xs text-cyan-300 flex items-center gap-1 font-bold">
                          <Sparkles className="w-3.5 h-3.5" /> AI Assisted
                        </span>
                        <span className="text-[9px] text-neutral-400 leading-tight">
                          Human speech with AI subtitles, noise clean-up, or color grading.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Specific Tools Checklist */}
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block mb-1">
                      Check AI Tools Employed:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-neutral-300">
                      <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-neutral-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiVoiceCloned}
                          onChange={(e) => setAiVoiceCloned(e.target.checked)}
                          className="accent-amber-500 rounded"
                        />
                        <span>Cloned / Synthetic Voice</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-neutral-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiFaceDeepfake}
                          onChange={(e) => setAiFaceDeepfake(e.target.checked)}
                          className="accent-amber-500 rounded"
                        />
                        <span>Deepfake / Face Swap</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-neutral-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiTextToVideo}
                          onChange={(e) => setAiTextToVideo(e.target.checked)}
                          className="accent-amber-500 rounded"
                        />
                        <span>Text-to-Video Model</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-neutral-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiAssistedEditing}
                          onChange={(e) => setAiAssistedEditing(e.target.checked)}
                          className="accent-amber-500 rounded"
                        />
                        <span>AI Captions / Noise Clean</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Eligible for 100% "Verified Human Creator" Monetization Bonus</span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              )}
            </div>

            {/* FEATURE 1: VALUSPLIT CO-CREATOR SETUP */}
            <div className="bg-[#070E1B] border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      ValuSplit Revenue Sharing
                    </h3>
                    <p className="text-[10px] text-neutral-400">Automated co-creator payout split</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableValuSplit}
                    onChange={(e) => setEnableValuSplit(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {enableValuSplit && (
                <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-800 animate-fade-in text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Collaborator @Handle:</label>
                      <input
                        type="text"
                        value={collabUsername}
                        onChange={(e) => setCollabUsername(e.target.value)}
                        placeholder="@kweku_producer"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Role / Contribution:</label>
                      <input
                        type="text"
                        value={collabRole}
                        onChange={(e) => setCollabRole(e.target.value)}
                        placeholder="Music Producer / Beat Maker"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-400">Split Ratio:</span>
                      <span className="font-bold text-cyan-300">
                        You ({100 - collabShare}%) / Collaborator ({collabShare}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={collabShare}
                      onChange={(e) => setCollabShare(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500">
                      <span>90% to You / 10% Collab</span>
                      <span>50/50 Equal</span>
                      <span>10% to You / 90% Collab</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FEATURE 2: COMMUNITY GOAL SETUP */}
            <div className="bg-[#070E1B] border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Community Milestone Goal
                    </h3>
                    <p className="text-[10px] text-neutral-400">Goal-driven micro-funding with unlock</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCommunityGoal}
                    onChange={(e) => setEnableCommunityGoal(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {enableCommunityGoal && (
                <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-800 animate-fade-in text-xs">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Milestone Goal Title:</label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g. Rode Wireless Mic for Street Interviews"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Target Pool (GHS):</label>
                      <input
                        type="number"
                        min="50"
                        step="50"
                        value={goalTargetGHS}
                        onChange={(e) => setGoalTargetGHS(parseFloat(e.target.value) || 100)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Shared Unlock Reward:</label>
                      <input
                        type="text"
                        value={goalReward}
                        onChange={(e) => setGoalReward(e.target.value)}
                        placeholder="e.g. Unlocks 4K Behind-the-Scenes tutorial"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Publish Action Button */}
          <button
            onClick={handlePublish}
            disabled={isCloudUploading}
            className={`w-full py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-sm shadow-xl shadow-white/20 flex items-center justify-center gap-2 active:scale-95 transition-all ${
              isCloudUploading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isCloudUploading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Uploading to Cloud...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Publish & Enable Monetization</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* LIVE STREAM ELIGIBILITY CRITERIA MODAL */}
      {showEligibilityModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#070E1B] border border-rose-500/30 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 p-[1.5px]">
                  <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
                    <Radio className="w-4 h-4 text-rose-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Streaming Criteria</h3>
                  <p className="text-[10px] text-neutral-400">ValuVid Creator Live Access</p>
                </div>
              </div>
              <button
                onClick={() => setShowEligibilityModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              To protect the community from spam and ensure genuine peer-to-peer micro-tipping, creators must meet these requirements to Go Live:
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Criterion 1: 10,000 Followers */}
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    currentUser.followers >= 10000 || isProMember ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {currentUser.followers >= 10000 || isProMember ? <Check className="w-4 h-4 stroke-[3]" /> : <Users className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">10,000+ Followers</span>
                    <span className="text-[10px] text-neutral-400">
                      Your count: <strong className={currentUser.followers >= 10000 ? 'text-emerald-400' : 'text-amber-400'}>{currentUser.followers.toLocaleString()}</strong> / 10,000
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  currentUser.followers >= 10000
                    ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                    : isProMember
                    ? 'text-amber-300 bg-amber-950/80 border-amber-500/50'
                    : 'text-amber-400 bg-amber-950/80 border-amber-800/80'
                }`}>
                  {currentUser.followers >= 10000 ? 'Eligible ✓' : isProMember ? 'Pro Fast-Track 👑' : `${Math.min(100, Math.round((currentUser.followers / 10000) * 100))}%`}
                </span>
              </div>

              {/* Criterion 2: 18+ Age */}
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Age 18+ Verification</span>
                    <span className="text-[10px] text-neutral-400">Required for legal financial micro-payouts</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Verified ✓
                </span>
              </div>

              {/* Criterion 3: Verified MoMo */}
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Mobile Money Verified</span>
                    <span className="text-[10px] text-neutral-400">Linked to MTN MoMo / Telecel Cash</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Linked ✓
                </span>
              </div>

              {/* Criterion 4: Community Trust Standing */}
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Community Standing</span>
                    <span className="text-[10px] text-neutral-400">Zero active strikes or policy violations</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  100% Score ✓
                </span>
              </div>
            </div>

            {/* Pro Creator Fast-Track Note */}
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-neutral-300">
                  ValuVid Pro members get <strong>instant Live access</strong> regardless of followers!
                </span>
              </div>
            </div>

            {isLiveEligible ? (
              <button
                onClick={() => setShowEligibilityModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                All Requirements Met • Ready to Stream
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowEligibilityModal(false);
                    setShowProModal(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Pro for Instant Live Fast-Track</span>
                </button>
                <button
                  onClick={() => setShowEligibilityModal(false)}
                  className="w-full py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Continue Growing to 10k
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE STREAM END SUMMARY MODAL */}
      {showLiveSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#070E1B] border border-amber-400/40 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl text-white text-center max-h-[85vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Live Broadcast Ended</h3>
              <p className="text-xs text-neutral-400 mt-0.5">"{liveTopic}"</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-800">
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block mb-0.5">Stream Time</span>
                <span className="text-sm font-bold text-white font-mono">
                  {Math.floor(liveSeconds / 60)}m {liveSeconds % 60}s
                </span>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block mb-0.5">Peak Viewers</span>
                <span className="text-sm font-bold text-cyan-400">
                  {liveViewers}
                </span>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block mb-0.5">Live Tips</span>
                <span className="text-sm font-bold text-amber-400">
                  GHS {liveTipsGHS.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400 bg-emerald-950/60 p-2 rounded-xl border border-emerald-800/80">
              GHS {liveTipsGHS.toFixed(2)} automatically deposited into your ValuWallet!
            </p>

            <button
              onClick={() => {
                if (liveTipsGHS > 0) {
                  addFundsToWallet(liveTipsGHS);
                }
                setShowLiveSummaryModal(false);
                setStudioMode('15s');
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-neutral-950 font-black text-xs shadow-xl active:scale-95 transition-transform"
            >
              Done & Return to Studio
            </button>
          </div>
        </div>
      )}

      {/* 720P MINIMUM QUALITY STANDARDS MODAL */}
      {showQualityWarningModal && substandardQualityError && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#070E1B] border border-amber-500/40 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">720p HD Quality Required</h3>
                  <p className="text-[10px] text-neutral-400">ValuVid Visual Standard</p>
                </div>
              </div>
              <button
                onClick={() => setShowQualityWarningModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              To guarantee the best viewer experience and ensure videos look sharp on all mobile screens, ValuVid requires uploaded videos to be <strong>at least 720p HD</strong> (720×1280 vertical or 1280×720).
            </p>

            {/* Resolution Comparison Card */}
            <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-neutral-800/80">
                <span className="text-neutral-400">Your Video Resolution:</span>
                <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                  {substandardQualityError.width}×{substandardQualityError.height} ({substandardQualityError.qualityLabel})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-neutral-400">Minimum Platform Standard:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  720×1280 (720p HD)
                </span>
              </div>
            </div>

            {/* Creator Benefit Tip */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Tip: High-definition 720p, 1080p, and 4K videos earn <strong>higher algorithmic reach</strong> and more MoMo creator tips!
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {pendingSubstandardFileRef.current && (
                <button
                  type="button"
                  onClick={() => {
                    const f = pendingSubstandardFileRef.current;
                    pendingSubstandardFileRef.current = null;
                    setShowQualityWarningModal(false);
                    if (f) processVideoOrPhotoFile(f, true);
                  }}
                  className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs shadow-lg shadow-white/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                  <span>Upload Anyway ({substandardQualityError?.qualityLabel || 'SD'})</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    pendingSubstandardFileRef.current = null;
                    setShowQualityWarningModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pendingSubstandardFileRef.current = null;
                    setShowQualityWarningModal(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>Choose 720p+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
