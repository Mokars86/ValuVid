import { VideoItem } from '../types';
import seedVideos from './seedVideosList.json';

/**
 * Helper to strip out legacy mock product tags from videos.
 */
function sanitizeVideoItem(v: any): VideoItem {
  const isMockTag =
    v.productTag &&
    (v.productTag.id === 'prod-kwesi-drumkit' ||
      v.productTag.title?.toLowerCase().includes('drum kit') ||
      v.productTag.title?.toLowerCase().includes('afro beats'));

  const cleanProductTag = isMockTag ? undefined : v.productTag;

  // Ensure valid numerical stats
  const currentLikes = typeof v.stats?.likes === 'number' ? Math.max(0, v.stats.likes) : 0;
  const currentTips = typeof v.stats?.tipsTotalGHS === 'number' ? Math.max(0, v.stats.tipsTotalGHS) : 0;
  const currentShares = typeof v.stats?.shares === 'number' ? Math.max(0, v.stats.shares) : 0;
  const currentComments = typeof v.stats?.comments === 'number' ? Math.max(0, v.stats.comments) : (v.stats?.commentsList?.length ?? 0);

  return {
    ...v,
    productTag: cleanProductTag,
    stats: {
      likes: currentLikes,
      views: Math.max(1, v.stats?.views ?? 1),
      shares: currentShares,
      comments: currentComments,
      tipsCount: typeof v.stats?.tipsCount === 'number' ? Math.max(0, v.stats.tipsCount) : 0,
      tipsTotalGHS: currentTips,
      commentsList: Array.isArray(v.stats?.commentsList) ? v.stats.commentsList : [],
    },
  } as VideoItem;
}

/**
 * Real community videos uploaded by users on ValuVid.
 * Pre-seeded so the feed starts playing instantly on app launch without waiting for network.
 */
export const INITIAL_COMMUNITY_VIDEOS: VideoItem[] = (seedVideos as any[]).map((v) => {
  const sanitized = sanitizeVideoItem(v);
  return {
    ...sanitized,
    creator: {
      ...sanitized.creator,
      isFollowing: false,
    },
    isLiked: false,
  };
});

const COMMUNITY_CLEAN_BUILD_VERSION = 'valuvid_clean_community_v5';

/**
 * Helper to get the initial feed list from real user uploads, seed community videos, and cached cloud videos.
 * Enables instant 0ms video availability on app startup without network delay.
 */
export function getInitialFeedVideos(currentUsername?: string): VideoItem[] {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(COMMUNITY_CLEAN_BUILD_VERSION) !== 'true') {
      localStorage.removeItem('valuvid_user_videos');
      localStorage.removeItem('valuvid_cached_feed_videos');
      localStorage.setItem(COMMUNITY_CLEAN_BUILD_VERSION, 'true');
    }

    const deletedIds: string[] = JSON.parse(localStorage.getItem('valuvid_deleted_videos') || '[]');
    const rawLocal: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
    const cleanLocal = rawLocal
      .filter(
        (v) => (Boolean(v.videoUrl) || Boolean(v.thumbnailUrl)) &&
          !deletedIds.includes(v.id) &&
          v.caption !== '[DELETED]' &&
          !(v.title || '').includes('[DELETED]') &&
          v.caption !== '[FOLLOW_RECORD]' &&
          v.caption !== '[LIKE_RECORD]' &&
          (v.category as string) !== 'deleted' &&
          (v.category as string) !== 'follow_record' &&
          (v.category as string) !== 'like_record' &&
          !v.id.startsWith('comm-vid') &&
          v.id !== 'vid-user-1793762676066' &&
          v.id !== 'vid-user-1793960000000' &&
          v.id !== 'test_follow_record' &&
          !v.id.startsWith('test') &&
          !v.id.startsWith('test_') &&
          !(v.title || '').toLowerCase().includes('test follow')
      )
      .map(sanitizeVideoItem);

    const followed: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
    const likedIds: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');

    // Load cached cloud feed videos from previous session
    const rawCachedFeed: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_cached_feed_videos') || '[]');
    const cleanCached = rawCachedFeed
      .filter(
        (v) => (Boolean(v.videoUrl) || Boolean(v.thumbnailUrl)) &&
          !deletedIds.includes(v.id) &&
          v.caption !== '[DELETED]' &&
          !(v.title || '').includes('[DELETED]') &&
          v.caption !== '[FOLLOW_RECORD]' &&
          v.caption !== '[LIKE_RECORD]' &&
          (v.category as string) !== 'deleted' &&
          (v.category as string) !== 'follow_record' &&
          (v.category as string) !== 'like_record' &&
          !v.id.startsWith('comm-vid') &&
          v.id !== 'vid-user-1793762676066' &&
          v.id !== 'vid-user-1793960000000' &&
          v.id !== 'test_follow_record' &&
          !v.id.startsWith('test') &&
          !v.id.startsWith('test_') &&
          !(v.title || '').toLowerCase().includes('test follow')
      )
      .map(sanitizeVideoItem);

    // Sort newest local uploads first
    const cleanLocalSorted = [...cleanLocal].sort((a, b) => {
      const timeA = parseInt(a.id.replace('vid-user-', '')) || 0;
      const timeB = parseInt(b.id.replace('vid-user-', '')) || 0;
      return timeB - timeA;
    });

    // Merge: local uploads first, then cached cloud videos, then initial community videos
    const mergedMap = new Map<string, VideoItem>();
    cleanLocalSorted.forEach((v) => mergedMap.set(v.id, v));
    cleanCached.forEach((v) => {
      if (!mergedMap.has(v.id)) mergedMap.set(v.id, v);
    });
    INITIAL_COMMUNITY_VIDEOS.forEach((v) => {
      if (!mergedMap.has(v.id)) mergedMap.set(v.id, v);
    });

    const combined = Array.from(mergedMap.values());
    if (combined.length === 0) {
      return INITIAL_COMMUNITY_VIDEOS;
    }

    const followedNormalized = new Set(
      followed.map((id) => id.toLowerCase().trim().replace(/^@/, ''))
    );

    return combined.map((v) => {
      const creatorUsername = (v.creator?.username || '').toLowerCase().replace(/^@/, '');
      const creatorId = (v.creator?.id || '').toLowerCase();
      const isFollowing =
        followedNormalized.has(creatorUsername) ||
        (creatorId ? followedNormalized.has(creatorId) : false) ||
        Boolean(v.creator?.isFollowing);

      const cleanFollowers = typeof v.creator?.followers === 'number'
        ? Math.max(0, v.creator.followers)
        : 0;

      const cleanFollowing = typeof v.creator?.following === 'number'
        ? Math.max(0, v.creator.following)
        : 0;

      return {
        ...v,
        isLiked: likedIds.includes(v.id) || Boolean(v.isLiked),
        creator: {
          ...v.creator,
          followers: cleanFollowers,
          following: cleanFollowing,
          isFollowing,
        },
      };
    });
  } catch {
    return INITIAL_COMMUNITY_VIDEOS;
  }
}
