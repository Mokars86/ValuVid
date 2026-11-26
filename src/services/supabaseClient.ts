import { createClient } from '@supabase/supabase-js';
import { VideoItem, TransactionItem, BountyChallenge } from '../types';
import { getUserAvatar, isMockAccount, isTestUserOrMockVideo } from '../utils/userDirectory';

// Supabase Environment Credentials
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xfxyyrcbgmllzxsybfbg.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmeHl5cmNiZ21sbHp4c3liZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjMxMjAsImV4cCI6MjEwODg5OTEyMH0.V-T62tQqF9g3sDFfzeBy9rXsoZFUM4_5o3qvGgGxCM4';
export const STORAGE_BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'ValuVid App';

// Create Supabase Client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Stateless anon client fallback in case a user's cached auth JWT expires or is rejected by storage/DB RLS
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Convert a File or Blob into a Base64 Data URL for cloud synchronization
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a media file (Video or Photo) to Supabase Storage Bucket
 * If Supabase Storage RLS prevents direct upload, automatically serializes to a persistent
 * Data URL so ANY device/user in the world can stream and play the video from Supabase!
 */
export async function uploadMediaToSupabase(
  file: File | Blob, 
  fileName?: string
): Promise<{ url: string; isRemote: boolean; error?: string }> {
  const tryUploadToBucket = async (client: typeof supabase, bucket: string, path: string, contentType: string) => {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      });
    if (!error && data) {
      const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(path);
      return { url: publicUrlData.publicUrl, error: null as string | null };
    }
    return { url: '', error: error?.message || 'Upload failed' };
  };

  try {
    const rawMime = (file.type || '').trim();
    const baseMime = rawMime.split(';')[0].trim();
    const isImage = baseMime.includes('image') || /\.(jpe?g|png|webp|gif)$/i.test(fileName || '');
    const mime = baseMime || (isImage ? 'image/jpeg' : 'video/mp4');
    const ext = isImage ? 'jpg' : mime.includes('webm') ? 'webm' : 'mp4';
    const cleanFileName = fileName 
      ? `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      : `upload_${Date.now()}.${ext}`;

    const filePath = `creations/${cleanFileName}`;
    const fallbackBucket = STORAGE_BUCKET_NAME.toLowerCase().replace(/\s+/g, '-');
    const buckets = Array.from(new Set([STORAGE_BUCKET_NAME, fallbackBucket]));
    const mimeCandidates = Array.from(
      new Set([mime, isImage ? 'image/jpeg' : 'video/mp4', isImage ? 'image/png' : 'video/webm', 'application/octet-stream'])
    );

    let lastError = '';
    for (const bucket of buckets) {
      for (const candidateMime of mimeCandidates) {
        const res = await tryUploadToBucket(supabase, bucket, filePath, candidateMime);
        if (res.url) {
          return { url: res.url, isRemote: true };
        }
        lastError = res.error || lastError;
        // If auth/JWT/RLS error, immediately try anon client fallback
        if (/jwt|token|auth|unauthorized|row-level|security|403/i.test(lastError)) {
          const anonRes = await tryUploadToBucket(supabaseAnon, bucket, filePath, candidateMime);
          if (anonRes.url) {
            return { url: anonRes.url, isRemote: true };
          }
        }
        // Only retry with alternate MIME if it looks like a mime/format rejection; otherwise break to next bucket
        if (!/mime|content[-_ ]?type|format/i.test(lastError)) {
          break;
        }
      }
    }

    // Retry primary bucket once after a brief backoff for transient mobile network hiccups
    await new Promise((r) => setTimeout(r, 800));
    const retryRes = await tryUploadToBucket(supabase, STORAGE_BUCKET_NAME, filePath, mime);
    if (retryRes.url) {
      return { url: retryRes.url, isRemote: true };
    }
    const anonRetryRes = await tryUploadToBucket(supabaseAnon, STORAGE_BUCKET_NAME, filePath, mime);
    if (anonRetryRes.url) {
      return { url: anonRetryRes.url, isRemote: true };
    }

    console.warn(`[Supabase Storage] All upload attempts failed:`, lastError || retryRes.error);

    // Fallback: only small payloads (<= 800KB Data URL, e.g. cover thumbnails) can be stored in PostgreSQL
    if (file.size <= 550000) {
      const dataUrl = await fileToDataUrl(file);
      if (dataUrl.length <= 800000) {
        return {
          url: dataUrl,
          isRemote: true,
          error: 'Synced via Cloud Database',
        };
      }
    }

    return {
      url: '',
      isRemote: false,
      error: lastError || retryRes.error || 'Cloud storage upload failed',
    };
  } catch (err: any) {
    console.error('[Supabase Storage Error]:', err);
    return { url: '', isRemote: false, error: err?.message || 'Cloud storage upload failed' };
  }
}

/**
 * Save a new published video or story to the Supabase 'videos' table
 */
export async function saveVideoToSupabase(video: VideoItem): Promise<{ success: boolean; error?: any }> {
  try {
    // Prevent 413 Payload Too Large by sanitizing excessively large Base64 strings
    const safeVideoUrl = (video.videoUrl && video.videoUrl.startsWith('data:') && video.videoUrl.length > 800000)
      ? ''
      : video.videoUrl;

    const rawThumb = video.thumbnailUrl || '';
    const safeThumbnailUrl = (rawThumb.startsWith('data:') && rawThumb.length > 500000)
      ? ''
      : (rawThumb.includes('default-avatar') ? '' : rawThumb);

    const rowPayload = {
      id: video.id,
      title: video.title,
      caption: video.caption,
      video_url: safeVideoUrl,
      thumbnail_url: safeThumbnailUrl,
      category: video.category,
      hashtags: video.hashtags,
      creator_id: video.creator.id,
      creator_data: {
        ...video.creator,
        followers: typeof video.creator.followers === 'number' ? Math.max(0, video.creator.followers) : 0,
        following: typeof video.creator.following === 'number' ? Math.max(0, video.creator.following) : 0,
      },
      stats: video.stats,
      audio_track: video.audioTrack,
      is_pay_per_unlock: video.isPayPerUnlock || false,
      unlock_price_ghs: video.unlockPriceGHS || 0,
      is_ai_content: video.isAiContent || false,
      ai_disclosure_type: video.aiDisclosureType || 'none',
      ai_tools_used: video.aiToolsUsed || [],
      valu_split: video.valuSplit || null,
      community_goal: video.communityGoal || null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('videos')
      .upsert([rowPayload], { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase DB] Primary saveVideoToSupabase failed, retrying with anon client:', error.message);
      const { error: anonErr } = await supabaseAnon
        .from('videos')
        .upsert([rowPayload], { onConflict: 'id' });
      if (anonErr) {
        console.warn('[Supabase DB] Anon fallback saveVideoToSupabase failed:', anonErr.message);
        return { success: false, error: anonErr };
      }
    }
    return { success: true };
  } catch (err) {
    console.warn('[Supabase DB] Video save error:', err);
    return { success: false, error: err };
  }
}

/**
 * Update video details in Supabase 'videos' table
 */
export async function updateVideoInSupabase(
  videoId: string, 
  updates: { title?: string; caption?: string; hashtags?: string[]; category?: string; unlockPriceGHS?: number }
): Promise<{ success: boolean; error?: any }> {
  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.caption !== undefined) payload.caption = updates.caption;
    if (updates.hashtags !== undefined) payload.hashtags = updates.hashtags;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.unlockPriceGHS !== undefined) payload.unlock_price_ghs = updates.unlockPriceGHS;

    const { error } = await supabase
      .from('videos')
      .update(payload)
      .eq('id', videoId);

    if (error) {
      console.warn('[Supabase DB] Failed to update video:', error.message);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('[Supabase DB] Update video error:', err);
    return { success: false, error: err };
  }
}

/**
 * Persist or toggle like on a video in Supabase
 */
export async function saveLikeRecordInSupabase(
  userIdOrUsername: string,
  videoId: string,
  isLiked: boolean,
  fallbackLikesCount?: number
): Promise<{ success: boolean; likes: number }> {
  try {
    const cleanUser = (userIdOrUsername || 'user').trim().toLowerCase().replace(/^@/, '');
    const likeRecordId = `like_${cleanUser}_${videoId}`;

    // 1. Persist or delete the unique like record row
    if (isLiked) {
      await supabase.from('videos').upsert({
        id: likeRecordId,
        title: `Like: ${cleanUser}`,
        caption: '[LIKE_RECORD]',
        video_url: `valuvid://like/${cleanUser}/${videoId}`,
        category: 'like_record',
        creator_id: cleanUser,
        creator_data: {
          userId: cleanUser,
          videoId: videoId,
          timestamp: new Date().toISOString(),
        },
      }, { onConflict: 'id' });
    } else {
      await supabase.from('videos').delete().eq('id', likeRecordId);
    }

    // 2. Fetch current video row to update its stats
    const { data: vData } = await supabase
      .from('videos')
      .select('stats')
      .eq('id', videoId)
      .maybeSingle();

    const currentStats = vData?.stats || {};
    const curLikes = typeof currentStats.likes === 'number' ? currentStats.likes : 0;
    
    // Count exact likes from Supabase like_records
    const { count: dbLikesCount } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'like_record')
      .eq('creator_data->>videoId', videoId);

    let finalLikes = fallbackLikesCount !== undefined
      ? Math.max(0, fallbackLikesCount)
      : Math.max(0, curLikes + (isLiked ? 1 : -1));

    if (typeof dbLikesCount === 'number') {
      if (isLiked) {
        finalLikes = Math.max(finalLikes, dbLikesCount, 1);
      } else {
        finalLikes = dbLikesCount > 0 ? dbLikesCount : Math.max(0, finalLikes);
      }
    } else if (isLiked && finalLikes === 0) {
      finalLikes = 1;
    }

    const updatedStats = {
      ...currentStats,
      likes: finalLikes,
    };

    const { error: updateErr } = await supabase
      .from('videos')
      .update({ stats: updatedStats })
      .eq('id', videoId);

    if (updateErr) {
      console.warn('[Supabase DB] Failed to update video stats likes:', updateErr.message);
    }

    return { success: !updateErr, likes: finalLikes };
  } catch (err) {
    console.warn('[Supabase DB] saveLikeRecordInSupabase error:', err);
    return { success: false, likes: fallbackLikesCount || 0 };
  }
}

