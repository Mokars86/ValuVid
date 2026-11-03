import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Search, 
  Play, 
  Pause, 
  Music, 
  Upload, 
  Check, 
  Sparkles, 
  Volume2, 
  Disc,
  FilterX
} from 'lucide-react';
import { CURATED_SOUND_LIBRARY, SOUND_GENRES, SoundTrack } from '../../data/soundLibrary';
import { sounds } from '../../utils/soundEffects';

interface SoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: { title: string; artist: string; audioUrl?: string; coverUrl?: string } | null;
  onSelectTrack: (track: { title: string; artist: string; audioUrl?: string; coverUrl?: string }) => void;
}

export const SoundPickerModal: React.FC<SoundPickerModalProps> = ({
  isOpen,
  onClose,
  selectedTrack,
  onSelectTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  // Stop audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.src = '';
      }
      setPlayingTrackId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTracks = CURATED_SOUND_LIBRARY.filter((track) => {
    const matchesSearch =
      searchQuery === '' ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const togglePreview = (track: SoundTrack, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      sounds.playLikePop();
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio();
      }
      audioPreviewRef.current.src = track.audioUrl;
      audioPreviewRef.current.play().catch(() => {
        // Autoplay policy or offline
      });
      audioPreviewRef.current.onended = () => {
        setPlayingTrackId(null);
      };
      setPlayingTrackId(track.id);
    }
  };

  const handleSelect = (track: { title: string; artist: string; audioUrl?: string; coverUrl?: string }) => {
    sounds.playLikePop();
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setPlayingTrackId(null);
    onSelectTrack(track);
    onClose();
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playSuccessPayout();
    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    handleSelect({
      title: cleanName,
      artist: 'Custom Device Audio',
      audioUrl: objectUrl,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#0B1528] via-[#070D18] to-neutral-950 border border-neutral-800 rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl max-h-[85vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] p-[1.5px] shadow-md">
              <div className="w-full h-full bg-[#060D19] rounded-[10px] flex items-center justify-center">
                <Music className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none">Add Music & Sound</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Search sounds or upload your own audio</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Afrobeats, Amapiano, Lo-Fi, artists..."
            className="w-full bg-black/60 border border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-white bg-neutral-800 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Custom Audio Upload Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileUploadRef.current?.click()}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#00B2FE]/20 via-[#00B2FE]/10 to-amber-500/20 border border-[#00B2FE]/40 hover:border-amber-400/60 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Upload MP3 / Audio File</span>
          </button>
          <input
            ref={fileUploadRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleCustomAudioUpload}
          />

          <button
            onClick={() => handleSelect({ title: 'Original Sound', artist: 'Camera Microphone' })}
            className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold whitespace-nowrap active:scale-95 transition-colors"
          >
            Original Mic Only
          </button>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {SOUND_GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all font-semibold ${
                selectedGenre === genre.id
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'bg-black/50 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              {genre.label}
            </button>
          ))}
        </div>

        {/* Sound Track List */}
        <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-0.5 flex-1 max-h-[46vh]">
          {filteredTracks.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-neutral-400 bg-black/40 rounded-2xl border border-neutral-800">
              <FilterX className="w-7 h-7 text-neutral-500" />
              <p className="text-xs font-bold text-neutral-300">No sounds found</p>
              <p className="text-[10px] text-neutral-500">Try searching for other keywords or upload custom audio above.</p>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isSelected = selectedTrack?.title === track.title;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelect(track)}
                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10'
                      : 'bg-black/40 border-neutral-800/80 hover:border-neutral-700 hover:bg-black/60'
                  }`}
                >
                  {/* Left: Cover & Play/Pause Trigger */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <div 
                      onClick={(e) => togglePreview(track, e)}
                      className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform"
                      title={isPlaying ? 'Pause preview' : 'Play preview'}
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
                        isPlaying ? 'bg-black/60' : 'bg-black/40 hover:bg-black/50'
                      }`}>
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                          {track.title}
                        </span>
                        {track.isTrending && (
                          <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.2 rounded-full font-bold">
                            Trending
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {track.artist}
                      </div>

                      <div className="flex items-center gap-2 text-[9px] text-neutral-500 mt-0.5 font-mono">
                        <span>{track.duration}</span>
                        <span>•</span>
                        <span className="capitalize">{track.genre}</span>
                        <span>•</span>
                        <span>{track.plays} uses</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action: Checkmark if selected or Select button */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(track);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-black border border-neutral-700 text-neutral-200 text-[10px] font-bold transition-all"
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
