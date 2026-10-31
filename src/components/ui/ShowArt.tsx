import { useState } from 'react';
import { SHOW_ART } from '../../data/showArt';
import { cn } from '../../lib/utils';

const base = import.meta.env.BASE_URL;
const srcSet = (id: string, type: 'avif' | 'webp') =>
  SHOW_ART[id].widths.map((w) => `${base}shows/${id}-${w}.${type} ${w}w`).join(', ');

/**
 * Artwork for the One Piece and Loki chapters, from the generated manifest
 * (scripts/show-art.py). Fills its positioned parent. Artwork that is missing
 * from the manifest — or a file that fails to load — becomes a painted
 * backdrop in the chapter's colours instead of a broken image, so the layout
 * never changes either way.
 */
export default function ShowArt({
  id,
  alt,
  sizes,
  fallback,
  focus = '50% 50%',
  eager = false,
  className,
}: {
  id: string;
  /** Empty for purely decorative artwork. */
  alt: string;
  sizes: string;
  /** CSS background painted when the artwork is unavailable. */
  fallback: string;
  /** CSS object-position, so narrow screens crop around the subject. */
  focus?: string;
  eager?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!SHOW_ART[id] || failed) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn('absolute inset-0', className)}
        style={{ background: fallback }}
      />
    );
  }
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(id, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(id, 'webp')} sizes={sizes} />
      <img
        src={`${base}shows/${id}-${SHOW_ART[id].widths[0]}.webp`}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        style={{ objectPosition: focus }}
      />
    </picture>
  );
}
