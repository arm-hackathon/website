import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  Radio,
  ScanLine,
  ShieldCheck,
  TimerReset,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { NavigationId } from '../lib/navigation';
import SiteChrome from './SiteChrome';
import './LayerWorkspace.css';

type LayerId = Exclude<NavigationId, 'connections'>;

type Metric = {
  value: string;
  label: string;
  detail: string;
  tone?: 'accent' | 'signal' | 'warning';
};

type LayerDefinition = {
  id: LayerId;
  eyebrow: string;
  title: string;
  lead: string;
  icon: LucideIcon;
  status: string;
  metrics: readonly Metric[];
};

const definitions: Record<LayerId, LayerDefinition> = {
  live: {
    id: 'live',
    eyebrow: 'Control authority / read-only evidence',
    title: 'The loop is visible. Authority stays deterministic.',
    lead: 'A lifecycle view of the Habitat Management Computer checkpoint: observe operational state, reduce health, accept advisory proposals, arbitrate, and commit one validated plant step.',
    icon: Activity,
    status: 'Development checkpoint',
    metrics: [
      { value: '7', label: 'Lifecycle stages', detail: 'Reset through committed observation', tone: 'accent' },
      { value: '0', label: 'Direct adviser actuations', detail: 'External proposals remain advisory', tone: 'signal' },
      { value: '867', label: 'Locked tests passing', detail: 'CPython 3.11 evidence at corrected head' },
      { value: '1', label: 'Final authority owner', detail: 'Deterministic HMC arbitration' },
    ],
  },
  scenarios: {
    id: 'scenarios',
    eyebrow: 'Counterfactual experiment library',
    title: 'Faults are replayable, paired, and split before evaluation.',
    lead: 'Inspect the scenario families used to challenge the detector and bounded governor. Each fault run is paired with a healthy counterfactual and tied to deterministic scenario identity.',
    icon: GitBranch,
    status: 'Deterministic fixtures',
    metrics: [
      { value: '4', label: 'Classification labels', detail: 'Nominal plus three fault classes', tone: 'accent' },
      { value: '360', label: 'Training families', detail: 'Development split' },
      { value: '120', label: 'Validation families', detail: 'Candidate selection split' },
      { value: '180', label: 'Final families', detail: 'Separately generated evaluation split', tone: 'signal' },
    ],
  },
  telemetry: {
    id: 'telemetry',
    eyebrow: 'Observable boundary / model_input_v1',
    title: 'Operational signals enter. Hidden truth stays outside.',
    lead: 'The telemetry contract separates commanded, achieved, effective, measured, and evaluator-only state. Model input is a topology-bound, ordered float32 vector built from permitted observations.',
    icon: Database,
    status: 'Contract-bound',
    metrics: [
      { value: '24', label: 'Features per tick', detail: 'Ordered float32 model input', tone: 'accent' },
      { value: '10', label: 'Ticks per window', detail: 'Temporal candidate context' },
      { value: '2', label: 'Sensor heads', detail: 'Primary and secondary telemetry' },
      { value: '0', label: 'Hidden-truth fields', detail: 'Permitted in operational input', tone: 'signal' },
    ],
  },
  benchmarks: {
    id: 'benchmarks',
    eyebrow: 'Native Arm64 / controlled before-and-after evidence',
    title: 'Half the model memory. 1.73× faster. Prediction parity preserved.',
    lead: 'The deadline-era optimization converts the same forecast workload from FP64 to FP32 and measures both artifacts on a native Arm Neoverse-N2 runner. The evidence receipt binds hardware, model hashes, workload, latency, size, and quality.',
    icon: BarChart3,
    status: 'Native Arm64 evidence',
    metrics: [
      { value: '1.73×', label: 'Median speed-up', detail: '738.349 → 426.358 µs', tone: 'signal' },
      { value: '50%', label: 'Array memory reduction', detail: '28.76 MB → 14.38 MB' },
      { value: '47.1%', label: 'Artifact size reduction', detail: '2.13 MB → 1.12 MB', tone: 'accent' },
      { value: '4.88e-6', label: 'Maximum normalized drift', detail: 'Passed 1e-4 parity gate' },
    ],
  },
};

const lifecycle = [
  ['Reset', 'Establish run and authority identities'],
  ['Observe', 'Issue operational measurement'],
  ['Verify', 'Bind snapshot and provenance'],
  ['Propose', 'Receive advisory command'],
  ['Arbitrate', 'Apply safety and reserve policy'],
  ['Step', 'Validate before transactional commit'],
  ['Observe', 'Issue the committed result'],
] as const;

