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

/**
 * Resolve video URL with TikTok-style IndexedDB local caching & instant hardware streaming.
 * Handles remote CDN URLs, persistent cloud Data URLs, and IndexedDB local blobs.
 */
export async function resolveLiveVideoUrl(videoId: string, fallbackUrl?: string): Promise<string> {
  if (liveUrlCache.has(videoId)) {
    const cached = liveUrlCache.get(videoId)!;
    if (cached) {
      return cached;
    }
  }

  // 1. Check if media blob is stored in IndexedDB under this videoId
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
      // Cache asynchronously to IndexedDB so future views don't re-parse Base64
      saveMediaBlob(videoId, blob);
      const objectUrl = URL.createObjectURL(blob);
      liveUrlCache.set(videoId, objectUrl);
      return objectUrl;
    } catch (e) {
      console.warn('[MediaStorage] Failed to convert dataUrl to blob:', e);
      return fallbackUrl;
    }
  }

  // 3. If fallbackUrl is a remote HTTP / HTTPS CDN stream
  if (fallbackUrl && (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://'))) {
    // If it's a dead in-memory blob from another client device session, disregard
    if (fallbackUrl.startsWith('blob:')) {
      return '';
    }
    // Pre-cache remote video into IndexedDB in background for instant repeat playback
    fetchAndCacheMedia(videoId, fallbackUrl);
    liveUrlCache.set(videoId, fallbackUrl);
    return fallbackUrl;
  }

  // 4. Check if a blob exists in 'latest_upload' as fallback
  try {
    const latestBlob = await getMediaBlob('latest_upload');
    if (latestBlob) {
      const freshUrl = URL.createObjectURL(latestBlob);
      liveUrlCache.set(videoId, freshUrl);
      return freshUrl;
    }
  } catch {}

  // Disregard dead blob: URLs from other devices
  if (fallbackUrl && fallbackUrl.startsWith('blob:')) {
    return '';
  }

  return fallbackUrl || '';
}

/**
 * Proactively preload a video (TikTok architecture) into IndexedDB & memory cache
 */
export async function preloadVideo(videoId: string, url: string): Promise<void> {
  if (!videoId || !url) return;
  if (liveUrlCache.has(videoId)) return;

  try {
    const cachedBlob = await getMediaBlob(videoId);
    if (cachedBlob) return;

    if (url.startsWith('data:')) {
      const blob = dataUrlToBlob(url);
      await saveMediaBlob(videoId, blob);
      const objUrl = URL.createObjectURL(blob);
      liveUrlCache.set(videoId, objUrl);
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      await fetchAndCacheMedia(videoId, url);
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
