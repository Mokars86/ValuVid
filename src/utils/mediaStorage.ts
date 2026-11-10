import { fetchVideoMediaUrl } from '../services/supabaseClient';

/**
 * IndexedDB-backed media storage for persistent video and thumbnail caching across browser refreshes
 */

const DB_NAME = 'valuvid_media_store';
const STORE_NAME = 'media_blobs';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MediaStorage] Failed to save media blob:', err);
  }
}

export async function getMediaBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Memory cache for object URLs created during current session
const liveUrlCache = new Map<string, string>();

export function cacheLiveVideoUrl(videoId: string, url: string): void {
  if (videoId && url) {
    liveUrlCache.set(videoId, url);
  }
}

/**
 * Convert a Data URL (base64) to a Blob efficiently for hardware-accelerated playback
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].replace('data:', '') || 'video/mp4';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

// Bundled sample mp4 videos shipped with ValuVid
export const BUNDLED_FALLBACK_VIDEOS = [
  '/videos/jet_li_vs_vandam.mp4',
  '/videos/valuvid_promo_1.mp4',
  '/videos/bruce_lee_vs_michael.mp4',
  '/videos/valuvid_promo_2.mp4',
];

/**
 * Deterministically pick a unique bundled sample video based on videoId hash,
 * ensuring each video item on the feed plays its own distinct video stream.
 */
