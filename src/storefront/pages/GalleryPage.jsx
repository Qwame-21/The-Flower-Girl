import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { readAdminData, subscribeAdminData, syncFromSupabase } from '../../data/adminStore';
import SiteFooter from '../components/SiteFooter';
import { GalleryGridSkeleton, useDelayedLoading } from '../components/Skeleton';

export default function GalleryPage({ onNavigate }) {
  const [images, setImages] = useState(() => readAdminData().gallery.filter(image => image.visible));
  const [syncing, setSyncing] = useState(() => !readAdminData().gallery?.length);
  const showSkeleton = useDelayedLoading(syncing && images.length === 0, { delay: 150, minDuration: 300 });
  
  useEffect(() => subscribeAdminData(data => {
    setImages(data.gallery.filter(image => image.visible));
    setSyncing(false);
  }), []);
  
  // Refetch when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      syncFromSupabase();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  
  return (
    <main className="content-page gallery-page">
      <header className="content-page-heading">
        <span>THE GIFTING FACTORY BY FLOWER GIRL</span>
        <h1>Gallery</h1>
      </header>
      {showSkeleton ? (
        <GalleryGridSkeleton count={6} />
      ) : (
        <div className="gallery-grid content-fade-in">
          {images.map((image, index) => (
            <figure key={`${image.src}-${index}`} className={image.blendBackground ? 'is-blended' : ''}>
              <img src={image.src} alt={image.label} />
              <figcaption>{image.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <a className="instagram-action" href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer">
        SEE MORE ON INSTAGRAM <ArrowRight size={16} />
      </a>
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
