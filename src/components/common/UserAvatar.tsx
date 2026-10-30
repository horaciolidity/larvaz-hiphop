'use client';

import React, { useState } from 'react';
import { resolveIpfsUrl, getIpfsFallbackUrl } from '@/lib/media-utils';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const SIZE_MAP = {
  xs: {
    container: 'w-6 h-6 text-xs',
    img: 'w-6 h-6',
  },
  sm: {
    container: 'w-8 h-8 text-base',
    img: 'w-8 h-8',
  },
  md: {
    container: 'w-10 h-10 text-xl',
    img: 'w-10 h-10',
  },
  lg: {
    container: 'w-14 h-14 text-3xl',
    img: 'w-14 h-14',
  },
  xl: {
    container: 'w-20 h-20 text-4xl',
    img: 'w-20 h-20',
  },
  '2xl': {
    container: 'w-28 h-28 text-6xl',
    img: 'w-28 h-28',
  },
};

export function isEmojiAvatar(url?: string | null): boolean {
  return typeof url === 'string' && url.startsWith('emoji:');
}

export function parseEmojiAvatar(url: string): string {
  return url.replace('emoji:', '');
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name = 'Usuario',
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  React.useEffect(() => {
    setImgError(false);
    setRetryCount(0);
  }, [avatarUrl]);

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  // 1. Emoji / Sticker Avatar
  if (isEmojiAvatar(avatarUrl)) {
    const emoji = parseEmojiAvatar(avatarUrl!);
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-surface-elevated via-surface to-background border border-acid/50 shadow-inner flex items-center justify-center select-none flex-shrink-0 transition-transform ${sizeConfig.container} ${className}`}
        title={name}
        aria-label={name}
      >
        <span role="img" aria-label={name} className="leading-none transform hover:scale-110 transition-transform">
          {emoji}
        </span>
      </div>
    );
  }

  // 2. Custom Hip-Hop Sticker Avatar (/avatars/...)
  if (avatarUrl?.startsWith('/avatars/')) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover border border-acid/50 shadow-sm flex-shrink-0 bg-surface-elevated ${sizeConfig.img} ${className}`}
      />
    );
  }

  // 3. Resolve IPFS or real image URL
  const resolvedUrl = avatarUrl ? resolveIpfsUrl(avatarUrl) : '';

  const handleError = () => {
    if (retryCount < 2 && resolvedUrl) {
      // Try an alternate IPFS gateway
      setRetryCount((c) => c + 1);
    } else {
      setImgError(true);
    }
  };

  const effectiveUrl = imgError || !resolvedUrl
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    : retryCount > 0
    ? getIpfsFallbackUrl(resolvedUrl, retryCount)
    : resolvedUrl;

  return (
    <img
      src={effectiveUrl}
      alt={name}
      onError={handleError}
      className={`rounded-full object-cover border border-surface-elevated flex-shrink-0 ${sizeConfig.img} ${className}`}
    />
  );
};
