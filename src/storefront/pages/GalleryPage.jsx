import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getGallery } from '../api/catalogApi';
import SiteFooter from '../components/SiteFooter';

export default function GalleryPage({ onNavigate }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      const data = await getGallery();
      setImages(data);
      setLoading(false);
    }
    loadGallery();
  }, []);

  if (loading) {
    return <main className="content-page gallery-page"><header className="content-page-heading"><span>THE GIFTING FACTORY BY FLOWER GIRL</span><h1>Gallery</h1></header><div>Loading...</div></main>;
  }

  return <main className="content-page gallery-page"><header className="content-page-heading"><span>THE GIFTING FACTORY BY FLOWER GIRL</span><h1>Gallery</h1></header><div className="gallery-grid">{images.map((image, index) => <figure key={`${image.src}-${index}`}><img src={image.src} alt={image.label} /><figcaption>{image.label}</figcaption></figure>)}</div><a className="instagram-action" href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer">SEE MORE ON INSTAGRAM <ArrowRight size={16} /></a><SiteFooter onNavigate={onNavigate} /></main>;
}
