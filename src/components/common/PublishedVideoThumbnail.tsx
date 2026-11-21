import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface PublishedVideoThumbnailProps {
  video: {
    videoUrl?: string;
    thumbnailUrl?: string;
    title?: string;
  };
  className?: string;
  alt?: string;
}

export const PublishedVideoThumbnail: React.FC<PublishedVideoThumbnailProps> = ({
  video,
  className = 'w-full h-full object-cover',
  alt = 'Video cover',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const rawThumb = video.thumbnailUrl || '';
  const isAvatarOrStock =
    !rawThumb ||
    rawThumb.includes('default-avatar') ||
    rawThumb.includes('/default-avatar') ||
    rawThumb.includes('avatar') ||
    rawThumb.includes('dicebear') ||
    rawThumb.includes('unsplash.com/photo-1534528741775');

  // If a genuine, custom or extracted video thumbnail exists and hasn't failed to load
  if (rawThumb && !isAvatarOrStock && !imgFailed) {
    return (
      <img
        src={rawThumb}
        alt={alt || video.title || 'Video Thumbnail'}
        className={className}
        onError={() => setImgFailed(true)}
        loading="lazy"
      />
    );
  }

  // Fallback directly to the published video's actual frame!
  if (video.videoUrl) {
    return (
      <video
        src={`${video.videoUrl}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        className={`${className} pointer-events-none select-none bg-neutral-950`}
      />
    );
  }

  // Sleek cinematic tile fallback (never show an avatar as video thumbnail)
  return (
    <div className={`${className} bg-neutral-900 flex flex-col items-center justify-center text-neutral-500`}>
      <Film className="w-5 h-5 text-amber-500/60 mb-0.5" />
      <span className="text-[8px] font-bold tracking-wider uppercase text-neutral-400">Video</span>
    </div>
  );
};
