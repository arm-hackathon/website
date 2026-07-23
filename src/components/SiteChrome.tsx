import { Activity, Database, GitBranch, House, LockKeyhole, LogIn, Moon, Monitor, SlidersHorizontal, Sun, UserRoundCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EditorAccess } from '../lib/auth';
import { navigationItems, type NavigationId } from '../lib/navigation';
import './SiteChrome.css';

type ThemeMode = 'light' | 'dark' | 'system';

const icons = {
  connections: GitBranch,
  live: Activity,
  scenarios: GitBranch,
  telemetry: Database,
  benchmarks: SlidersHorizontal,
};

function getThemeLabel(mode: ThemeMode): string {
  return mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';
}

export type SyncState = 'local' | 'syncing' | 'synced';

export default function SiteChrome({ activePage, syncState, editorAccess }: { activePage?: NavigationId; syncState?: SyncState; editorAccess?: EditorAccess }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('icarus-theme-mode');
    if (saved === 'light' || saved === 'dark' || saved === 'system') setThemeMode(saved);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    const theme = themeMode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : themeMode;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('icarus-theme-mode', themeMode);
  }, [themeMode, themeReady]);

  return (
    <>
      <header className="site-topbar">
        <div className="site-topbar__identity">
          <button type="button" className="chrome-menu-button" aria-label="Open navigation" title="Open navigation" onClick={() => setSidebarOpen((open) => !open)}><span /><span /><span /></button>
          <a href="/" className="brand-lockup" aria-label="ICARUS home">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span className="brand-text"><strong className="brand-name">ICARUS</strong><small>&nbsp;- Distributed habitat systems</small></span>
          </a>
        </div>
        <div className="site-topbar__tools">
          {syncState && <span className={`site-topbar__sync site-topbar__sync--${syncState}`}><span className="status-dot" />{syncState === 'syncing' ? 'Synchronising' : syncState === 'local' ? 'Local draft only' : 'Synchronised'}</span>}
          <div className="theme-picker" aria-label="Theme picker">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
              const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
              return <button key={mode} type="button" className={`icon-button ${themeMode === mode ? 'is-active' : ''}`} aria-label={`${getThemeLabel(mode)} theme`} title={`${getThemeLabel(mode)} theme`} onClick={() => setThemeMode(mode)}><Icon size={17} /></button>;
            })}
          </div>
          {editorAccess && (editorAccess.canEdit
            ? <span className="topbar-editor-access topbar-editor-access--authorized" title={`Editing as ${editorAccess.email}`}><UserRoundCheck size={15} /><span>Editor</span></span>
            : <a className="topbar-editor-access" href={editorAccess.signInUrl ?? '/api/auth/signin?callbackUrl=%2Fconnections'} title="Sign in with GitHub or Google to edit"><LockKeyhole size={15} /><span>Sign in</span><LogIn size={14} /></a>)}
          <button type="button" className="help-button" onClick={() => setGuideOpen(true)}><span className="help-mark">?</span><span>Guide</span></button>
        </div>
      </header>

      {sidebarOpen && (
        <>
          <button className="chrome-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />
          <aside className="chrome-sidebar" aria-label="Project navigation">
            <div className="chrome-sidebar__header"><span className="eyebrow">ICARUS / navigation</span><button type="button" className="icon-button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>×</button></div>
            <nav className="chrome-nav">
              <a href="/" className={!activePage ? 'is-active' : ''} onClick={() => setSidebarOpen(false)}><House size={17} /><span><strong>Overview</strong><small>Project brief</small></span><span /></a>
              {navigationItems.map((item) => {
                const Icon = icons[item.id];
                return item.available ? <a key={item.id} href={item.href} className={activePage === item.id ? 'is-active' : ''} onClick={() => setSidebarOpen(false)}><Icon size={17} /><span><strong>{item.label}</strong><small>{item.detail}</small></span><span /></a> : <span key={item.id} className="is-locked"><Icon size={17} /><span><strong>{item.label}</strong><small>Locked / to be developed</small></span><LockKeyhole size={14} /></span>;
              })}
            </nav>
          </aside>
        </>
      )}

      {guideOpen && (
        <>
          <button className="chrome-scrim" type="button" aria-label="Close guide" onClick={() => setGuideOpen(false)} />
          <aside className="chrome-guide" aria-label="Project guide">
            <div className="chrome-guide__header"><span className="eyebrow">ICARUS / guide</span><button type="button" className="icon-button" aria-label="Close guide" onClick={() => setGuideOpen(false)}>×</button></div>
            <div className="chrome-guide__body">
              <h3>What is ICARUS?</h3>
              <p>ICARUS is a simulation interface for a distributed habitat ventilation system, built for the Arm Create Physical AI challenge.</p>
              <h3>How does it work?</h3>
              <p>The <strong>Connections</strong> view lets you define rooms, processing areas, and the actuators between them.</p>
              <h3>What comes next?</h3>
              <p>Future layers will show the live simulation, fault scenarios, telemetry streams, and Arm performance benchmarks.</p>
              <h3>Who is building it?</h3>
              <p>Alex Kurkar, Ben, and MS-Mesh.</p>
              <h3>Learn more</h3>
              <ul>
                <li><a href="https://github.com/akurkar07/arm-hackathon" target="_blank" rel="noreferrer">Team repository</a></li>
                <li><a href="https://arm-ai-optimization-challenge.devpost.com/" target="_blank" rel="noreferrer">Arm Create challenge</a></li>
                <li><a href="https://learn.arm.com/" target="_blank" rel="noreferrer">Arm learning paths</a></li>
              </ul>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