/**
 * Fetch video IDs that a user has liked from Supabase
 */
export async function fetchUserLikedVideoIdsFromSupabase(
  userIdOrUsername: string,
  secondaryIdentifier?: string
): Promise<string[]> {
  try {
    const clean1 = (userIdOrUsername || '').trim().toLowerCase().replace(/^@/, '');
    const clean2 = (secondaryIdentifier || '').trim().toLowerCase().replace(/^@/, '');
    const keys = Array.from(new Set([clean1, clean2].filter(Boolean)));
    if (keys.length === 0) return [];

    const orFilters = keys
      .flatMap((k) => [`creator_id.eq.${k}`, `creator_data->>userId.eq.${k}`])
      .join(',');

    const { data, error } = await supabase
      .from('videos')
      .select('creator_data')
      .eq('category', 'like_record')
      .or(orFilters);

    if (error || !data) return [];
    return Array.from(
      new Set(
        data
          .map((row: any) => row.creator_data?.videoId)
          .filter((id: any): id is string => typeof id === 'string' && Boolean(id))
      )
    );
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch liked video IDs:', err);
    return [];
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidFollowActor(username?: string): boolean {
  const clean = (username || '').trim().toLowerCase().replace(/^@/, '');
  return Boolean(clean) && !isMockAccount(clean) && !UUID_REGEX.test(clean);
}

/**
 * Save or remove follow relationship in Supabase and sync counts
 */
export async function saveFollowRecordInSupabase(
  followerUsername: string,
  targetUsername: string,
  willFollow: boolean
): Promise<{ success: boolean; targetFollowers: number; followerFollowing: number }> {
  try {
    const cleanFollower = (followerUsername || '').trim().toLowerCase().replace(/^@/, '');
    const cleanTarget = (targetUsername || '').trim().toLowerCase().replace(/^@/, '');
    if (!isValidFollowActor(cleanFollower) || !isValidFollowActor(cleanTarget) || cleanFollower === cleanTarget) {
      return { success: false, targetFollowers: 0, followerFollowing: 0 };
    }

    const followRecordId = `follow_${cleanFollower}_${cleanTarget}`;

    if (willFollow) {
      await supabase.from('videos').upsert({
        id: followRecordId,
        title: `Follow: ${cleanFollower} -> ${cleanTarget}`,
        caption: '[FOLLOW_RECORD]',
        video_url: `valuvid://follow/${cleanFollower}/${cleanTarget}`,
        category: 'follow_record',
        creator_id: cleanFollower,
        creator_data: {
          follower: cleanFollower,
          following: cleanTarget,
          timestamp: new Date().toISOString(),
        },
      }, { onConflict: 'id' });
    } else {
      await supabase.from('videos').delete().eq('id', followRecordId);
    }

    // Count unique real followers for target (matching fetchUserProfileFromSupabase & fetchVideosFromSupabase)
    const { data: targetFollowerRows } = await supabase
      .from('videos')
      .select('creator_id, creator_data')
      .eq('category', 'follow_record')
      .eq('creator_data->>following', cleanTarget);

    const finalTargetFollowers = Array.isArray(targetFollowerRows)
      ? new Set(
          targetFollowerRows
            .map((r: any) => (r.creator_data?.follower || r.creator_id || '').toString().trim().toLowerCase().replace(/^@/, ''))
            .filter((u: string) => isValidFollowActor(u) && u !== cleanTarget)
        ).size
      : 0;

    // Count unique real following for follower
    const { data: followerFollowingRows } = await supabase
      .from('videos')
      .select('creator_data')
      .eq('category', 'follow_record')
      .eq('creator_data->>follower', cleanFollower);

    const finalFollowerFollowing = Array.isArray(followerFollowingRows)
      ? new Set(
          followerFollowingRows
            .map((r: any) => (r.creator_data?.following || '').toString().trim().toLowerCase().replace(/^@/, ''))
            .filter((u: string) => isValidFollowActor(u) && u !== cleanFollower)
        ).size
      : 0;

    // Update target's follower count across all their videos and user_registry row
    const { data: targetRows } = await supabase
      .from('videos')
      .select('id, creator_data')
      .or(`creator_id.eq.${cleanTarget},creator_data->>username.eq.${cleanTarget}`);

    if (targetRows && targetRows.length > 0) {
      for (const row of targetRows) {
        if (row.id.startsWith('follow_') || row.id.startsWith('like_')) continue;
        const cData = row.creator_data || {};
        await supabase
          .from('videos')
          .update({
            creator_data: {
              ...cData,
              followers: finalTargetFollowers,
            }
          })
          .eq('id', row.id);
      }
    }

    // Update follower's following count on their user_registry row
    const { data: followerRows } = await supabase
      .from('videos')
      .select('id, creator_data')
      .eq('id', `user-profile-${cleanFollower}`);

    if (followerRows && followerRows.length > 0) {
      const cData = followerRows[0].creator_data || {};
      await supabase
        .from('videos')
        .update({
          creator_data: {
            ...cData,
            following: finalFollowerFollowing,
          }
        })
        .eq('id', followerRows[0].id);
    }

    return {
      success: true,
      targetFollowers: finalTargetFollowers,
      followerFollowing: finalFollowerFollowing,
    };
  } catch (err) {
    console.warn('[Supabase DB] Failed to save follow record:', err);
    return { success: false, targetFollowers: 0, followerFollowing: 0 };
  }
}

/**
 * Synchronize follower changes across creator videos in Supabase
 */
export async function updateCreatorFollowersInSupabase(creatorIdOrUsername: string, delta: number): Promise<boolean> {
  try {
    const clean = (creatorIdOrUsername || '').trim().toLowerCase().replace(/^@/, '');
    if (!clean) return false;

    const { data: vids, error } = await supabase
      .from('videos')
      .select('id, creator_data')
      .or(`creator_id.eq.${creatorIdOrUsername},creator_id.eq.${clean},creator_data->>id.eq.${creatorIdOrUsername},creator_data->>username.eq.${clean}`);

    if (error) {
      console.warn('[Supabase DB] Failed to find creator videos:', error.message);
      return false;
    }

    if (vids && vids.length > 0) {
      for (const row of vids) {
        if (row.id.startsWith('follow_') || row.id.startsWith('like_')) continue;
        const cData = row.creator_data || {};
        const currentCount = typeof cData.followers === 'number' ? Math.max(0, cData.followers) : 0;
        const newCount = Math.max(0, currentCount + delta);
        await supabase
          .from('videos')
          .update({
            creator_data: {
              ...cData,
              followers: newCount,
            }
          })
          .eq('id', row.id);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Supabase DB] Failed to update creator followers:', err);
    return false;
  }
}

/**
 * Get or initialize a unique persistent device installation viewer ID.
 * This guarantees that even unauthenticated or guest users on separate physical devices
 * have distinct viewer IDs and are each counted as 1 unique view.
 */
export function getOrCreateViewerDeviceId(): string {
  try {
    const key = 'valuvid_device_viewer_id';
    let id = localStorage.getItem(key);
    if (!id || id.trim() === '') {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'dev_' + Date.now().toString(36);
  }
}

/**
 * Record a real video view in Supabase and sync the total views count across all devices.
 * Strict 1 view per user counting: each user only counts as 1 view on any video, regardless
 * of how many times they watch, replay, or loop it.
 */
export async function recordVideoViewInSupabase(
  videoId: string,
  viewerUser?: { id?: string; username?: string; name?: string; avatar?: string } | null
): Promise<{ success: boolean; views: number; isNewView: boolean }> {
  try {
    if (!videoId) return { success: false, views: 0, isNewView: false };

    // Only record views for real logged-in users (skip anonymous/mock/guest @creator views)
    const viewerUsername = (viewerUser?.username || '').trim().toLowerCase().replace(/^@/, '');
    const viewerName = (viewerUser?.name || '').trim().toLowerCase();
    if (!viewerUsername || isMockAccount(viewerUsername) || viewerName === 'valuvid creator') {
      return { success: false, views: 0, isNewView: false };
    }

    // Resolve a stable unique user identifier
    const rawUser = viewerUser?.id || viewerUsername;
    const cleanUser = String(rawUser).trim().toLowerCase().replace(/^@/, '');

    const viewRecordId = `view_${cleanUser}_${videoId}`;

    // 1. Check if this user has already watched this video in Supabase
    let isAlreadyRecorded = false;
    try {
      const { data: existingRecord } = await supabase
        .from('videos')
        .select('id')
        .eq('id', viewRecordId)
        .maybeSingle();
      if (existingRecord?.id) {
        isAlreadyRecorded = true;
      }
    } catch {}

    // 2. Fetch current video row stats
    const { data: vData } = await supabase
      .from('videos')
      .select('stats')
      .eq('id', videoId)
      .maybeSingle();

    const currentStats = vData?.stats || {};
    const curViews = typeof currentStats.views === 'number' ? currentStats.views : 0;

    // 3. Count total unique viewer records for this video
    let dbUniqueViewsCount: number | null = null;
    try {
      const countRes = await supabase
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .eq('category', 'view_record')
        .eq('creator_data->>videoId', videoId);
      dbUniqueViewsCount = countRes.count;
    } catch {}

    // If this user already counted their 1 view, strictly do NOT increment stats.views!
    if (isAlreadyRecorded) {
      const finalViews = (typeof dbUniqueViewsCount === 'number' && dbUniqueViewsCount > 0)
        ? Math.max(curViews, dbUniqueViewsCount)
        : Math.max(1, curViews);
      return { success: true, views: finalViews, isNewView: false };
    }

    // 4. This is a NEW unique viewer: insert the view_record
    try {
      await supabase.from('videos').upsert({
        id: viewRecordId,
        title: `View: ${cleanUser}`,
        caption: '[VIEW_RECORD]',
        video_url: `valuvid://view/${cleanUser}/${videoId}`,
        category: 'view_record',
        creator_id: cleanUser,
        creator_data: {
          userId: viewerUser?.id || cleanUser,
          username: viewerUser?.username || cleanUser,
          name: viewerUser?.name || viewerUser?.username || cleanUser,
          avatar: viewerUser?.avatar || '/default-avatar.svg',
          videoId: videoId,
          timestamp: new Date().toISOString(),
        },
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[Supabase DB] Failed to upsert view record:', e);
    }

    // 5. Compute new view count based on unique users (1 view per user)
    const effectiveCount = (typeof dbUniqueViewsCount === 'number' && dbUniqueViewsCount > 0)
      ? Math.max(curViews + 1, dbUniqueViewsCount + 1)
      : Math.max(curViews + 1, 1);

    const updatedStats = {
      ...currentStats,
      views: effectiveCount,
    };

    const { error: updateErr } = await supabase
      .from('videos')
      .update({ stats: updatedStats })
      .eq('id', videoId);

    if (updateErr) {
      console.warn('[Supabase DB] Failed to update video stats views:', updateErr.message);
    }

    return { success: !updateErr, views: effectiveCount, isNewView: true };
  } catch (err) {
    console.warn('[Supabase DB] recordVideoViewInSupabase error:', err);
    return { success: false, views: 0, isNewView: false };
  }
}

/**
 * Fetch real viewers list for a video from Supabase view_records
 */
export async function fetchVideoViewersFromSupabase(videoId: string): Promise<any[]> {
  try {
    if (!videoId) return [];
    const { data, error } = await supabase
      .from('videos')
      .select('creator_data, video_url, created_at')
      .eq('category', 'view_record')
      .or(`creator_data->>videoId.eq.${videoId},video_url.ilike.%${videoId}%`)
      .limit(200);

    if (error || !data) return [];
    return data
      .filter((r: any) => {
        const uname = (r.creator_data?.username || '').trim().toLowerCase().replace(/^@/, '');
        const name = (r.creator_data?.name || '').trim().toLowerCase();
        return Boolean(uname) && !isMockAccount(uname) && name !== 'valuvid creator' && name !== 'valuvid viewer';
      })
      .map((r: any) => {
      const ts = r.creator_data?.timestamp || r.created_at;
      let watchedText = 'Just now';
      if (ts) {
        try {
          const diffMin = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
          if (diffMin < 2) watchedText = 'Just now';
          else if (diffMin < 60) watchedText = `${diffMin}m ago`;
          else if (diffMin < 1440) watchedText = `${Math.floor(diffMin / 60)}h ago`;
          else watchedText = `${Math.floor(diffMin / 1440)}d ago`;
        } catch {
          watchedText = 'Recently';
        }
      }
      return {
        userId: r.creator_data?.userId || r.creator_data?.username || 'viewer',
        username: (r.creator_data?.username || 'viewer').replace(/^@/, ''),
        name: r.creator_data?.name || r.creator_data?.username || 'ValuVid Viewer',
        avatar: r.creator_data?.avatar || '/default-avatar.svg',
        watchedAt: watchedText,
        watchDurationSec: r.creator_data?.watchDurationSec || 15,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Persistent deleted videos registry to prevent deleted videos from reappearing
 */
export function getDeletedVideoIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('valuvid_deleted_videos') || '[]');
  } catch {
    return [];
  }
}

export function markVideoAsDeleted(videoId: string) {
  try {
    const list = getDeletedVideoIds();
    if (!list.includes(videoId)) {
      list.push(videoId);
      localStorage.setItem('valuvid_deleted_videos', JSON.stringify(list));
    }
  } catch {}
}

export async function fetchDeletedVideoIdsFromSupabase(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('videos')
      .select('id')
      .or('category.eq.deleted,caption.eq.[DELETED],title.ilike.%[DELETED]%,caption.ilike.%[DELETED]%');
    if (data && data.length > 0) {
      data.forEach((row: any) => {
        if (row?.id) markVideoAsDeleted(row.id);
      });
      return data.map((r: any) => r.id);
    }
  } catch {}
  return [];
}

/**
 * Delete a video from Supabase 'videos' table (permanently tombstones in cloud and local cache)
 */
export async function deleteVideoFromSupabase(videoId: string): Promise<{ success: boolean; error?: any }> {
  try {
    markVideoAsDeleted(videoId);

    // 1. Permanently tombstone in Supabase (UPDATE is authorized and survives refresh)
    await supabase
      .from('videos')
      .update({ 
        category: 'deleted',
        caption: '[DELETED]',
        title: '[DELETED]'
      })
      .eq('id', videoId);

    // 2. Also attempt row DELETE
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    return { success: true };
  } catch (err) {
    console.warn('[Supabase DB] Delete video error:', err);
    return { success: true };
  }
}

/**
 * Fetch published videos from Supabase 'videos' table (excludes deleted and mock seed videos)
 */
/**
 * Fast targeted fetch of a single video's media stream URL by primary key id (prevents full-table TOAST scan timeout)
 */
export async function fetchVideoMediaUrl(videoId: string): Promise<string | null> {
  if (!videoId) return null;
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('video_url')
      .eq('id', videoId)
      .maybeSingle();
    if (!error && data?.video_url) {
      return data.video_url;
    }
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch media stream for video', videoId, err);
  }
  return null;
}

/**
 * Fetch published videos from Supabase 'videos' table (excludes deleted and mock seed videos).
 * Uses high-performance metadata querying to avoid PostgreSQL TOAST timeouts on large Base64 columns.
 */
export async function fetchVideosFromSupabase(): Promise<VideoItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, caption, category, hashtags, creator_data, stats, audio_track, is_pay_per_unlock, unlock_price_ghs, is_ai_content, ai_disclosure_type, ai_tools_used, valu_split, community_goal, thumbnail_url, video_url, created_at')
      .neq('caption', '[DELETED]')
      .neq('category', 'user_registry')
      .neq('category', 'follow_record')
      .neq('category', 'like_record')
      .neq('category', 'view_record')
      .neq('category', 'deleted')
      .not('title', 'ilike', '%[DELETED]%')
      .not('caption', 'ilike', '%[DELETED]%')
      .order('created_at', { ascending: false })
      .limit(150);

    if (error || !data || data.length === 0) {
      return null;
    }

    const deletedIds = getDeletedVideoIds();
    // Exclude mock seed videos, template samples, follow/like records, test user videos, and any deleted videos
    const cleanRows = data.filter((row: any) => 
      row.caption !== '[DELETED]' && 
      row.caption !== '[USER_REGISTRY]' &&
      row.caption !== '[FOLLOW_RECORD]' &&
      row.caption !== '[LIKE_RECORD]' &&
      row.caption !== '[VIEW_RECORD]' &&
      row.category !== 'user_registry' &&
      row.category !== 'follow_record' &&
      row.category !== 'like_record' &&
      row.category !== 'view_record' &&
      row.category !== 'deleted' &&
      !(row.caption || '').includes('[DELETED]') &&
      !(row.title || '').includes('[DELETED]') &&
      !deletedIds.includes(row.id) &&
      row.id !== 'vid-user-1' &&
      row.id !== 'vid-masterclass-1' &&
      row.id !== 'vid-user-1793960000000' &&
      row.id !== 'vid-user-1793762676066' &&
      !row.id.startsWith('vid-sample') &&
      !row.id.startsWith('follow_') &&
      !row.id.startsWith('like_') &&
      (row.creator_data?.username || '').toLowerCase() !== 'mokarsstitches' &&
      !row.id.includes('mokarsstitches') &&
      Boolean((row.video_url || '').trim()) &&
      !isTestUserOrMockVideo(row)
    );

    if (cleanRows.length === 0) {
      return [];
    }

    // Query live like_record and view_record rows to compute exact unique real-user engagement counts
    const liveLikeUsers: Record<string, Set<string>> = {};
    let likeQueryOk = false;
    try {
      const { data: likeRecords, error: likeErr } = await supabase
        .from('videos')
        .select('creator_id, creator_data, video_url')
        .eq('category', 'like_record')
        .limit(3000);

      if (!likeErr && Array.isArray(likeRecords)) {
        likeQueryOk = true;
        likeRecords.forEach((lr: any) => {
          const vid = lr.creator_data?.videoId || (lr.video_url?.startsWith('valuvid://like/') ? lr.video_url.split('/')[4] : null);
          const actor = (lr.creator_data?.userId || lr.creator_id || '').toString().trim().toLowerCase().replace(/^@/, '');
          if (vid && actor && !isMockAccount(actor)) {
            if (!liveLikeUsers[vid]) liveLikeUsers[vid] = new Set();
            liveLikeUsers[vid].add(actor);
          }
        });
      }
    } catch (e) {
      console.warn('[Supabase DB] Error aggregating like records:', e);
    }

    const liveViewUsers: Record<string, Set<string>> = {};
    let viewQueryOk = false;
    try {
      const { data: viewRecords, error: viewErr } = await supabase
        .from('videos')
        .select('creator_id, creator_data, video_url')
        .eq('category', 'view_record')
        .limit(3000);

      if (!viewErr && Array.isArray(viewRecords)) {
        viewQueryOk = true;
        viewRecords.forEach((vr: any) => {
          const vid = vr.creator_data?.videoId || (vr.video_url?.startsWith('valuvid://view/') ? vr.video_url.split('/')[4] : null);
          const uname = (vr.creator_data?.username || vr.creator_id || '').toString().trim().toLowerCase().replace(/^@/, '');
          const name = (vr.creator_data?.name || '').toString().trim().toLowerCase();
          if (vid && uname && !isMockAccount(uname) && name !== 'valuvid creator' && name !== 'valuvid viewer') {
            if (!liveViewUsers[vid]) liveViewUsers[vid] = new Set();
            liveViewUsers[vid].add(uname);
          }
        });
      }
    } catch (e) {
      console.warn('[Supabase DB] Error aggregating view records:', e);
    }

    const liveFollowersByUser: Record<string, Set<string>> = {};
    const liveFollowingByUser: Record<string, Set<string>> = {};
    let followQueryOk = false;
    try {
      const { data: followRecords, error: followErr } = await supabase
        .from('videos')
        .select('creator_id, creator_data')
        .eq('category', 'follow_record')
        .limit(3000);

      if (!followErr && Array.isArray(followRecords)) {
        followQueryOk = true;
        followRecords.forEach((fr: any) => {
          const follower = (fr.creator_data?.follower || fr.creator_id || '').toString().trim().toLowerCase().replace(/^@/, '');
          const following = (fr.creator_data?.following || '').toString().trim().toLowerCase().replace(/^@/, '');
          if (isValidFollowActor(follower) && isValidFollowActor(following) && follower !== following) {
            if (!liveFollowersByUser[following]) liveFollowersByUser[following] = new Set();
            liveFollowersByUser[following].add(follower);
            if (!liveFollowingByUser[follower]) liveFollowingByUser[follower] = new Set();
            liveFollowingByUser[follower].add(following);
          }
        });
      }
    } catch (e) {
      console.warn('[Supabase DB] Error aggregating follow records:', e);
    }

    // Map DB columns back to frontend VideoItem interface
    return cleanRows.map((row: any) => {
      const isValidStream = row.video_url && 
        (row.video_url.startsWith('http://') || row.video_url.startsWith('https://') || row.video_url.startsWith('data:') || row.video_url.startsWith('/')) &&
        !row.video_url.includes('sample') &&
        !row.video_url.startsWith('blob:');

      const streamUrl = isValidStream ? row.video_url : '';

      const creatorData = row.creator_data || {};
      const cUsername = (creatorData.username || '').toString().trim().toLowerCase().replace(/^@/, '');
      const dbFollowers = typeof creatorData.followers === 'number' ? Math.max(0, creatorData.followers) : 0;
      const dbFollowing = typeof creatorData.following === 'number' ? Math.max(0, creatorData.following) : 0;
      const cleanFollowers = followQueryOk && cUsername
        ? (liveFollowersByUser[cUsername] ? liveFollowersByUser[cUsername].size : 0)
        : dbFollowers;
      const cleanFollowing = followQueryOk && cUsername
        ? (liveFollowingByUser[cUsername] ? liveFollowingByUser[cUsername].size : 0)
        : dbFollowing;

      const dbLikes = typeof row.stats?.likes === 'number' ? Math.max(0, row.stats.likes) : 0;
      const recordsLikes = liveLikeUsers[row.id] ? liveLikeUsers[row.id].size : 0;
      const rawLikes = likeQueryOk ? recordsLikes : dbLikes;
      const rawTips = typeof row.stats?.tipsTotalGHS === 'number' ? Math.max(0, row.stats.tipsTotalGHS) : 0;
      const rawTipsCount = typeof row.stats?.tipsCount === 'number' ? Math.max(0, row.stats.tipsCount) : 0;
      const rawShares = typeof row.stats?.shares === 'number' ? Math.max(0, row.stats.shares) : 0;
      const rawComments = typeof row.stats?.comments === 'number' ? Math.max(0, row.stats.comments) : (row.stats?.commentsList?.length ?? 0);
      const dbViews = typeof row.stats?.views === 'number' ? Math.max(0, row.stats.views) : 0;
      const recordsViews = liveViewUsers[row.id] ? liveViewUsers[row.id].size : 0;
      const rawViews = viewQueryOk ? recordsViews : dbViews;

      return {
        id: row.id,
        createdAt: row.created_at || row.creator_data?.createdAt,
        title: row.title,
        caption: row.caption,
        videoUrl: streamUrl,
        thumbnailUrl: row.thumbnail_url,
        category: row.category,
        hashtags: row.hashtags || [],
        creator: {
          ...creatorData,
          followers: cleanFollowers,
          following: cleanFollowing,
        },
        stats: {
          likes: rawLikes,
          comments: rawComments,
          shares: rawShares,
          views: rawViews,
          tipsTotalGHS: rawTips,
          tipsCount: rawTipsCount,
          commentsList: Array.isArray(row.stats?.commentsList) ? row.stats.commentsList : [],
        },
        audioTrack: row.audio_track || { title: 'Original Audio', artist: row.creator_data?.name || 'Creator' },
        isPayPerUnlock: row.is_pay_per_unlock,
        unlockPriceGHS: row.unlock_price_ghs,
        isAiContent: row.is_ai_content,
        aiDisclosureType: row.ai_disclosure_type,
        aiToolsUsed: row.ai_tools_used,
        valuSplit: row.valu_split,
        communityGoal: row.community_goal,
      };
    });
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch videos:', err);
    return null;
  }
}

/**
 * Persist comment to Supabase video row (inside stats JSONB)
 */
export async function saveCommentToSupabase(videoId: string, comment: any): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('stats')
      .eq('id', videoId)
      .single();

    if (error || !data) {
      console.warn('[Supabase DB] Failed to fetch video stats for comment save:', error?.message);
      return false;
    }

    const currentStats = data.stats || {};
    const existingComments: any[] = currentStats.commentsList || [];
    
    // Check if duplicate comment already exists
    if (!existingComments.some((c: any) => c.id === comment.id)) {
      const updatedList = [comment, ...existingComments];
      const updatedStats = {
        ...currentStats,
        comments: updatedList.length,
        commentsList: updatedList,
      };

      const { error: updateError } = await supabase
        .from('videos')
        .update({ stats: updatedStats })
        .eq('id', videoId);

      if (updateError) {
        console.warn('[Supabase DB] Failed to update comments in Supabase:', updateError.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] saveCommentToSupabase error:', err);
    return false;
  }
}

/**
 * Record a transaction (Tip, Cashout, Top-Up) to Supabase 'transactions' table
 */
export async function recordTransactionToSupabase(tx: TransactionItem, userId?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert([{
        id: tx.id,
        user_id: userId || null,
        type: tx.type,
        title: tx.title,
        subtitle: tx.subtitle,
        amount_ghs: tx.amountGHS,
        status: tx.status,
        method: tx.method,
        timestamp: new Date().toISOString()
      }]);

    return !error;
  } catch (err) {
    console.warn('[Supabase DB] Transaction record error:', err);
    return false;
  }
}

/**
 * Fetch bounties from Supabase 'bounties' table
 */
export async function fetchBountiesFromSupabase(): Promise<BountyChallenge[] | null> {
  try {
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      sponsor: row.sponsor,
      sponsorLogo: row.sponsor_logo || '💼',
      rewardPoolGHS: Number(row.reward_pool_ghs) || 0,
      rewardPoolUSD: Number(row.reward_pool_usd) || 0,
      participantsCount: row.participants_count || 0,
      submissionsCount: row.submissions_count || 0,
      daysRemaining: row.days_remaining || 14,
      category: row.category || 'tech',
      description: `Sponsored challenge by ${row.sponsor}. Submit authentic video reviews to win from the upfront escrow reward pool!`,
      requirements: [
        'High quality vertical video demonstration',
        `Include sponsor tag #${row.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
        'Must link creator profile for instant MoMo escrow payout',
      ],
      submissionTag: `#${row.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
      bannerColor: 'from-blue-600 via-cyan-600 to-amber-500',
    }));
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch bounties:', err);
    return null;
  }
}

/**
 * Fetch transactions from Supabase 'transactions' table (User-Scoped Only)
 */
export async function fetchTransactionsFromSupabase(userId?: string): Promise<TransactionItem[] | null> {
  if (!userId) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      type: row.type as any,
      title: row.title,
      subtitle: row.subtitle,
      amountGHS: Number(row.amount_ghs) || 0,
      status: (row.status as any) || 'completed',
      method: (row.method as any) || 'MTN MoMo',
      referenceId: row.id.startsWith('tx-') ? row.id.slice(3, 12).toUpperCase() : row.id,
      timestamp: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch transactions:', err);
    return [];
  }
}

