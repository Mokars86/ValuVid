export interface SoundTrack {
  id: string;
  title: string;
  artist: string;
  genre: 'afrobeats' | 'amapiano' | 'highlife' | 'lofi' | 'dance' | 'traditional';
  duration: string;
  durationSeconds: number;
  coverUrl: string;
  audioUrl: string;
  plays: string;
  isTrending?: boolean;
}

export const SOUND_GENRES = [
  { id: 'all', label: '🔥 All Sounds' },
  { id: 'afrobeats', label: '🇬🇭 Afrobeats' },
  { id: 'amapiano', label: '🇿🇦 Amapiano' },
  { id: 'highlife', label: '🎺 Highlife' },
  { id: 'lofi', label: '✨ Lo-Fi Chill' },
  { id: 'dance', label: '⚡️ Dance & Viral' },
  { id: 'traditional', label: '🥁 Percussion' },
];

/**
 * Royalty-Free African & Trending Audio Catalog
 * Sourced from verified creative-commons & public domain music archives.
 */
export const CURATED_SOUND_LIBRARY: SoundTrack[] = [
  {
    id: 'track-afro-1',
    title: 'Accra Sunset Vibe',
    artist: 'Kweku Black Star',
    genre: 'afrobeats',
    duration: '0:32',
    durationSeconds: 32,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77627.mp3?filename=african-safari-123018.mp3',
    plays: '142k',
    isTrending: true,
  },
  {
    id: 'track-piano-1',
    title: 'Soweto Night Log Drum',
    artist: 'Musa Amapiano Groove',
    genre: 'amapiano',
    duration: '0:35',
    durationSeconds: 35,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=amapiano-beat-104928.mp3',
    plays: '280k',
    isTrending: true,
  },
  {
    id: 'track-highlife-1',
    title: 'Golden Stool Highlife Guitar',
    artist: 'Osu Palm Wine Band',
    genre: 'highlife',
    duration: '0:40',
    durationSeconds: 40,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_32c9182a47.mp3?filename=tropical-island-9868.mp3',
    plays: '95k',
    isTrending: false,
  },
  {
    id: 'track-afro-2',
    title: 'Osu Night Market Bounce',
    artist: 'DJ Berekum',
    genre: 'afrobeats',
    duration: '0:30',
    durationSeconds: 30,
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=afrobeat-groove-112283.mp3',
    plays: '310k',
    isTrending: true,
  },
  {
    id: 'track-lofi-1',
    title: 'Jamestown Rooftop Lo-Fi',
    artist: 'Chale Chill Studio',
    genre: 'lofi',
    duration: '0:28',
    durationSeconds: 28,
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3',
    plays: '115k',
    isTrending: false,
  },
  {
    id: 'track-dance-1',
    title: 'Kumasi Street Anthem',
    artist: 'Asakaa Drill Masters',
    genre: 'dance',
    duration: '0:33',
    durationSeconds: 33,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c330f65313.mp3?filename=action-powerful-energetic-percussion-10287.mp3',
    plays: '420k',
    isTrending: true,
  },
  {
    id: 'track-trad-1',
    title: 'Fontomfrom Royal Drums',
    artist: 'Ashanti Heritage Ensemble',
    genre: 'traditional',
    duration: '0:25',
    durationSeconds: 25,
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_106606f157.mp3?filename=tribal-percussion-action-drums-9988.mp3',
    plays: '88k',
    isTrending: false,
  },
  {
    id: 'track-piano-2',
    title: 'Jozi Deep Shakers',
    artist: 'Kabelo Sounds',
    genre: 'amapiano',
    duration: '0:34',
    durationSeconds: 34,
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_0cb34e6e69.mp3?filename=electronic-future-beats-125608.mp3',
    plays: '190k',
    isTrending: true,
  },
  {
    id: 'track-lofi-2',
    title: 'Cape Coast Ocean Breeze',
    artist: 'Aba Study Beats',
    genre: 'lofi',
    duration: '0:29',
    durationSeconds: 29,
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=lofi-study-112191.mp3',
    plays: '130k',
    isTrending: false,
  },
  {
    id: 'track-dance-2',
    title: 'Afro-Tech Club Voltage',
    artist: 'Accra Electro Lab',
    genre: 'dance',
    duration: '0:31',
    durationSeconds: 31,
    coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=electronic-rock-king-around-here-15045.mp3',
    plays: '240k',
    isTrending: true,
  }
];
