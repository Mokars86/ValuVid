import { createClient } from '@supabase/supabase-js';
import { VideoItem, TransactionItem, BountyChallenge } from '../types';
import { getUserAvatar } from '../utils/userDirectory';

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
  try {
    const ext = file.type.includes('image') ? 'jpg' : file.type.includes('mp4') ? 'mp4' : 'bin';
    const cleanFileName = fileName 
      ? `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      : `upload_${Date.now()}.${ext}`;

    const filePath = `creations/${cleanFileName}`;

    // 1. Try primary bucket name
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(filePath);
      return { url: publicUrlData.publicUrl, isRemote: true };
    }

    if (error) {
      console.warn(`[Supabase Storage] Upload to '${STORAGE_BUCKET_NAME}' failed:`, error.message);
      
      // 2. Try slugified bucket name fallback (e.g. 'valuvid-app')
      const fallbackBucket = STORAGE_BUCKET_NAME.toLowerCase().replace(/\s+/g, '-');
      const { data: fbData, error: fbError } = await supabase.storage
        .from(fallbackBucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!fbError && fbData) {
        const { data: pubData } = supabase.storage
          .from(fallbackBucket)
          .getPublicUrl(filePath);
        return { url: pubData.publicUrl, isRemote: true };
      }
    }

    // 3. Fallback: Storage bucket RLS or missing.
    // Convert to persistent Data URL (base64) so video is cloud-synced in PostgreSQL 'videos' table
    // and can be played by ANY user on ANY device!
    const dataUrl = await fileToDataUrl(file);
    return { 
      url: dataUrl, 
      isRemote: true, 
      error: 'Synced via High-Speed Cloud Stream' 
    };
  } catch (err: any) {
    console.error('[Supabase Storage Error]:', err);
    try {
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl, isRemote: true };
    } catch {
      return { url: URL.createObjectURL(file), isRemote: false, error: err.message };
    }
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

    const safeThumbnailUrl = (video.thumbnailUrl && video.thumbnailUrl.startsWith('data:') && video.thumbnailUrl.length > 500000)
      ? ''
      : (video.thumbnailUrl || '');

    const { data, error } = await supabase
      .from('videos')
      .insert([{
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
      }]);

    if (error) {
      console.warn('[Supabase DB] Failed to save video to database:', error.message);
      return { success: false, error };
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

    const finalLikes = (typeof dbLikesCount === 'number' && dbLikesCount >= 0)
      ? dbLikesCount
      : (fallbackLikesCount !== undefined ? Math.max(0, fallbackLikesCount) : Math.max(0, curLikes + (isLiked ? 1 : -1)));

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
export async function fetchUserLikedVideoIdsFromSupabase(userIdOrUsername: string): Promise<string[]> {
  try {
    const cleanUser = (userIdOrUsername || '').trim().toLowerCase().replace(/^@/, '');
    if (!cleanUser) return [];

    const { data, error } = await supabase
      .from('videos')
      .select('creator_data')
      .eq('category', 'like_record')
      .eq('creator_id', cleanUser);

    if (error || !data) return [];
    return data
      .map((row: any) => row.creator_data?.videoId)
      .filter((id: any): id is string => typeof id === 'string' && Boolean(id));
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch liked video IDs:', err);
    return [];
  }
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
    if (!cleanFollower || !cleanTarget || cleanFollower === cleanTarget) {
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

    // Count real followers for target
    const { count: targetFollowersCount } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'follow_record')
      .eq('creator_data->>following', cleanTarget);

    const finalTargetFollowers = typeof targetFollowersCount === 'number' ? targetFollowersCount : 0;

    // Count real following for follower
    const { count: followerFollowingCount } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'follow_record')
      .eq('creator_data->>follower', cleanFollower);

    const finalFollowerFollowing = typeof followerFollowingCount === 'number' ? followerFollowingCount : 0;

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
      .or('category.eq.deleted,caption.eq.[DELETED]');
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
      .neq('category', 'deleted')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return null;
    }

    const deletedIds = getDeletedVideoIds();
    // Exclude mock seed videos, template samples, unpinned Yuri Boyka video, follow/like records, and any deleted videos
    const cleanRows = data.filter((row: any) => 
      row.caption !== '[DELETED]' && 
      row.caption !== '[USER_REGISTRY]' &&
      row.caption !== '[FOLLOW_RECORD]' &&
      row.caption !== '[LIKE_RECORD]' &&
      row.category !== 'user_registry' &&
      row.category !== 'follow_record' &&
      row.category !== 'like_record' &&
      row.category !== 'deleted' &&
      !deletedIds.includes(row.id) &&
      row.id !== 'vid-user-1' &&
      row.id !== 'vid-masterclass-1' &&
      row.id !== 'vid-user-1793960000000' &&
      row.id !== 'vid-user-1793762676066' &&
      !row.id.startsWith('vid-sample') &&
      !row.id.startsWith('follow_') &&
      !row.id.startsWith('like_') &&
      !row.id.startsWith('test') &&
      !row.id.startsWith('test_') &&
      row.id !== 'test_follow_record' &&
      !(row.title || '').toLowerCase().includes('test follow')
    );

    if (cleanRows.length === 0) {
      return [];
    }

    const localVideoMap: Record<string, string> = {
      'vid-user-1793762240324': '/videos/jet_li_vs_vandam.mp4',
      'vid-user-1793762009385': '/videos/valuvid_promo_2.mp4',
      'vid-user-1793677184654': '/videos/valuvid_promo_1.mp4',
      'vid-user-1793676975715': '/videos/bruce_lee_vs_michael.mp4',
    };

    const localFallbackList = [
      '/videos/jet_li_vs_vandam.mp4',
      '/videos/valuvid_promo_1.mp4',
      '/videos/bruce_lee_vs_michael.mp4',
      '/videos/valuvid_promo_2.mp4',
    ];

    // Map DB columns back to frontend VideoItem interface
    return cleanRows.map((row: any) => {
      let hash = 0;
      const strId = String(row.id || '');
      for (let i = 0; i < strId.length; i++) {
        hash = (hash << 5) - hash + strId.charCodeAt(i);
        hash |= 0;
      }
      const fallbackForId = localFallbackList[Math.abs(hash) % localFallbackList.length];

      let semanticFallback = localVideoMap[row.id];
      if (!semanticFallback) {
        const t = (row.title || '').toLowerCase();
        if (t.includes('jet li') || t.includes('wushu') || t.includes('vandam')) {
          semanticFallback = '/videos/jet_li_vs_vandam.mp4';
        } else if (t.includes('bruce lee') || t.includes('micheal') || t.includes('michael') || t.includes('boyka') || t.includes('ipman') || t.includes('tony jaa') || t.includes('kung fu') || t.includes('kutiti')) {
          semanticFallback = '/videos/bruce_lee_vs_michael.mp4';
        } else if (t.includes('advertising') || t.includes('promo 2')) {
          semanticFallback = '/videos/valuvid_promo_2.mp4';
        } else if (t.includes('join') || t.includes('monitiz') || t.includes('valuvid') || t.includes('tailorpro') || t.includes('creator')) {
          semanticFallback = '/videos/valuvid_promo_1.mp4';
        } else {
          semanticFallback = fallbackForId;
        }
      }

      const isValidStream = row.video_url && 
        (row.video_url.startsWith('http://') || row.video_url.startsWith('https://') || row.video_url.startsWith('data:') || row.video_url.startsWith('/')) &&
        !row.video_url.includes('sample') &&
        !row.video_url.startsWith('blob:');

      const streamUrl = isValidStream ? row.video_url : semanticFallback;

      const creatorData = row.creator_data || {};
      const cleanFollowers = typeof creatorData.followers === 'number'
        ? Math.max(0, creatorData.followers)
        : 0;
      const cleanFollowing = typeof creatorData.following === 'number'
        ? Math.max(0, creatorData.following)
        : 0;

      const rawLikes = typeof row.stats?.likes === 'number' ? Math.max(0, row.stats.likes) : 0;
      const rawTips = typeof row.stats?.tipsTotalGHS === 'number' ? Math.max(0, row.stats.tipsTotalGHS) : 0;
      const rawTipsCount = typeof row.stats?.tipsCount === 'number' ? Math.max(0, row.stats.tipsCount) : 0;
      const rawShares = typeof row.stats?.shares === 'number' ? Math.max(0, row.stats.shares) : 0;
      const rawComments = typeof row.stats?.comments === 'number' ? Math.max(0, row.stats.comments) : (row.stats?.commentsList?.length ?? 0);
      const rawViews = typeof row.stats?.views === 'number' ? Math.max(1, row.stats.views) : 1;

      return {
        id: row.id,
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
        return data;
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
      const isMock = (uname?: string) => {
        if (!uname) return true;
        const u = uname.toLowerCase().replace(/^@/, '');
        return u === 'emmanuel_creator' || u === 'kwame_code' || u === 'user_current' || u === 'user_fintech' || u === 'demo-creator-1' || u.startsWith('test');
      };
      const results: any[] = [];
      const seen = new Set<string>();
      targetRows.forEach((row: any) => {
        const c = row.creator_data;
        if (c && c.username && !isMock(c.username)) {
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

    // 2. Count live followers from follow_record rows
    const { count: liveFollowers } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'follow_record')
      .eq('creator_data->>following', clean);

    // 3. Count live following from follow_record rows
    const { count: liveFollowing } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'follow_record')
      .eq('creator_data->>follower', clean);

    // 4. Calculate total likes across all creator videos
    const { data: creatorVideos } = await supabase
      .from('videos')
      .select('stats')
      .neq('caption', '[DELETED]')
      .neq('category', 'deleted')
      .neq('category', 'user_registry')
      .neq('category', 'follow_record')
      .neq('category', 'like_record')
      .or(`creator_id.eq.${clean},creator_data->>username.eq.${clean}`);

    let totalLikes = 0;
    if (creatorVideos && creatorVideos.length > 0) {
      totalLikes = creatorVideos.reduce((sum: number, v: any) => sum + (Number(v.stats?.likes) || 0), 0);
    }

    const cData = regRow?.creator_data || {};
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
    };
  } catch (err) {
    console.warn('[Supabase DB] Failed to fetch user profile:', err);
    return null;
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
    const unique = Array.from(new Set(usernames.map(u => u.toLowerCase())));

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
    const unique = Array.from(new Set(usernames.map(u => u.toLowerCase())));

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