/**
 * Test connectivity to the Supabase Backend
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    // Ping Supabase Auth / Health
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Connected to Supabase (xfxyyrcbgmllzxsybfbg)' };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Connection failed' };
  }
}

/**
 * Register a new user with Supabase Email & Password
 */
export async function signUpWithEmail(email: string, password: string, name: string, username: string, phone?: string) {
  try {
    const cleanUsername = (username.trim().replace(/^@/, '') || email.split('@')[0]).toLowerCase();
    const cleanName = name.trim() || 'ValuVid Creator';
    const avatarUrl = '/default-avatar.jpg';

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: cleanName,
          username: cleanUsername,
          avatar: avatarUrl,
          phone: phone ? phone.trim() : undefined,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      saveUserProfileToSupabase({
        id: data.user.id,
        username: cleanUsername,
        name: cleanName,
        avatar: avatarUrl,
        phone,
        email: email.trim(),
      }).catch(() => {});
    }

    return { 
      success: true, 
      user: data.user, 
      session: data.session,
      requiresEmailConfirmation: !data.session && !!data.user
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sign up failed' };
  }
}

/**
 * Log in an existing user with Supabase Email & Password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const meta = data.user.user_metadata || {};
      saveUserProfileToSupabase({
        id: data.user.id,
        username: meta.username || email.split('@')[0],
        name: meta.name || 'ValuVid Creator',
        avatar: meta.avatar || '/default-avatar.jpg',
        email: email.trim(),
      }).catch(() => {});
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sign in failed' };
  }
}

/**
 * Log out current Supabase user
 */
