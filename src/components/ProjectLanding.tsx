import { Activity, ArrowUpRight, BookOpen, Cpu, Database, ExternalLink, GitBranch, SlidersHorizontal, UsersRound } from 'lucide-react';
import SiteChrome from './SiteChrome';
import './ProjectLanding.css';

const resources = [
  { label: 'Team repository', description: 'AEOLUS implementation and simulator contract.', href: 'https://github.com/arm-hackathon/arm-hackathon', icon: GitBranch },
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
          <h1>AEOLUS<br /><em>simulation interface</em></h1>
          <p className="landing-hero__lede">A safety-governed Physical AI simulation with a measured Arm optimization: the submitted FP32 forecast artifact uses 50% less model-array memory and runs 1.73× faster than FP64 on native Neoverse-N2, while preserving prediction parity.</p>
          <div className="landing-hero__actions">
            <a className="primary-button" href="/benchmarks"><Cpu size={17} />Inspect Arm evidence</a>
            <a className="quiet-link" href="https://github.com/arm-hackathon/arm-hackathon" target="_blank" rel="noreferrer">Run the source <ArrowUpRight size={15} /></a>
          </div>
        </div>
        <div className="landing-hero__signal" aria-label="AEOLUS interface layers">
          <div className="signal-orbit orbit-1" />
          <div className="signal-orbit orbit-2" />
          <div className="signal-orbit orbit-3" />
          <div className="signal-orbit orbit-4" />
          <div className="signal-orbit orbit-5" />
          <div className="signal-core"><strong>AEOLUS</strong><small>interface map</small></div>
          <a className="signal-node signal-node--connections" href="/connections"><GitBranch size={15} /><span>Connections</span></a>
          <a className="signal-node signal-node--live" href="/live"><Activity size={15} /><span>Live system</span></a>
          <a className="signal-node signal-node--scenarios" href="/scenarios"><GitBranch size={15} /><span>Scenarios</span></a>
          <a className="signal-node signal-node--telemetry" href="/telemetry"><Database size={15} /><span>Telemetry</span></a>
          <a className="signal-node signal-node--benchmarks" href="/benchmarks"><SlidersHorizontal size={15} /><span>Benchmarks</span></a>
        </div>
      </section>

      <section className="optimization-proof" aria-labelledby="optimization-title" data-reveal="2">
        <div className="optimization-proof__intro">
          <p className="eyebrow">Deadline-era optimization output</p>
          <h2 id="optimization-title">One workload. Native Arm64. Measured before and after.</h2>
          <p>FP64 and FP32 ran the same batch-one forecast on an Arm Neoverse-N2 runner. The reduced-precision artifact passed a predeclared prediction-parity gate. These are development benchmark results, not power, NPU, deployment, or qualification claims.</p>
        </div>
        <div className="optimization-proof__metrics">
          <article><strong>1.73×</strong><span>median speed-up</span><small>738.349 → 426.358 µs</small></article>
          <article><strong>50%</strong><span>less array memory</span><small>28,759,024 → 14,379,512 bytes</small></article>
          <article><strong>47.1%</strong><span>smaller artifact</span><small>2,126,337 → 1,124,273 bytes</small></article>
          <article><strong>4.88×10⁻⁶</strong><span>maximum normalized drift</span><small>passed the 1×10⁻⁴ parity gate</small></article>
        </div>
      </section>

      <section className="project-overview" id="project" data-reveal="3">
        <div className="section-heading"><p className="eyebrow">What we are building</p><h2>Not a dashboard about a simulation. The interface for the simulation itself.</h2></div>
        <div className="overview-copy"><p>AEOLUS models a distributed habitat ventilation system. Rooms and processing areas are connected by directed actuators. The Connections view lets the team define that topology before it is consumed by the Python plant model.</p><p>The current learned adviser forecasts future telemetry under each candidate action. A deterministic Habitat Management Computer reviews every proposal and remains the sole actuator authority. The evidence layers make forecasts, arbitration, plant response, and replay visible without exposing hidden simulator truth to the model.</p><div className="scope-line"><span>Editable layer</span><strong>Connections</strong><span className="scope-divider" /><span>Evidence layers</span><strong>Live system / Scenarios / Telemetry / Benchmarks</strong></div></div>
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
        <div className="notes-column"><p>Simulation only. No live plant, production telemetry, or real actuator command is involved. Abstract values in the current model are not spacecraft measurements or safety thresholds.</p><a href="https://github.com/arm-hackathon/arm-hackathon/blob/main/README.md" target="_blank" rel="noreferrer">Read the current repository README <ArrowUpRight size={14} /></a></div>
      </section>

      <footer className="landing-footer"><span>AEOLUS / Arm Create 2026</span><span>Open-source development</span><span>Physical AI track</span></footer>
    </main>
  );
}
