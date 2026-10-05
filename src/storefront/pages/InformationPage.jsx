import { useEffect, useState } from 'react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { getSiteSettings } from '../api/siteFeatures';
import { supabase } from '../../config/supabase';
import SiteFooter from '../components/SiteFooter';

const getDefaultDescription = (type, storeAddress) => {
  switch (type) {
    case 'sameday':
      return 'Delivered on the day you order, when stock and our delivery schedule allow.';
    case 'scheduled':
      return 'Choose the date you want your gift delivered. We deliver on the date you pick.';
    case 'surprise':
      return 'Delivered as a surprise to your recipient. Add their details and any instructions when you order.';
    case 'collection':
      return storeAddress
        ? `Collect your order from our shop. Address: ${storeAddress}`
        : 'Collect your order from our shop.';
    default:
      return '';
  }
};

export default function InformationPage({ type, onNavigate }) {
  const delivery = type === 'delivery';
  const [content, setContent] = useState(() => readAdminData().content);
  const [siteContent, setSiteContent] = useState('');
  const [supportPhone, setSupportPhone] = useState('+233 202 417 072');
  const [deliveryOptions, setDeliveryOptions] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => subscribeAdminData(data => setContent(data.content)), []);

  useEffect(() => {
    const loadAll = async () => {
      const settings = await getSiteSettings();
      setSettings(settings);

      if (delivery && settings?.delivery_page) {
        setSiteContent(settings.delivery_page);
      } else if (!delivery && settings?.policy_page) {
        setSiteContent(settings.policy_page);
      }
      if (settings?.support_phone) {
        setSupportPhone(settings.support_phone);
      }

      // Load delivery descriptions from site_content
      let descriptions = {};
      if (delivery) {
        try {
          const { data } = await supabase
            .from('site_content')
            .select('key, value')
            .in('key', ['delivery_sameday_info', 'delivery_scheduled_info', 'delivery_surprise_info', 'delivery_collection_info']);

          if (data) {
            data.forEach(row => {
              const type = row.key.replace('delivery_', '').replace('_info', '');
              descriptions[type] = row.value || '';
            });
          }
        } catch {
          // If load fails, use defaults
        }
      }

      // Load delivery options for delivery page
      if (delivery && settings?.delivery_selector_enabled) {
        const options = [];
        if (settings.delivery_sameday_enabled) {
          options.push({
            type: 'sameday',
            label: 'Same-day delivery',
            fee: settings.delivery_sameday_fee || 0,
            enabled: true,
            description: descriptions.sameday || getDefaultDescription('sameday', settings.store_address),
          });
        }
        if (settings.delivery_scheduled_enabled) {
          options.push({
            type: 'scheduled',
            label: 'Scheduled delivery',
            fee: settings.delivery_scheduled_fee || 0,
            enabled: true,
            description: descriptions.scheduled || getDefaultDescription('scheduled', settings.store_address),
          });
        }
        if (settings.delivery_surprise_enabled) {
          options.push({
            type: 'surprise',
            label: 'Surprise delivery',
            fee: settings.delivery_surprise_fee || 0,
            enabled: true,
            description: descriptions.surprise || getDefaultDescription('surprise', settings.store_address),
          });
        }
        if (settings.delivery_collection_enabled) {
          options.push({
            type: 'collection',
            label: 'Shop collection',
            fee: settings.delivery_collection_fee || 0,
            enabled: true,
            description: descriptions.collection || getDefaultDescription('collection', settings.store_address),
          });
        }
        setDeliveryOptions(options);
      } else {
        setDeliveryOptions(null);
      }
    };
    loadAll();
  }, [delivery]);

  const paragraphs = siteContent.split('\n\n').filter(p => p.trim());

  return (
    <main className="content-page information-page">
      <header className="content-page-heading">
        <span>{delivery ? 'DELIVERY & FAQ' : 'ORDER POLICY'}</span>
        <h1>{delivery ? <>Delivery,<br />clearly arranged.</> : <>Before we<br />begin.</>}</h1>
      </header>
      {siteContent ? (
        <section className="about-intro">
          {paragraphs.map((para, index) => <p key={index}>{para}</p>)}
        </section>
      ) : (delivery ? content.deliveryPolicy : content.orderPolicy) && (
        <aside className="published-policy">
          <span>{delivery ? 'CURRENT DELIVERY NOTE' : 'CURRENT ORDER POLICY'}</span>
          <p>{delivery ? content.deliveryPolicy : content.orderPolicy}</p>
        </aside>
      )}
      {!siteContent && !(delivery ? content.deliveryPolicy : content.orderPolicy) && (
        <p className="about-lead">This page is being updated. For assistance, call {supportPhone}.</p>
      )}
      {delivery && deliveryOptions && deliveryOptions.length > 0 && (
        <section className="about-intro" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Delivery options</h2>
          {deliveryOptions.map(opt => (
            <div key={opt.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.75rem 0', borderBottom: '1px solid rgba(17, 17, 17, 0.1)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{opt.label}</div>
                {opt.description && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', lineHeight: '1.4' }}>{opt.description}</div>
                )}
              </div>
              <div style={{ flex: '0 0 auto', marginLeft: '1rem', fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                {opt.fee > 0 ? `GHS ${opt.fee.toLocaleString()}` : 'Free'}
              </div>
            </div>
          ))}
        </section>
      )}
      {delivery ? (
        <section className="information-list">
          <article><span>01</span><h2>Where do you deliver?</h2><p>Delivery is available across Accra. Share the complete address and a reachable recipient number when ordering.</p></article>
          <article><span>02</span><h2>Can I request same-day delivery?</h2><p>Yes, when stock, preparation time and the destination allow it. The team confirms availability before payment.</p></article>
          <article><span>03</span><h2>Can I schedule a delivery?</h2><p>Yes. Choose a preferred date in the gift builder or booking form. A delivery window is confirmed with your order.</p></article>
          <article><span>04</span><h2>Can I collect my order?</h2><p>Collection can be arranged from ACP Estate Junction, Kwabenya, after the team confirms that your order is ready.</p></article>
        </section>
      ) : (
        <section className="information-list">
          <article><span>01</span><h2>Quotes and payment</h2><p>Prices marked "From" are starting estimates. The final total is confirmed after product availability, customization and delivery are agreed.</p></article>
          <article><span>02</span><h2>Custom orders</h2><p>Production begins after the design, wording, total and payment terms are confirmed. Check names and messages carefully before approval.</p></article>
          <article><span>03</span><h2>Changes and cancellations</h2><p>Personalized items cannot be changed after production starts. Contact the team promptly if an order detail needs attention.</p></article>
          <article><span>04</span><h2>Fresh and sourced goods</h2><p>Flowers and some items are sourced to order. Substitutions of equal quality may be made if the specified item is unavailable at the time of production.</p></article>
        </section>
      )}
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