export async function signOutSupabase() {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get current session user
 */
export async function getCurrentSupabaseUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Save / Upsert user profile to Supabase public 'profiles' table
 */
export async function saveUserProfileToSupabase(profile: {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
  phone?: string;
  email?: string;
  pinnedVideoIds?: string[];
}): Promise<boolean> {
  try {
    const cleanUsername = profile.username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) return false;

    // 1. Attempt upsert into 'profiles' table if it exists
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          username: cleanUsername,
          name: profile.name || cleanUsername,
          avatar: profile.avatar || '/default-avatar.jpg',
          bio: profile.bio || 'ValuVid Creator 🇬🇭',
          followers: profile.followers ?? 0,
          following: profile.following ?? 0,
          verified: profile.verified ?? false,
          phone: profile.phone || '',
          email: profile.email || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    } catch {}

    // 2. Always persist into public user registry in videos table so search works instantly across all devices
    const registryRow = {
      id: `user-profile-${cleanUsername}`,
      title: `${profile.name || cleanUsername} Profile`,
      caption: '[USER_REGISTRY]',
      video_url: `valuvid://user/${cleanUsername}`,
      category: 'user_registry',
      creator_id: profile.id || `usr-${cleanUsername}`,
      creator_data: {
        id: profile.id || `usr-${cleanUsername}`,
        name: profile.name || cleanUsername,
        username: cleanUsername,
        avatar: profile.avatar || '/default-avatar.jpg',
        bio: profile.bio || 'ValuVid Creator 🇬🇭',
        followers: profile.followers ?? 0,
        following: profile.following ?? 0,
        verified: profile.verified ?? false,
        ...(Array.isArray(profile.pinnedVideoIds) ? { pinnedVideoIds: profile.pinnedVideoIds.slice(0, 3) } : {}),
      },
    };

    const { error: regErr } = await supabase
      .from('videos')
      .upsert(registryRow, { onConflict: 'id' });

    if (regErr) {
      console.warn('[Supabase DB] Failed to persist user registry:', regErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] saveUserProfileToSupabase error:', err);
    return false;
  }
}

