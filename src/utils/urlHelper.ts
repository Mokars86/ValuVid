import { Capacitor } from '@capacitor/core';

/**
 * Returns the reliable production / live public base URL for sharing links.
 * Prevents sharing 'localhost' when running on local dev or inside Capacitor Android WebView.
 */
export function getAppBaseUrl(): string {
  // 1. Check explicit environment configuration
  const envUrl = (import.meta.env.VITE_APP_URL || '').trim();
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. If running in a public web browser (e.g. Netlify, Vercel, or live domain)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const isLocal = 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.startsWith('capacitor:') || 
      origin.startsWith('file:') ||
      Capacitor.isNativePlatform();

    if (!isLocal && origin.startsWith('http')) {
      return origin.replace(/\/$/, '');
    }
  }

  // 3. Production live Netlify app fallback
  return 'https://valuvid.netlify.app';
}

export function buildVideoShareUrl(videoId: string, curatorUsername?: string): string {
  const base = getAppBaseUrl();
  const cleanId = encodeURIComponent(videoId);
  const cleanCurator = encodeURIComponent(curatorUsername || 'curator');
  return `${base}/?v=${cleanId}&ref=${cleanCurator}`;
}

export function buildProfileShareUrl(username: string): string {
  const base = getAppBaseUrl();
  const cleanUser = encodeURIComponent(username.replace(/^@/, ''));
  return `${base}/?user=${cleanUser}`;
}