const scenarioFamilies = [
  {
    id: 'nominal',
    name: 'Nominal',
    kind: 'Healthy reference',
    summary: 'Matched operating profiles establish the no-fault counterfactual and false-alarm denominator.',
    signal: 'No injected fault',
    onset: 'None',
  },
  {
    id: 'degradation',
    name: 'Fan degradation',
    kind: 'Gradual physical fault',
    summary: 'Primary-loop effectiveness declines over a bounded interval while command and measured delivery remain distinct.',
    signal: 'Persistent airflow residual',
    onset: 'Observable by replay',
  },
  {
    id: 'blocked',
    name: 'Blocked path',
    kind: 'Sudden network fault',
    summary: 'A local path loses effectiveness, challenging isolation without exposing the injected schedule to the detector.',
    signal: 'Residual jump and isolation',
    onset: 'Observable by replay',
  },
  {
    id: 'frozen',
    name: 'Frozen sensor',
    kind: 'Measurement fault',
    summary: 'A reported channel holds while latent state continues evolving, testing disagreement and persistence logic.',
    signal: 'Range collapse and disagreement',
    onset: 'Observable by replay',
  },
] as const;

const telemetryGroups = [
  { name: 'Environmental', fields: ['CO₂ proxy', 'Temperature', 'Pressure', 'O₂ fraction', 'Relative humidity'] },
  { name: 'Actuator feedback', fields: ['Fan speed', 'Branch airflow', 'Damper position', 'Delivery rates', 'DC bus current'] },
  { name: 'Derived operational', fields: ['Head disagreement', 'Tracking residual', 'Resource gauges', 'Health state', 'Active alarms'] },
] as const;

function MetricGrid({ metrics }: { metrics: readonly Metric[] }) {
  return (
    <section className="layer-metrics" aria-label="Key evidence">
      {metrics.map((metric) => (
        <article className={`layer-metric${metric.tone ? ` layer-metric--${metric.tone}` : ''}`} key={metric.label}>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
          <small>{metric.detail}</small>
        </article>
      ))}
    </section>
  );
}