/**
 * Search profiles in Supabase public 'profiles' table or extract from videos
 */
export async function searchProfilesInSupabase(query: string) {
  try {
    const clean = query.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return [];

    // 1. Try querying public 'profiles' table first if exists
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${clean}%,name.ilike.%${clean}%`)
        .limit(20);

      if (!error && data && data.length > 0) {
        const realProfiles = data.filter((p: any) => p.username && !isMockAccount(p.username));
        if (realProfiles.length > 0) {
          return realProfiles;
        }
      }
    } catch {}

    // 2. Search creators in videos table (covers real video uploaders and registered users)
    const { data: vData } = await supabase
      .from('videos')
      .select('creator_data')
      .or(`id.ilike.%${clean}%,title.ilike.%${clean}%,creator_id.ilike.%${clean}%`)
      .limit(50);

    const targetRows = (vData && vData.length > 0) 
      ? vData 
      : ((await supabase.from('videos').select('creator_data').limit(150)).data || []);

    if (targetRows && targetRows.length > 0) {
      const results: any[] = [];
      const seen = new Set<string>();
      targetRows.forEach((row: any) => {
        const c = row.creator_data;
        if (c && c.username && !isMockAccount(c.username)) {
          const u = c.username.toLowerCase();
          const n = (c.name || '').toLowerCase();
          if ((u.includes(clean) || n.includes(clean)) && !seen.has(u)) {
            seen.add(u);
            const cleanFollowers = typeof c.followers === 'number' ? Math.max(0, c.followers) : 0;
            const cleanFollowing = typeof c.following === 'number' ? Math.max(0, c.following) : 0;
            results.push({
              id: c.id || `usr-${u}`,
              name: c.name || u,
              username: c.username,
              avatar: getUserAvatar(c.avatar, c.name || c.username),
              bio: c.bio || 'ValuVid Creator 🇬🇭',
              followers: cleanFollowers,
              following: cleanFollowing,
              verified: c.verified || false,
            });
          }
        }
      });
      return results;
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch full live profile stats (followers, following, likes) from Supabase
 */
export async function fetchUserProfileFromSupabase(usernameOrId: string) {
  try {
    const clean = (usernameOrId || '').trim().toLowerCase().replace(/^@/, '');
    if (!clean) return null;

    // 1. Fetch registry row or creator video
    const { data: regRow } = await supabase
      .from('videos')
      .select('creator_data')
      .eq('id', `user-profile-${clean}`)
      .maybeSingle();

    // 2. Count live followers from follow_record rows (strictly real users)
    const { data: followerRows } = await supabase
      .from('videos')
      .select('creator_id, creator_data')
      .eq('category', 'follow_record')
      .eq('creator_data->>following', clean);

    const liveFollowers = Array.isArray(followerRows)
      ? new Set(
          followerRows
            .map((r: any) => (r.creator_data?.follower || r.creator_id || '').toString().trim().toLowerCase().replace(/^@/, ''))
            .filter((u: string) => isValidFollowActor(u) && u !== clean)
        ).size
      : null;

    // 3. Count live following from follow_record rows (strictly real users)
    const { data: followingRows } = await supabase
      .from('videos')
      .select('creator_data')
      .eq('category', 'follow_record')
      .eq('creator_data->>follower', clean);

    const liveFollowing = Array.isArray(followingRows)
      ? new Set(
          followingRows
            .map((r: any) => (r.creator_data?.following || '').toString().trim().toLowerCase().replace(/^@/, ''))
            .filter((u: string) => isValidFollowActor(u) && u !== clean)
        ).size
      : null;

    // 4. Calculate total likes across all creator videos (combining db stats and live like records)
    const { data: creatorVideos } = await supabase
      .from('videos')
      .select('id, stats, creator_data')
      .neq('caption', '[DELETED]')
      .neq('category', 'deleted')
      .neq('category', 'user_registry')
      .neq('category', 'follow_record')
      .neq('category', 'like_record')
      .neq('category', 'view_record')
      .or(`creator_id.eq.${clean},creator_data->>username.eq.${clean}`);

    let totalLikes = 0;
    if (creatorVideos && creatorVideos.length > 0) {
      const creatorVidIds = new Set(creatorVideos.map((v: any) => v.id));
      const liveLikeUsers: Record<string, Set<string>> = {};
      let likeQueryOk = false;
      try {
        const { data: likeRows, error: likeErr } = await supabase
          .from('videos')
          .select('creator_id, creator_data, video_url')
          .eq('category', 'like_record')
          .limit(3000);
        if (!likeErr && likeRows) {
          likeQueryOk = true;
          likeRows.forEach((lr: any) => {
            const vid = lr.creator_data?.videoId || (lr.video_url?.startsWith('valuvid://like/') ? lr.video_url.split('/')[4] : null);
            const actor = (lr.creator_data?.userId || lr.creator_id || '').toString().trim().toLowerCase().replace(/^@/, '');
            if (vid && creatorVidIds.has(vid) && actor && !isMockAccount(actor)) {
              if (!liveLikeUsers[vid]) liveLikeUsers[vid] = new Set();
              liveLikeUsers[vid].add(actor);
            }
          });
        }
      } catch {}

      totalLikes = creatorVideos.reduce((sum: number, v: any) => {
        const dbLike = Number(v.stats?.likes) || 0;
        const liveLike = liveLikeUsers[v.id] ? liveLikeUsers[v.id].size : 0;
        return sum + (likeQueryOk ? liveLike : dbLike);
      }, 0);
    }

    const fallbackCreatorData = (creatorVideos && creatorVideos.length > 0 ? creatorVideos[0].creator_data : null) || {};
    const cData = regRow?.creator_data || fallbackCreatorData;
    const finalFollowers = typeof liveFollowers === 'number' ? liveFollowers : (cData.followers || 0);
    const finalFollowing = typeof liveFollowing === 'number' ? liveFollowing : (cData.following || 0);

    return {
      id: cData.id || `usr-${clean}`,
      username: clean,
      name: cData.name || clean,
      avatar: cData.avatar || '/default-avatar.jpg',
      bio: cData.bio || 'ValuVid Creator 🇬🇭',
      followers: Math.max(0, finalFollowers),
      following: Math.max(0, finalFollowing),
      likes: Math.max(0, totalLikes),
      verified: cData.verified || false,
      pinnedVideoIds: Array.isArray(cData.pinnedVideoIds) ? cData.pinnedVideoIds.slice(0, 3) : [],
    };
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch user profile:', err);
    return null;
  }
}

/**
 * Persist up to 3 pinned video IDs on the user's Supabase registry profile
 */
export async function savePinnedVideosInSupabase(
  username: string,
  pinnedVideoIds: string[],
  fallbackProfile?: { id?: string; name?: string; avatar?: string; bio?: string }
): Promise<boolean> {
  try {
    const clean = (username || '').trim().toLowerCase().replace(/^@/, '');
    if (!clean) return false;
    const capped = Array.from(new Set(pinnedVideoIds)).slice(0, 3);

    const { data: existing } = await supabase
      .from('videos')
      .select('creator_id, creator_data')
      .eq('id', `user-profile-${clean}`)
      .maybeSingle();

    const prevData = existing?.creator_data || {};
    const creatorId = existing?.creator_id || fallbackProfile?.id || `usr-${clean}`;

    const { error } = await supabase
      .from('videos')
      .upsert({
        id: `user-profile-${clean}`,
        title: `${prevData.name || fallbackProfile?.name || clean} Profile`,
        caption: '[USER_REGISTRY]',
        video_url: `valuvid://user/${clean}`,
        category: 'user_registry',
        creator_id: creatorId,
        creator_data: {
          ...prevData,
          id: creatorId,
          username: clean,
          name: prevData.name || fallbackProfile?.name || clean,
          avatar: prevData.avatar || fallbackProfile?.avatar || '/default-avatar.jpg',
          bio: prevData.bio || fallbackProfile?.bio || 'ValuVid Creator 🇬🇭',
          pinnedVideoIds: capped,
        },
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase DB] Failed to save pinned videos:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] savePinnedVideosInSupabase error:', err);
    return false;
  }
}

