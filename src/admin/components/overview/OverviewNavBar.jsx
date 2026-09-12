import { Search, Sparkles } from 'lucide-react';

export default function OverviewNavBar({ activeTab, onTabChange, onOpenSearch, pendingCount = 0 }) {
  const links = [
    { id: 'Today', label: 'Today’s Edit' },
    { id: 'This week', label: 'This Week' },
    { id: 'Activity', label: 'Store Log' },
  ];

  return (
    <nav className="ov-sui-navbar" aria-label="Overview tab navigation">
      <div className="ov-sui-nav-links">
        {links.map(link => (
          <button
            key={link.id}
            className={`ov-sui-nav-link ${activeTab === link.id ? 'is-active' : ''}`}
            onClick={() => onTabChange(link.id)}
          >
            {link.label}
            {link.id === 'Today' && pendingCount > 0 && (
              <span className="ov-sui-nav-count">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ov-sui-nav-actions">
        <button className="ov-sui-search-trigger" onClick={onOpenSearch}>
          <Search size={15} />
          <span>Search workspace...</span>
          <kbd className="ov-sui-kbd">⌘K</kbd>
        </button>
      </div>
    </nav>
  );
}
