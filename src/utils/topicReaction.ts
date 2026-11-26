import { VideoItem } from '../types';

export interface TopicReaction {
  topic: string;
  emoji: string;
  glowColor: string;
}

interface TopicRule {
  topic: string;
  emoji: string;
  glowColor: string;
  keywords: string[];
}

const TOPIC_RULES: TopicRule[] = [
  {
    topic: 'football',
    emoji: '⚽',
    glowColor: 'rgba(34, 197, 94, 0.65)',
    keywords: [
      'football', 'soccer', 'goal', 'goals', 'premier league', 'champions league',
      'fifa', 'world cup', 'afcon', 'black stars', 'striker', 'penalty', 'dribble',
      'messi', 'ronaldo', 'pitch', 'arsenal', 'chelsea', 'liverpool', 'madrid',
      'barca', 'barcelona', 'man city', 'man utd', 'fc', 'referee', 'goalkeeper',
      'hattrick', 'hat-trick', 'matchday', 'kickoff', 'offside',
    ],
  },
  {
    topic: 'basketball',
    emoji: '🏀',
    glowColor: 'rgba(249, 115, 22, 0.65)',
    keywords: ['basketball', 'nba', 'dunk', 'hoops', 'three pointer', 'court'],
  },
  {
    topic: 'fitness',
    emoji: '💪',
    glowColor: 'rgba(239, 68, 68, 0.65)',
    keywords: ['gym', 'workout', 'fitness', 'muscle', 'cardio', 'exercise', 'training', 'pushup', 'weightlifting', 'boxing', 'ufc'],
  },
  {
    topic: 'music',
    emoji: '🎵',
    glowColor: 'rgba(168, 85, 247, 0.65)',
    keywords: [
      'music', 'song', 'beat', 'beats', 'afrobeats', 'amapiano', 'rap', 'hiphop',
      'hip-hop', 'sing', 'singer', 'singing', 'concert', 'dj', 'remix', 'dance',
      'dancing', 'choreography', 'highlife', 'gospel', 'piano', 'guitar', 'freestyle',
      'album', 'track', 'melody', 'vocals', 'drum', 'drums',
    ],
  },
  {
    topic: 'gaming',
    emoji: '🎮',
    glowColor: 'rgba(99, 102, 241, 0.65)',
    keywords: ['gaming', 'gamer', 'esports', 'playstation', 'ps5', 'xbox', 'nintendo', 'fortnite', 'pubg', 'gta', 'gameplay', 'streamer'],
  },
  {
    topic: 'tech',
    emoji: '🤖',
    glowColor: 'rgba(0, 178, 254, 0.75)',
    keywords: [
      'tech', 'ai', 'artificial intelligence', 'coding', 'code', 'programming',
      'developer', 'software', 'app', 'startup', 'robot', 'gadget', 'iphone',
      'android', 'laptop', 'computer', 'cyber', 'javascript', 'python', 'algorithm',
    ],
  },
  {
    topic: 'fashion',
    emoji: '✂️',
    glowColor: 'rgba(236, 72, 153, 0.75)',
    keywords: [
      'fashion', 'style', 'outfit', 'drip', 'tailor', 'tailorpro', 'stitches',
      'fabric', 'kente', 'dress', 'suit', 'sneakers', 'makeup', 'beauty', 'hair',
      'skincare', 'model', 'runway', 'design', 'clothing', 'wear', 'sewing',
    ],
  },
  {
    topic: 'food',
    emoji: '🍴',
    glowColor: 'rgba(245, 158, 11, 0.75)',
    keywords: [
      'food', 'cook', 'cooking', 'recipe', 'jollof', 'waakye', 'banku', 'fufu',
      'kitchen', 'chef', 'eat', 'eating', 'delicious', 'tasty', 'restaurant',
      'bake', 'baking', 'cake', 'pizza', 'burger', 'street food', 'spicy', 'meal',
    ],
  },
  {
    topic: 'comedy',
    emoji: '😂',
    glowColor: 'rgba(250, 204, 21, 0.65)',
    keywords: ['comedy', 'funny', 'skit', 'joke', 'jokes', 'laugh', 'meme', 'memes', 'prank', 'hilarious', 'lol', 'humor'],
  },
  {
    topic: 'business',
    emoji: '💰',
    glowColor: 'rgba(16, 185, 129, 0.65)',
    keywords: [
      'money', 'business', 'entrepreneur', 'hustle', 'profit', 'sales', 'marketing',
      'crypto', 'bitcoin', 'forex', 'invest', 'investing', 'finance', 'momo',
      'fintech', 'wealth', 'rich', 'income', 'cash', 'cedi', 'ghs', 'bounty', 'earn',
    ],
  },
  {
    topic: 'education',
    emoji: '🎓',
    glowColor: 'rgba(59, 130, 246, 0.75)',
    keywords: [
      'learn', 'learning', 'tutorial', 'how to', 'guide', 'tips', 'study', 'school',
      'university', 'exam', 'lecture', 'science', 'math', 'history', 'book', 'read',
      'course', 'lesson', 'education', 'explain', 'explained',
    ],
  },
  {
    topic: 'travel',
    emoji: '✈️',
    glowColor: 'rgba(14, 165, 233, 0.65)',
    keywords: ['travel', 'trip', 'vacation', 'beach', 'hotel', 'flight', 'explore', 'tour', 'nature', 'mountain', 'ocean', 'adventure'],
  },
  {
    topic: 'cars',
    emoji: '🚗',
    glowColor: 'rgba(239, 68, 68, 0.65)',
    keywords: ['car', 'cars', 'benz', 'mercedes', 'bmw', 'toyota', 'drive', 'driving', 'engine', 'supercar', 'bike', 'motorcycle'],
  },
  {
    topic: 'cinema',
    emoji: '🎬',
    glowColor: 'rgba(139, 92, 246, 0.65)',
    keywords: ['movie', 'film', 'cinema', 'camera', 'photo', 'photography', 'filmmaking', 'vlog', 'behind the scenes'],
  },
  {
    topic: 'faith',
    emoji: '🙏',
    glowColor: 'rgba(251, 191, 36, 0.65)',
    keywords: ['god', 'prayer', 'pray', 'church', 'faith', 'bless', 'blessed', 'dua', 'islam', 'quran', 'bible', 'inspire', 'motivation', 'mindset'],
  },
  {
    topic: 'ghana',
    emoji: '🇬🇭',
    glowColor: 'rgba(234, 179, 8, 0.65)',
    keywords: ['ghana', 'accra', 'kumasi', 'takoradi', 'tamale', 'africa', 'african', 'culture', 'heritage'],
  },
];

const DEFAULT_REACTION: TopicReaction = {
  topic: 'love',
  emoji: '❤️‍🔥',
  glowColor: 'rgba(254, 44, 85, 0.65)',
};

/**
 * Detects the best matching topic emoji for a video's title, caption, hashtags, category, and audio.
 * Used to render YouTube-style topic-aware Like button & double-tap animations.
 */
export function detectVideoTopicReaction(video?: Partial<VideoItem> | null): TopicReaction {
  if (!video) return DEFAULT_REACTION;

  const text = [
    video.title || '',
    video.caption || '',
    Array.isArray(video.hashtags) ? video.hashtags.join(' ') : '',
    video.category || '',
    video.audioTrack?.title || '',
  ]
    .join(' ')
    .toLowerCase();

  if (!text.trim()) return DEFAULT_REACTION;

  for (const rule of TOPIC_RULES) {
    for (const kw of rule.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        return {
          topic: rule.topic,
          emoji: rule.emoji,
          glowColor: rule.glowColor,
        };
      }
    }
  }

  return DEFAULT_REACTION;
}
