import React from 'react';

interface TopicReactionIconProps {
  topic: string;
  emoji: string;
  glowColor: string;
  sizeClass?: string;
}

export const TopicReactionIcon: React.FC<TopicReactionIconProps> = ({
  topic,
  emoji,
  glowColor,
  sizeClass = 'w-8 h-8 min-[380px]:w-9 min-[380px]:h-9',
}) => {
  if (topic === 'fashion') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={sizeClass}
        style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fashionScissorsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="55%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#FF9F0A" />
          </linearGradient>
        </defs>
        <circle cx="6.2" cy="6.2" r="3" stroke="url(#fashionScissorsGrad)" strokeWidth="2.1" fill="rgba(236,72,153,0.18)" />
        <circle cx="6.2" cy="17.8" r="3" stroke="url(#fashionScissorsGrad)" strokeWidth="2.1" fill="rgba(255,159,10,0.18)" />
        <path d="M20.2 4.2L8.3 15.6" stroke="url(#fashionScissorsGrad)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14.6 14.5L20.2 19.8" stroke="url(#fashionScissorsGrad)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M8.3 8.4L12.1 12" stroke="url(#fashionScissorsGrad)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12.2" cy="12" r="1.1" fill="#FFFFFF" />
      </svg>
    );
  }

  if (topic === 'tech') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={sizeClass}
        style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="techAiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B2FE" />
            <stop offset="55%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="12" height="12" rx="3.2" fill="url(#techAiGrad)" fillOpacity="0.22" stroke="url(#techAiGrad)" strokeWidth="2" />
        <path
          d="M12 8.2L13.1 10.9L15.8 12L13.1 13.1L12 15.8L10.9 13.1L8.2 12L10.9 10.9L12 8.2Z"
          fill="#FFFFFF"
        />
        <path d="M9 2.8V5.5M15 2.8V5.5M9 18.5V21.2M15 18.5V21.2M2.8 9H5.5M2.8 15H5.5M18.5 9H21.2M18.5 15H21.2" stroke="url(#techAiGrad)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (topic === 'food') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={sizeClass}
        style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="foodCutleryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9F0A" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
        </defs>
        {/* Fork */}
        <path d="M6.5 3.5V9.5C6.5 11.2 7.8 12.2 9 12.2C10.2 12.2 11.5 11.2 11.5 9.5V3.5" stroke="url(#foodCutleryGrad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 3.5V20.5" stroke="url(#foodCutleryGrad)" strokeWidth="2.1" strokeLinecap="round" />
        {/* Spoon */}
        <ellipse cx="16.5" cy="7.2" rx="2.7" ry="3.7" fill="url(#foodCutleryGrad)" fillOpacity="0.25" stroke="url(#foodCutleryGrad)" strokeWidth="2" />
        <path d="M16.5 11V20.5" stroke="url(#foodCutleryGrad)" strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    );
  }

  if (topic === 'education') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={sizeClass}
        style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="eduGradCap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="60%" stopColor="#00B2FE" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>
        </defs>
        <path
          d="M12 4L2.5 9L12 14L21.5 9L12 4Z"
          fill="url(#eduGradCap)"
          fillOpacity="0.3"
          stroke="url(#eduGradCap)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 11.5V16.2C6.5 17.8 9 19.2 12 19.2C15 19.2 17.5 17.8 17.5 16.2V11.5"
          stroke="url(#eduGradCap)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M20.5 10V16.5" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20.5" cy="17.5" r="1.2" fill="#FACC15" />
      </svg>
    );
  }

  return (
    <span
      className="text-2xl min-[380px]:text-[28px] leading-none select-none"
      style={{ filter: `drop-shadow(0 0 14px ${glowColor})` }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
};
