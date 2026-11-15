export function JournalContents({ items }: { items: [string, string][] }) {
  return <nav className="journal-index" aria-label="On this page">
    <p className="publication-label">On this page</p>
    <ol>{items.map(([id,label],i) => <li key={id}><a href={'#' + id}>
      <span className="mission-meta" aria-hidden="true">{String(i + 1).padStart(2,'0')}</span><strong>{label}</strong>
    </a></li>)}</ol>
  </nav>;
}
