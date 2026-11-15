import type { ReactNode } from 'react';
import Image from 'next/image';

export function OrbitaHero({ scene, chapter, title, description, note, className = '', heading = 'h1', titleId }: {
  scene: 'earth' | 'gulf' | 'bahrain' | 'horizon'; chapter: string; title: ReactNode;
  description: string; note?: ReactNode; className?: string; heading?: 'h1' | 'h2'; titleId?: string;
}) {
  const Heading = heading;
  return <header className={`orbita-hero orbita-${scene} ${className}`}>
    <div className="orbita-art" aria-hidden="true"><Image src={`/orbita/${scene}.png`} fill sizes="(max-width: 650px) 850px, 100vw" alt="" /></div>
    <div className="orbita-cross" aria-hidden="true"><img src={scene === 'horizon' || scene === 'earth' ? '/orbita/endpoint.svg' : '/orbita/cross-chapter.svg'} alt="" /></div>
    <div className="orbita-hero-content">
      <p className="orbita-label">{chapter}</p><Heading id={titleId}>{title}</Heading><p className="orbita-description">{description}</p>
    </div>
    {note && <p className="orbita-note">{note}</p>}
  </header>;
}
