import { ArrowUpRight, BookOpen, ExternalLink, GitBranch, LockKeyhole, UsersRound } from 'lucide-react';
import SiteChrome from './SiteChrome';
import './ProjectLanding.css';

const resources = [
  { label: 'Team repository', description: 'ICARUS implementation and simulator contract.', href: 'https://github.com/akurkar07/arm-hackathon', icon: GitBranch },
  { label: 'Team organisation', description: 'Shared home for the Arm hackathon project.', href: 'https://github.com/arm-hackathon', icon: UsersRound },
  { label: 'Arm Create challenge', description: 'Submission brief and Physical AI track.', href: 'https://arm-ai-optimization-challenge.devpost.com/', icon: ExternalLink },
  { label: 'Arm learning paths', description: 'Arm tools, edge deployment, and platform guidance.', href: 'https://learn.arm.com/', icon: BookOpen },
  { label: 'Initial project plan', description: 'The current scope, proof loop, and next implementation layers.', href: '/project-brief.md', icon: BookOpen },
];

export default function ProjectLanding() {
  return (
    <main className="landing-page">
      <SiteChrome />
      <section className="landing-hero" data-reveal="1">
        <div className="landing-hero__copy">
          <p className="eyebrow">Arm Create 2026 / Physical AI track</p>
          <h1>ICARUS<br /><em>simulation interface</em></h1>
          <p className="landing-hero__lede">A visible, testable control loop for a distributed habitat ventilation system: simulated rooms produce telemetry, a local model detects a fault, and a safety governor produces a bounded virtual action.</p>
        </div>
        <div className="landing-hero__signal" aria-label="ICARUS interface layers">
          <div className="signal-orbit orbit-1" />
          <div className="signal-orbit orbit-2" />
          <div className="signal-orbit orbit-3" />
          <div className="signal-orbit orbit-4" />
          <div className="signal-orbit orbit-5" />
          <div className="signal-core"><strong>ICARUS</strong><small>interface map</small></div>
          <a className="signal-node signal-node--connections is-active" href="/connections"><GitBranch size={15} /><span>Connections</span></a>
          <a className="signal-node signal-node--live" href="/live"><LockKeyhole size={15} /><span>Live system</span></a>
          <a className="signal-node signal-node--scenarios" href="/scenarios"><LockKeyhole size={15} /><span>Scenarios</span></a>
          <a className="signal-node signal-node--telemetry" href="/telemetry"><LockKeyhole size={15} /><span>Telemetry</span></a>
          <a className="signal-node signal-node--benchmarks" href="/benchmarks"><LockKeyhole size={15} /><span>Benchmarks</span></a>
        </div>
      </section>

      <section className="project-overview" id="project" data-reveal="2">
        <div className="section-heading"><p className="eyebrow">What we are building</p><h2>Not a dashboard about a simulation. The interface for the simulation itself.</h2></div>
        <div className="overview-copy"><p>ICARUS models a distributed habitat ventilation system. Rooms and processing areas are connected by directed actuators. The current Connections view lets the team define that topology before it is consumed by the Python plant model.</p><p>The planned interface will make the loop observable: a fan degrades, telemetry changes, local inference scores the fault, the safety governor limits a virtual response, and the resulting plant state is replayable.</p><div className="scope-line"><span>Current live layer</span><strong>Connections</strong><span className="scope-divider" /><span>Future layers</span><strong>Live system / Scenarios / Telemetry / Benchmarks</strong></div></div>
      </section>

      <section className="flow-strip" data-reveal="3">
        <div className="flow-step"><span>01</span><strong>Define rooms</strong><small>Cabins, labs, processing bays</small></div>
        <div className="flow-connector" />
        <div className="flow-step"><span>02</span><strong>Connect actuators</strong><small>One-way or paired directions</small></div>
        <div className="flow-connector" />
        <div className="flow-step"><span>03</span><strong>Run the plant</strong><small>Telemetry and fault scenarios</small></div>
        <div className="flow-connector" />
        <div className="flow-step"><span>04</span><strong>Show recovery</strong><small>Bounded virtual action</small></div>
      </section>

      <section className="resources-section" data-reveal="3">
        <div className="section-heading section-heading--compact"><p className="eyebrow">Project resources</p><h2>Follow the work where it is actually happening.</h2></div>
        <div className="resource-grid">
          {resources.map((resource) => { const Icon = resource.icon; return <a className="resource-link" key={resource.label} href={resource.href} target="_blank" rel="noreferrer"><span className="resource-link__icon"><Icon size={18} /></span><span><strong>{resource.label}</strong><small>{resource.description}</small></span><ArrowUpRight size={15} /></a>; })}
        </div>
      </section>

      <section className="project-notes" data-reveal="3">
        <div><p className="eyebrow">Team / scope</p><h2>Built by Alex, Ben, and MS-Mesh for the Arm Create challenge.</h2></div>
        <div className="notes-column"><p>Simulation only. No live plant, production telemetry, or real actuator command is involved. Abstract values in the current model are not spacecraft measurements or safety thresholds.</p><a href="https://github.com/akurkar07/arm-hackathon/blob/main/README.md" target="_blank" rel="noreferrer">Read the current repository README <ArrowUpRight size={14} /></a></div>
      </section>

      <footer className="landing-footer"><span>ICARUS / Arm Create 2026</span><span>Submission in progress</span><span>Physical AI track</span></footer>
    </main>
  );
}
