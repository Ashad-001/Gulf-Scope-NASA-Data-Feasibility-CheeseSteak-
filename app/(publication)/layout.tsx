import type { ReactNode } from 'react';
import './publication.css';

export default function PublicationLayout({ children }: { children: ReactNode }) {
  return <div className="publication">{children}</div>;
}
