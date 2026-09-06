import { Settings, X } from 'lucide-react';

export default function AdminRail({
  railExpanded,
  setRailExpanded,
  mobileOpen,
  setMobileOpen,
  activeNav,
  selectNav,
  navItems,
}) {
  return (
    <>
      <aside
        className={`admin-foundation__rail ${mobileOpen ? 'is-open' : ''} ${railExpanded ? 'is-expanded' : ''}`}
        aria-label="Admin navigation"
      >
        <button
          className="admin-foundation__brand"
          onClick={() => setRailExpanded(value => !value)}
          aria-label={`${railExpanded ? 'Collapse' : 'Expand'} navigation`}
          aria-expanded={railExpanded}
        >
          <img src="/gifting-factory-mark.svg" alt="" />
          <span>{railExpanded ? 'Collapse menu' : 'Expand menu'}</span>
        </button>
        <button
          className="admin-foundation__mobile-close"
          onClick={() => {
            setMobileOpen(false);
            setRailExpanded(false);
          }}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
        <nav>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={activeNav === label ? 'is-active' : ''}
              onClick={() => selectNav(label)}
              aria-label={label}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-foundation__rail-footer">
          <button
            className={activeNav === 'Settings' ? 'is-active' : ''}
            aria-label="Settings"
            onClick={() => selectNav('Settings')}
          >
            <Settings size={18} strokeWidth={1.7} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="admin-foundation__scrim"
          onClick={() => {
            setMobileOpen(false);
            setRailExpanded(false);
          }}
          aria-label="Close navigation"
        />
      )}
    </>
  );
}