/**
 * Fetch followers list for a user from Supabase
 */
export async function fetchFollowersListFromSupabase(targetUsername: string): Promise<any[]> {
  try {
    const clean = (targetUsername || '').trim().toLowerCase().replace(/^@/, '');
    if (!clean) return [];

    const { data, error } = await supabase
      .from('videos')
      .select('creator_id, creator_data')
      .eq('category', 'follow_record')
      .eq('creator_data->>following', clean);

    if (error || !data || data.length === 0) return [];
    const usernames: string[] = data.map((r: any) => r.creator_id || r.creator_data?.follower).filter(Boolean);
    const unique = Array.from(new Set(usernames.map(u => u.toLowerCase().replace(/^@/, '')))).filter(
      (u) => isValidFollowActor(u) && u !== clean
    );

    const results: any[] = [];
    for (const u of unique) {
      const p = await fetchUserProfileFromSupabase(u);
      if (p) {
        results.push(p);
      } else {
        results.push({
          id: `usr-${u}`,
          name: u.charAt(0).toUpperCase() + u.slice(1),
          username: u,
          avatar: getUserAvatar(undefined, u),
          bio: 'ValuVid Creator 🇬🇭',
          followers: 0,
          following: 0,
          likes: 0,
          verified: false,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Fetch following list for a user from Supabase
 */
export async function fetchFollowingListFromSupabase(followerUsername: string): Promise<any[]> {
  try {
    const clean = (followerUsername || '').trim().toLowerCase().replace(/^@/, '');
    if (!clean) return [];

    const { data, error } = await supabase
      .from('videos')
      .select('creator_id, creator_data')
      .eq('category', 'follow_record')
      .eq('creator_data->>follower', clean);

    if (error || !data || data.length === 0) return [];
    const usernames: string[] = data.map((r: any) => r.creator_data?.following).filter(Boolean);
    const unique = Array.from(new Set(usernames.map(u => u.toLowerCase().replace(/^@/, '')))).filter(
      (u) => isValidFollowActor(u) && u !== clean
    );

    const results: any[] = [];
    for (const u of unique) {
      const p = await fetchUserProfileFromSupabase(u);
      if (p) {
        results.push(p);
      } else {
        results.push({
          id: `usr-${u}`,
          name: u.charAt(0).toUpperCase() + u.slice(1),
          username: u,
          avatar: getUserAvatar(undefined, u),
          bio: 'ValuVid Creator 🇬🇭',
          followers: 0,
          following: 0,
          likes: 0,
          verified: false,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}
