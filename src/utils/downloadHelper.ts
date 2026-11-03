/**
 * Helper to download video file directly to user's device (phone gallery / storage)
 */
export async function downloadVideoToDevice(
  videoUrl: string,
  title: string = 'valuvid_video',
  onProgress?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
  try {
    if (onProgress) onProgress('Preparing video download...');

    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'valuvid';
    const fileName = `${safeTitle}_${Date.now()}.mp4`;

    // Attempt 1: Fetch blob for direct client-side save
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const blob = await response.blob();
      
      // If Web Share API supports file sharing (native save to gallery on Android/iOS)
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'video/mp4' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title,
              text: `Saved from ValuVid: ${title}`
            });
            return { success: true, message: 'Video saved to device! 📥' };
          }
        } catch {
          // Native share rejected or cancelled, proceed with anchor download
        }
      }

      // Browser anchor download via object URL
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        try {
          window.URL.revokeObjectURL(objectUrl);
          document.body.removeChild(link);
        } catch {}
      }, 2000);

      return { success: true, message: 'Video downloaded to device! 📥' };
    } catch {
      // Fetch was blocked by CORS or network, fallback to direct anchor download
      const fallbackLink = document.createElement('a');
      fallbackLink.href = videoUrl;
      fallbackLink.download = fileName;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.style.display = 'none';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();

      setTimeout(() => {
        try {
          document.body.removeChild(fallbackLink);
        } catch {}
      }, 1000);

      return { success: true, message: 'Download initiated! Check notifications. 📥' };
    }
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error?.message || 'Could not download video. Please check connection.' };
  }
}
