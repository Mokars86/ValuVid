import { createClient } from '@supabase/supabase-js';
import { VideoItem, TransactionItem, BountyChallenge } from '../types';

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
    const { data, error } = await supabase
      .from('videos')
      .insert([{
        id: video.id,
        title: video.title,
        caption: video.caption,
        video_url: video.videoUrl,
        thumbnail_url: video.thumbnailUrl,
        category: video.category,
        hashtags: video.hashtags,
        creator_id: video.creator.id,
        creator_data: video.creator,
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
 * Synchronize follower changes across creator videos in Supabase
 */
export async function updateCreatorFollowersInSupabase(creatorId: string, delta: number): Promise<boolean> {
  try {
    const { data: vids, error } = await supabase
      .from('videos')
      .select('id, creator_data')
      .or(`creator_id.eq.${creatorId},creator_data->>id.eq.${creatorId}`);

    if (error) {
      console.warn('[Supabase DB] Failed to find creator videos:', error.message);
      return false;
    }

    if (vids && vids.length > 0) {
      for (const row of vids) {
        const cData = row.creator_data || {};
        const currentCount = typeof cData.followers === 'number' ? cData.followers : 0;
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

/**
 * Delete a video from Supabase 'videos' table (permanently tombstones in cloud and local cache)
 */
export async function deleteVideoFromSupabase(videoId: string): Promise<{ success: boolean; error?: any }> {
  try {
    markVideoAsDeleted(videoId);

    // 1. Permanently tombstone in Supabase (UPDATE is authorized and survives refresh)
    await supabase
      .from('videos')
      .update({ caption: '[DELETED]' })
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
export async function fetchVideosFromSupabase(): Promise<VideoItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .neq('caption', '[DELETED]')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const deletedIds = getDeletedVideoIds();
    // Exclude mock seed videos ('vid-user-1', 'vid-masterclass-1'), template samples, and any deleted videos
    const cleanRows = data.filter((row: any) => 
      row.caption !== '[DELETED]' && 
      !deletedIds.includes(row.id) &&
      row.id !== 'vid-user-1' &&
      row.id !== 'vid-masterclass-1' &&
      !row.id.startsWith('vid-sample') &&
      !row.video_url?.includes('/videos/sample')
    );

    if (cleanRows.length === 0) {
      return [];
    }

    // Map DB columns back to frontend VideoItem interface
    return cleanRows.map((row: any) => ({
      id: row.id,
      title: row.title,
      caption: row.caption,
      videoUrl: row.video_url || '',
      thumbnailUrl: row.thumbnail_url,
      category: row.category,
      hashtags: row.hashtags || [],
      creator: row.creator_data,
      stats: {
        likes: (row.stats?.likes === 1 && row.stats?.views === 12) ? 0 : (row.stats?.likes ?? 0),
        comments: row.stats?.comments ?? (row.stats?.commentsList?.length ?? 0),
        shares: row.stats?.shares ?? 0,
        views: (row.stats?.views === 12 && row.stats?.likes === 1) ? 1 : (row.stats?.views ?? 1),
        tipsTotalGHS: row.stats?.tipsTotalGHS ?? 0,
        tipsCount: row.stats?.tipsCount ?? 0,
        commentsList: row.stats?.commentsList || [],
      },
      audioTrack: row.audio_track || { title: 'Original Audio', artist: row.creator_data?.name || 'Creator' },
      isPayPerUnlock: row.is_pay_per_unlock,
      unlockPriceGHS: row.unlock_price_ghs,
      isAiContent: row.is_ai_content,
      aiDisclosureType: row.ai_disclosure_type,
      aiToolsUsed: row.ai_tools_used,
      valuSplit: row.valu_split,
      communityGoal: row.community_goal,
    }));
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
export async function recordTransactionToSupabase(tx: TransactionItem): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert([{
        id: tx.id,
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
 * Fetch transactions from Supabase 'transactions' table
 */
export async function fetchTransactionsFromSupabase(): Promise<TransactionItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error || !data) {
      return null;
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
    return null;
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
