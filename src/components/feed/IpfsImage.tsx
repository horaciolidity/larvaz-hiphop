'use client';

import React, { useEffect, useState } from 'react';
import { getIpfsFallbackUrl, isIpfsReference } from '@/lib/media-utils';

interface IpfsImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  /** Fuerza el fallback entre gateways aunque la URL no parezca de IPFS. */
  ipfsHint?: boolean;
  /** Cuántos gateways alternativos probar antes de rendirse. */
  maxFallbacks?: number;
}

/**
 * Imagen con reintento automático en varios gateways de IPFS.
 * Se usa en el muro, la galería y las publicaciones compartidas.
 */
export const IpfsImage: React.FC<IpfsImageProps> = ({
  src,
  ipfsHint = false,
  maxFallbacks = 2,
  alt,
  onError,
  ...rest
}) => {
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [src]);

  const canFallback =
    attempt < maxFallbacks && (ipfsHint || isIpfsReference(src));
  const resolvedSrc = attempt > 0 ? getIpfsFallbackUrl(src, attempt) : src;

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      onError={(event) => {
        if (canFallback) {
          setAttempt((current) => current + 1);
          return;
        }
        onError?.(event);
      }}
    />
  );
};