function LiveContent() {
  return (
    <div className="layer-layout layer-layout--live">
      <section className="layer-panel layer-panel--primary">
        <header className="layer-panel__header"><div><span>Closed lifecycle</span><h2>One causal control cycle</h2></div><ShieldCheck size={22} /></header>
        <div className="lifecycle-track">
          {lifecycle.map(([name, detail], index) => (
            <div className="lifecycle-step" key={`${name}-${index}`}>
              <div className="lifecycle-step__index">{String(index + 1).padStart(2, '0')}</div>
              <div><strong>{name}</strong><small>{detail}</small></div>
              {index < lifecycle.length - 1 && <ArrowRight size={15} aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>
      <aside className="layer-panel layer-panel--aside">
        <header className="layer-panel__header"><div><span>Authority boundary</span><h2>Fail closed</h2></div><CircleDot size={20} /></header>
        <div className="authority-stack">
          <div><Radio size={18} /><span><strong>Operational observations</strong><small>Only permitted measured state enters health reduction.</small></span></div>
          <div><ScanLine size={18} /><span><strong>Advisory proposal</strong><small>A model or external adviser cannot mutate the plant.</small></span></div>
          <div><ShieldCheck size={18} /><span><strong>HMC arbitration</strong><small>Safety policy owns the final command and step capability.</small></span></div>
          <div><CheckCircle2 size={18} /><span><strong>Transactional commit</strong><small>Invalid transitions produce terminal evidence without partial state.</small></span></div>
        </div>
        <p className="layer-callout">This is a research-software checkpoint, not a live spacecraft, certified controller, or hardware-in-the-loop system.</p>
      </aside>
    </div>
  );
}

function ScenariosContent() {
  const [selected, setSelected] = useState<(typeof scenarioFamilies)[number]['id']>('degradation');
  const active = scenarioFamilies.find((scenario) => scenario.id === selected) ?? scenarioFamilies[0];
  return (
    <div className="layer-layout layer-layout--scenarios">
      <section className="scenario-list" aria-label="Scenario families">
        {scenarioFamilies.map((scenario) => (
          <button type="button" className={`scenario-row${selected === scenario.id ? ' is-active' : ''}`} onClick={() => setSelected(scenario.id)} key={scenario.id}>
            <span className="scenario-row__marker" />
            <span><strong>{scenario.name}</strong><small>{scenario.kind}</small></span>
            <ArrowRight size={16} />
          </button>
        ))}
      </section>
      <section className="layer-panel scenario-detail" aria-live="polite">
        <header className="layer-panel__header"><div><span>Selected family</span><h2>{active.name}</h2></div><GitBranch size={21} /></header>
        <p>{active.summary}</p>
        <dl className="detail-ledger">
          <div><dt>Detection cue</dt><dd>{active.signal}</dd></div>
          <div><dt>Fault onset</dt><dd>{active.onset}</dd></div>
          <div><dt>Pairing</dt><dd>Healthy counterfactual</dd></div>
          <div><dt>Identity</dt><dd>SHA-256 bound</dd></div>
        </dl>
        <div className="timeline-visual" aria-label="Scenario timeline">
          <span>Warm-up</span><i /><span>Measured window</span><i className={active.id === 'nominal' ? 'is-nominal' : 'is-fault'} /><span>{active.id === 'nominal' ? 'Healthy' : 'Observable fault'}</span>
        </div>
      </section>
    </div>
  );
}

function TelemetryContent() {
  return (
    <div className="layer-layout layer-layout--telemetry">
      <section className="layer-panel telemetry-contract">
        <header className="layer-panel__header"><div><span>Projection pipeline</span><h2>From plant to model input</h2></div><Database size={21} /></header>
        <div className="pipeline">
          {['Physical state', 'Operational measurement', 'Topology projection', 'float32[24] tick', '10-tick window'].map((item, index) => (
            <div className="pipeline__stage" key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong>{index < 4 && <ArrowRight size={15} />}</div>
          ))}
        </div>
        <div className="telemetry-groups">
          {telemetryGroups.map((group) => <article key={group.name}><h3>{group.name}</h3>{group.fields.map((field) => <span key={field}>{field}</span>)}</article>)}
        </div>
      </section>
      <aside className="layer-panel boundary-panel">
        <header className="layer-panel__header"><div><span>Leakage barrier</span><h2>Evaluator only</h2></div><AlertTriangle size={20} /></header>
        <ul>
          <li>Injected fault schedule</li>
          <li>Latent plant truth</li>
          <li>Counterfactual family label</li>
          <li>Future observations</li>
        </ul>
        <p>The selector and topology hashes reject reordered features, incompatible networks, and metadata drift before inference.</p>
        <code>model_input_v1 · float32[24]</code>
      </aside>
    </div>
  );
}

function BenchmarksContent() {
  return (
    <div className="layer-layout layer-layout--benchmarks">
      <section className="layer-panel comparison-panel">
        <header className="layer-panel__header"><div><span>Submitted optimization output</span><h2>Same workload, reduced precision</h2></div><BarChart3 size={21} /></header>
        <div className="benchmark-table" role="table" aria-label="FP64 and FP32 native Arm64 comparison">
          <div className="benchmark-row benchmark-row--head" role="row"><span>Artifact</span><span>File size</span><span>Median</span><span>p95</span></div>
          <div className="benchmark-row" role="row"><strong>FP64 baseline</strong><span>2,126,337 B</span><span>738.349 µs</span><span>797.245 µs</span></div>
          <div className="benchmark-row is-preferred" role="row"><strong>FP32 optimized</strong><span>1,124,273 B</span><span>426.358 µs</span><span>445.057 µs</span></div>
        </div>
        <div className="evidence-verdict"><CheckCircle2 size={19} /><div><strong>Prediction parity passed</strong><small>Maximum normalized drift <code>4.879×10⁻⁶</code> against a predeclared <code>1×10⁻⁴</code> acceptance threshold.</small></div></div>
      </section>
      <aside className="layer-panel arm-gap-panel">
        <header className="layer-panel__header"><div><span>Target and proof boundary</span><h2>What this result means</h2></div><Cpu size={21} /></header>
        <div className="gap-list">
          <div><Gauge size={18} /><span><strong>Native Arm Neoverse-N2</strong><small>aarch64 verified; no emulation</small></span></div>
          <div><TimerReset size={18} /><span><strong>Controlled batch-one timing</strong><small>200 measured iterations per artifact</small></span></div>
          <div><Cpu size={18} /><span><strong>Pure CPU / NumPy workload</strong><small>No GPU, NPU, NEON, or power claim</small></span></div>
        </div>
        <div className="parity-note"><span>Current trained MLP evidence</span><strong>192.7 µs median</strong><small>Later open-source development: full 8-step forecast, native Arm64, 1,000 repetitions. This is not the submitted FP64→FP32 comparison.</small></div>
      </aside>
    </div>
  );
}

function LayerContent({ id }: { id: LayerId }) {
  if (id === 'live') return <LiveContent />;
  if (id === 'scenarios') return <ScenariosContent />;
  if (id === 'telemetry') return <TelemetryContent />;
  return <BenchmarksContent />;
}

export default function LayerWorkspace({ pageId }: { pageId: LayerId }) {
  const page = definitions[pageId];
  const Icon = page.icon;
  return (
    <main className={`layer-page layer-page--${page.id}`}>
      <SiteChrome activePage={page.id} />
      <div className="layer-page__inner">
        <header className="layer-hero" data-reveal="1">
          <div className="layer-hero__copy">
            <p className="layer-eyebrow">{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p>{page.lead}</p>
          </div>
          <div className="layer-hero__identity"><span><Icon size={27} /></span><small>{page.status}</small><strong>AEOLUS / {page.id}</strong></div>
        </header>
        <MetricGrid metrics={page.metrics} />
        <div data-reveal="2"><LayerContent id={page.id} /></div>
      </div>
      <footer className="layer-footer"><span>AEOLUS / simulation evidence</span><span>Read-only interface</span><span>Arm Create 2026</span></footer>
    </main>
  );
}
