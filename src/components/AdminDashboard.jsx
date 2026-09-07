import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Menu, X } from 'lucide-react';
import '../admin/shell.css';

const PAGES = ['Overview', 'Orders', 'Requests', 'Products', 'Shop', 'Insights', 'Customers', 'Reviews', 'Delivery', 'Gallery', 'Careers', 'Content', 'Settings'];

export default function AdminDashboard({ onExit }) {
  const [page, setPage] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const navigation = useRef(null);
  const heading = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    navigation.current?.querySelector('button')?.focus();
    const closeOnDesktop = () => { if (window.innerWidth > 760) setMenuOpen(false); };
    window.addEventListener('resize', closeOnDesktop);
    return () => window.removeEventListener('resize', closeOnDesktop);
  }, [menuOpen]);

  const closeMenu = () => { setMenuOpen(false); menuButton.current?.focus(); };
  const selectPage = next => { setPage(next); setMenuOpen(false); heading.current?.focus(); };
  const handleMenuKey = event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
    if (event.key === 'Tab') {
      const buttons = [...navigation.current.querySelectorAll('button')].filter(button => button.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };

  return <div className="admin-shell">
    {menuOpen && <button className="admin-shell__scrim" aria-label="Close admin navigation" onClick={closeMenu} />}
    <aside ref={navigation} id="admin-navigation" className={`admin-shell__navigation${menuOpen ? ' is-open' : ''}`} onKeyDown={handleMenuKey} aria-label="Admin navigation">
      <div className="admin-shell__brand"><span>The Gifting Factory<small>Administration</small></span><button className="admin-shell__close" onClick={closeMenu} aria-label="Close navigation"><X size={20} /></button></div>
      <nav aria-label="Admin pages">{PAGES.map(name => <button key={name} aria-current={page === name ? 'page' : undefined} onClick={() => selectPage(name)}>{name}</button>)}</nav>
      <button className="admin-shell__store" onClick={onExit}><ArrowLeft size={16} /> Back to storefront</button>
    </aside>
    <div className="admin-shell__workspace" inert={menuOpen ? true : undefined}>
      <header className="admin-shell__header"><button ref={menuButton} className="admin-shell__menu" aria-label="Open admin navigation" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button><h1 ref={heading} tabIndex={-1}>{page}</h1></header>
      <main key={page} className="admin-shell__page" aria-label={`${page} workspace`} />
    </div>
  </div>;
}