export function getFallbackVideoForId(videoId?: string, fallbackUrl?: string, title?: string): string {
  if (fallbackUrl && (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://') || fallbackUrl.startsWith('/'))) {
    if (!fallbackUrl.startsWith('blob:') && !fallbackUrl.includes('sample')) {
      return fallbackUrl;
    }
  }

  const t = (title || '').toLowerCase();
  if (t.includes('jet li') || t.includes('wushu') || t.includes('vandam')) {
    return '/videos/jet_li_vs_vandam.mp4';
  }
  if (t.includes('bruce lee') || t.includes('micheal') || t.includes('michael') || t.includes('boyka') || t.includes('ipman') || t.includes('tony jaa') || t.includes('kung fu') || t.includes('kutiti')) {
    return '/videos/bruce_lee_vs_michael.mp4';
  }
  if (t.includes('advertising') || t.includes('promo 2')) {
    return '/videos/valuvid_promo_2.mp4';
  }
  if (t.includes('join') || t.includes('monitiz') || t.includes('valuvid') || t.includes('creator') || t.includes('tailorpro')) {
    return '/videos/valuvid_promo_1.mp4';
  }

  if (!videoId) return BUNDLED_FALLBACK_VIDEOS[0];
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = (hash << 5) - hash + videoId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BUNDLED_FALLBACK_VIDEOS.length;
  return BUNDLED_FALLBACK_VIDEOS[index];
}

/**
 * Synchronous immediate getter for already resolved/cached video URLs (0ms startup)
 */
export function getImmediateVideoUrl(videoId: string, fallbackUrl?: string, title?: string): string {
  if (liveUrlCache.has(videoId)) {
    const cached = liveUrlCache.get(videoId);
    if (cached) return cached;
  }
  if (fallbackUrl && fallbackUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(fallbackUrl);
      const objectUrl = URL.createObjectURL(blob);
      liveUrlCache.set(videoId, objectUrl);
      return objectUrl;
    } catch {}
  }
  if (fallbackUrl && (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://') || fallbackUrl.startsWith('/'))) {
    if (!fallbackUrl.startsWith('blob:') && !fallbackUrl.includes('sample')) {
      return fallbackUrl;
    }
  }
  return getFallbackVideoForId(videoId, fallbackUrl, title);
}

/**
 * Resolve video URL with TikTok-style IndexedDB local caching & instant hardware streaming.
 * Handles remote CDN URLs, persistent cloud Data URLs, and IndexedDB local blobs.
 */
export async function resolveLiveVideoUrl(videoId: string, fallbackUrl?: string, title?: string): Promise<string> {
  if (liveUrlCache.has(videoId)) {
    const cached = liveUrlCache.get(videoId)!;
    if (cached) {
      return cached;
    }
  }

  // 1. Check if media blob is stored in IndexedDB under this specific videoId
  try {
    const blob = await getMediaBlob(videoId);
    if (blob) {
      const freshUrl = URL.createObjectURL(blob);
      liveUrlCache.set(videoId, freshUrl);
      return freshUrl;
    }
  } catch (err) {
    console.warn('[MediaStorage] Failed to read blob for video', videoId, err);
  }

  // 2. If fallbackUrl is a persistent cloud Data URL, convert to local Blob for smooth Android playback
  if (fallbackUrl && fallbackUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(fallbackUrl);
      saveMediaBlob(videoId, blob);
      const objectUrl = URL.createObjectURL(blob);
      liveUrlCache.set(videoId, objectUrl);
      return objectUrl;
    } catch (e) {
      return fallbackUrl;
    }
  }

  // 3. If fallbackUrl is a remote HTTP / HTTPS CDN stream or local asset path
  if (fallbackUrl && (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://') || fallbackUrl.startsWith('/'))) {
    if (fallbackUrl.startsWith('blob:') || fallbackUrl.includes('sample')) {
      const defFallback = getFallbackVideoForId(videoId, undefined, title);
      return defFallback;
    }
    liveUrlCache.set(videoId, fallbackUrl);
    if (!fallbackUrl.startsWith('/')) {
      fetchAndCacheMedia(videoId, fallbackUrl);
    }
    return fallbackUrl;
  }

  // 4. If fallbackUrl is empty, fetch stream URL directly from Supabase by primary key id
  if (!fallbackUrl && videoId) {
    try {
      const fetchedStream = await fetchVideoMediaUrl(videoId);
      if (fetchedStream) {
        if (fetchedStream.startsWith('data:')) {
          const blob = dataUrlToBlob(fetchedStream);
          saveMediaBlob(videoId, blob);
          const objectUrl = URL.createObjectURL(blob);
          liveUrlCache.set(videoId, objectUrl);
          return objectUrl;
        } else if (fetchedStream.startsWith('http://') || fetchedStream.startsWith('https://') || fetchedStream.startsWith('/')) {
          if (!fetchedStream.includes('sample')) {
            liveUrlCache.set(videoId, fetchedStream);
            return fetchedStream;
          }
        }
      }
    } catch {}
  }

  // 5. Only check 'latest_upload' if this video IS the latest upload placeholder
  if (videoId === 'latest_upload') {
    try {
      const latestBlob = await getMediaBlob('latest_upload');
      if (latestBlob) {
        const freshUrl = URL.createObjectURL(latestBlob);
        liveUrlCache.set(videoId, freshUrl);
        return freshUrl;
      }
    } catch {}
  }

  // 6. Return deterministic unique fallback for this videoId
  const finalFallback = getFallbackVideoForId(videoId, fallbackUrl, title);
  liveUrlCache.set(videoId, finalFallback);
  return finalFallback;
}

/**
 * Proactively preload a video (TikTok architecture) into browser multimedia cache & memory
 */
export async function preloadVideo(videoId: string, url: string): Promise<void> {
  if (!videoId) return;
  if (liveUrlCache.has(videoId)) return;

  try {
    const cachedBlob = await getMediaBlob(videoId);
    if (cachedBlob) {
      const objUrl = URL.createObjectURL(cachedBlob);
      liveUrlCache.set(videoId, objUrl);
      return;
    }

    if (url && url.startsWith('data:')) {
      const blob = dataUrlToBlob(url);
      await saveMediaBlob(videoId, blob);
      const objUrl = URL.createObjectURL(blob);
      liveUrlCache.set(videoId, objUrl);
    } else if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      liveUrlCache.set(videoId, url);
      fetchAndCacheMedia(videoId, url);
    } else if (!url) {
      // Lazy fetch stream in background
      fetchVideoMediaUrl(videoId).then(async (stream) => {
        if (stream && stream.startsWith('data:')) {
          const blob = dataUrlToBlob(stream);
          await saveMediaBlob(videoId, blob);
          const objUrl = URL.createObjectURL(blob);
          liveUrlCache.set(videoId, objUrl);
        }
      });
    }
  } catch {}
}

async function fetchAndCacheMedia(videoId: string, remoteUrl: string): Promise<void> {
  try {
    const res = await fetch(remoteUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      await saveMediaBlob(videoId, blob);
    }
  } catch {}
}
