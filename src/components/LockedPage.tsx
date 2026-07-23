import { ArrowLeft, LockKeyhole } from 'lucide-react';
import SiteChrome from './SiteChrome';
import './LockedPage.css';

export default function LockedPage({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="locked-page">
      <SiteChrome activePage={title.toLowerCase().replaceAll(' ', '-') as never} />
      <section className="locked-page__content">
        <div className="locked-page__icon"><LockKeyhole size={24} /></div>
        <p className="eyebrow">Locked interface layer</p>
        <h1>{title}<br /><em>to be developed.</em></h1>
        <p>{detail}</p>
        <a className="primary-button" href="/connections"><ArrowLeft size={16} /> Return to Connections</a>
      </section>
    </main>
  );
}