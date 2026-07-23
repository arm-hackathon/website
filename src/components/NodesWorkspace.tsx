'use client';

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type NodeProps,
} from '@xyflow/react';
import {
  ArrowLeftRight,
  ArrowRight,
  Activity,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  Download,
  FlaskConical,
  GitBranch,
  LockKeyhole,
  Layers3,
  Moon,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Sun,
  Tag,
  Trash2,
  Upload,
  Users,
  Wind,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import '@xyflow/react/dist/style.css';
import './NodesWorkspace.css';
import {
  createConnection,
  createNodeFromPreset,
  createStarterGraph,
  directionExists,
  fromGraphDocument,
  parseGraphDocument,
  presetDefinitions,
  presetIds,
  toGraphDocument,
  type Bias,
  type GraphEdgeData,
  type GraphNodeData,
  type IcarusEdge,
  type IcarusNode,
  type PresetId,
} from '../lib/graph';

type ThemeMode = 'light' | 'dark' | 'system';
type TabId = 'connections' | 'live' | 'scenarios' | 'telemetry' | 'benchmarks';
type ConnectionMode = 1 | 2;

const tabs: Array<{ id: TabId; label: string; detail: string; icon: typeof Layers3; available: boolean }> = [
  { id: 'connections', label: 'Connections', detail: 'Rooms & actuators', icon: GitBranch, available: true },
  { id: 'live', label: 'Live system', detail: 'Locked / to be developed', icon: Activity, available: false },
  { id: 'scenarios', label: 'Scenarios', detail: 'Locked / to be developed', icon: GitBranch, available: false },
  { id: 'telemetry', label: 'Telemetry', detail: 'Locked / to be developed', icon: Database, available: false },
  { id: 'benchmarks', label: 'Benchmarks', detail: 'Locked / to be developed', icon: SlidersHorizontal, available: false },
];

const nodeTypes = { icarus: IcarusNodeCard };

function IcarusNodeCard({ data, selected }: NodeProps<IcarusNode>) {
  const Icon = data.preset === 'crew_cabin' ? Users : data.preset === 'lab' ? FlaskConical : data.preset === 'processing_bay' ? Wind : Settings2;

  return (
    <div className={`icarus-node icarus-node--${data.tone} ${selected ? 'is-selected' : ''}`}>
      <Handle className="node-handle node-handle--target" type="target" position={Position.Left} />
      <div className="node-card__topline">
        <span className="node-card__icon"><Icon size={15} strokeWidth={1.8} /></span>
        <span className="node-card__preset">{presetDefinitions[data.preset].label}</span>
        <span className="node-card__index">{data.tags[0] ?? 'node'}</span>
      </div>
      <strong className="node-card__label">{data.label}</strong>
      <p className="node-card__note">{data.notes || presetDefinitions[data.preset].description}</p>
      <div className="node-card__footer">
        <span>{Object.keys(data.bias).length} bias fields</span>
        <span>{data.tags.length} tags</span>
      </div>
      <Handle className="node-handle node-handle--source" type="source" position={Position.Right} />
    </div>
  );
}

function formatKey(key: string): string {
  return key.replaceAll('_', ' ');
}

function formatBiasValue(value: string | number | boolean): string {
  return String(value);
}

function parseBiasValue(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return value;
}

function themeLabel(mode: ThemeMode): string {
  return mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';
}

export default function NodesWorkspace() {
  const starter = useMemo(() => createStarterGraph(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<IcarusNode>(starter.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<IcarusEdge>(starter.edges);
  const [activeTab, setActiveTab] = useState<TabId>('connections');
  const [panelOpen, setPanelOpen] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [themeReady, setThemeReady] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('Habitat circulation / draft 01');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode | null>(null);
  const [connectionSource, setConnectionSource] = useState('');
  const [connectionTarget, setConnectionTarget] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [notice, setNotice] = useState('Local draft saved');
  const [hydrated, setHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedSource = selectedEdge ? nodes.find((node) => node.id === selectedEdge.source) : null;
  const selectedTarget = selectedEdge ? nodes.find((node) => node.id === selectedEdge.target) : null;

  useEffect(() => {
    const raw = window.localStorage.getItem('icarus-graph-draft');
    if (raw) {
      try {
        const parsed = parseGraphDocument(JSON.parse(raw));
        const restored = fromGraphDocument(parsed);
        setNodes(restored.nodes);
        setEdges(restored.edges);
        setDocumentName(parsed.name);
        setNotice('Restored local draft');
      } catch {
        setNotice('Starter topology loaded');
      }
    }
    setHydrated(true);
  }, [setEdges, setNodes]);

  useEffect(() => {
    const saved = window.localStorage.getItem('icarus-theme-mode');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      setThemeMode(saved);
    }
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const document = toGraphDocument(documentName, nodes, edges);
    window.localStorage.setItem('icarus-graph-draft', JSON.stringify(document));
  }, [documentName, edges, hydrated, nodes]);

  useEffect(() => {
    if (!themeReady) return;
    const resolvedTheme = themeMode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : themeMode;
    document.documentElement.dataset.theme = resolvedTheme;
    window.localStorage.setItem('icarus-theme-mode', themeMode);
  }, [themeMode, themeReady]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice('Local draft saved'), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setPanelOpen(true);
  }, []);

  const selectEdge = useCallback((edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    setPanelOpen(true);
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    if (directionExists(edges, connection.source, connection.target)) return;
    setEdges((currentEdges) => [...currentEdges, createConnection(connection.source!, connection.target!)]);
    setNotice('New airflow direction added');
  }, [edges, setEdges]);

  function addNode(preset: PresetId) {
    const newNode = createNodeFromPreset(preset, nodes.length + 1, {
      x: 180 + (nodes.length % 2) * 240,
      y: 120 + (nodes.length % 4) * 120,
    });
    setNodes((currentNodes) => [...currentNodes, newNode]);
    selectNode(newNode.id);
    setNotice(`${presetDefinitions[preset].label} added`);
  }

  function updateNodeData(nodeId: string, patch: Partial<GraphNodeData>) {
    setNodes((currentNodes) => currentNodes.map((node) => (
      node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node
    )));
  }

  function updateEdgeData(edgeId: string, patch: Partial<GraphEdgeData>) {
    setEdges((currentEdges) => currentEdges.map((edge) => (
      edge.id === edgeId ? { ...edge, data: { ...edge.data, ...patch } } : edge
    )));
  }

  function updateBias(target: 'node' | 'edge', id: string, key: string, value: string) {
    if (target === 'node') {
      const node = nodes.find((item) => item.id === id);
      if (node) updateNodeData(id, { bias: { ...node.data.bias, [key]: parseBiasValue(value) } });
    } else {
      const edge = edges.find((item) => item.id === id);
      if (edge) updateEdgeData(id, { bias: { ...edge.data.bias, [key]: parseBiasValue(value) } });
    }
  }

  function addBiasField(target: 'node' | 'edge', id: string) {
    updateBias(target, id, `custom_field_${Date.now().toString().slice(-3)}`, '0');
  }

  function removeSelected() {
    if (selectedNode) {
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNode.id));
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNodeId(null);
      setNotice('Node removed from draft');
    }
    if (selectedEdge) {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdgeId(null);
      setNotice('Connection removed from draft');
    }
  }

  function resetTopology() {
    const next = createStarterGraph();
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDocumentName('Habitat circulation / draft 01');
    setNotice('Starter topology restored');
  }

  function openConnectionComposer(mode: ConnectionMode) {
    setConnectionMode(mode);
    setConnectionSource(nodes[0]?.id ?? '');
    setConnectionTarget(nodes[1]?.id ?? '');
    setConnectionError('');
  }

  function addConnectionsFromComposer() {
    if (!connectionSource || !connectionTarget || connectionSource === connectionTarget) {
      setConnectionError('Choose two different nodes.');
      return;
    }

    const pairs = connectionMode === 2
      ? [[connectionSource, connectionTarget], [connectionTarget, connectionSource]]
      : [[connectionSource, connectionTarget]];
    const nextEdges = [...edges];
    let added = 0;
    for (const [source, target] of pairs) {
      if (!directionExists(nextEdges, source, target)) {
        nextEdges.push(createConnection(source, target));
        added += 1;
      }
    }

    if (!added) {
      setConnectionError('Those directions already exist.');
      return;
    }

    setEdges(nextEdges);
    setConnectionMode(null);
    setNotice(`${added} airflow direction${added > 1 ? 's' : ''} added`);
  }

  function exportGraph() {
    const document = toGraphDocument(documentName, nodes, edges);
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${documentName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Topology JSON exported');
  }

  function importGraph(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseGraphDocument(JSON.parse(String(reader.result)));
        const restored = fromGraphDocument(parsed);
        setNodes(restored.nodes);
        setEdges(restored.edges);
        setDocumentName(parsed.name);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setNotice('Topology JSON imported');
      } catch {
        setNotice('Import failed: invalid topology JSON');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function setActiveTabFromPanel(tab: TabId) {
    const selectedTab = tabs.find((item) => item.id === tab);
    if (!selectedTab?.available) {
      setNotice(`${selectedTab?.label ?? 'This layer'} is locked for now`);
      return;
    }
    setActiveTab(tab);
    setPanelOpen(true);
  }

  return (
    <main className="app-shell">
      <header className="topbar" data-reveal="1">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p className="brand-name">ICARUS</p>
            <p className="brand-subtitle">Distributed habitat systems</p>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="sync-status"><span className="status-dot" /> Local draft</span>
          <div className="theme-picker" aria-label="Theme picker">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
              const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
              return (
                <button
                  key={mode}
                  className={`icon-button theme-button ${themeMode === mode ? 'is-active' : ''}`}
                  type="button"
                  aria-label={`${themeLabel(mode)} theme`}
                  title={`${themeLabel(mode)} theme`}
                  onClick={() => setThemeMode(mode)}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>
          <button className="help-button" type="button" title="Open help">
            <CircleHelp size={16} />
            <span>Guide</span>
          </button>
        </div>
      </header>

      <section className="landing-grid" data-reveal="2">
        <div className="landing-copy">
          <p className="eyebrow">Arm Create 2026 / Physical AI</p>
          <h1>See the system<br /><em>working.</em></h1>
          <p className="landing-intro">ICARUS is the simulation interface for a distributed habitat ventilation system. Use it to see rooms, actuators, paths, telemetry, fault scenarios, and safe virtual actions come together.</p>
          <div className="landing-facts">
            <div className="landing-fact"><span>Project</span><strong>ICARUS</strong><small>Habitat systems interface</small></div>
            <div className="landing-fact"><span>Track</span><strong>Physical AI</strong><small>Arm Create challenge</small></div>
            <div className="landing-fact"><span>Contributors</span><strong>Alex / Ben / MS-Mesh</strong><small>Submission in progress</small></div>
          </div>
        </div>
        <div className="landing-rail">
          <span className="rail-label">Interface layers / 01 live</span>
          <nav className="tab-rail" aria-label="Project layers">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.available && activeTab === tab.id;
              return (
                <button key={tab.id} className={`tab-card ${isActive ? 'is-active' : ''} ${!tab.available ? 'is-locked' : ''}`} type="button" disabled={!tab.available} aria-label={`${tab.label}${tab.available ? '' : ', locked'}`} onClick={() => setActiveTabFromPanel(tab.id)}>
                  <span className="tab-card__icon"><Icon size={17} /></span>
                  <span className="tab-card__copy"><strong>{tab.label}</strong><small>{tab.detail}</small></span>
                  {isActive ? <Check size={15} className="tab-card__check" /> : tab.available ? <ChevronRight size={15} className="tab-card__arrow" /> : <LockKeyhole size={14} className="tab-card__lock" />}
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      <section className="workspace-frame" data-reveal="3">
        <aside className={`side-panel ${panelOpen ? 'is-open' : 'is-closed'}`}>
          <div className="side-panel__header">
            <div>
              <span className="panel-kicker">Workspace</span>
              <strong>Layers</strong>
            </div>
            <button className="icon-button" type="button" aria-label="Close side panel" title="Close side panel" onClick={() => setPanelOpen(false)}>
              <PanelLeftClose size={17} />
            </button>
          </div>
          <div className="side-panel__tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" className={`side-tab ${activeTab === tab.id ? 'is-active' : ''} ${!tab.available ? 'is-locked' : ''}`} disabled={!tab.available} aria-label={`${tab.label}${tab.available ? '' : ', locked'}`} onClick={() => setActiveTabFromPanel(tab.id)}>
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {!tab.available && <LockKeyhole size={12} />}
                </button>
              );
            })}
          </div>
          <div className="side-panel__footer">
            <div className="system-note"><span className="status-dot" /><span><strong>Simulation link</strong><small>Not connected yet</small></span></div>
            <p>The editor saves locally until the shared topology backend is agreed.</p>
          </div>
        </aside>

        {!panelOpen && (
          <button className="panel-reopen" type="button" aria-label="Open side panel" title="Open side panel" onClick={() => setPanelOpen(true)}>
            <PanelLeftOpen size={17} />
          </button>
        )}

        <div className="workspace-content">
          {activeTab === 'connections' ? (
            <>
              <div className="workspace-toolbar">
                <div className="workspace-title">
                  <span className="workspace-title__icon"><GitBranch size={17} /></span>
                  <div>
                    <span className="panel-kicker">Simulation interface</span>
                    <h2>Connections</h2>
                  </div>
                </div>
                <div className="workspace-actions">
                  <div className="toolbar-search"><Search size={15} /><input aria-label="Search rooms and actuators" placeholder="Search rooms & actuators" /></div>
                  <button className="secondary-button" type="button" onClick={() => openConnectionComposer(1)}><ArrowRight size={15} /> Add actuator</button>
                  <button className="secondary-button" type="button" onClick={() => openConnectionComposer(2)}><ArrowLeftRight size={15} /> Add pair</button>
                  <button className="icon-button" type="button" aria-label="Reset starter topology" title="Reset starter topology" onClick={resetTopology}><RotateCcw size={16} /></button>
                  <button className="icon-button" type="button" aria-label="Export topology" title="Export topology JSON" onClick={exportGraph}><Download size={16} /></button>
                  <button className="icon-button" type="button" aria-label="Import topology" title="Import topology JSON" onClick={() => fileInputRef.current?.click()}><Upload size={16} /></button>
                  <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importGraph} />
                </div>
              </div>

              {connectionMode && (
                <div className="connection-composer">
                  <div className="connection-composer__heading"><span className="composer-icon"><ArrowLeftRight size={16} /></span><div><strong>{connectionMode === 2 ? 'Add a return actuator pair' : 'Add an actuator path'}</strong><small>Connect two rooms in one or both directions.</small></div></div>
                  <label><span>From</span><select value={connectionSource} onChange={(event) => setConnectionSource(event.target.value)}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label>
                  <ArrowRight size={15} className="composer-arrow" />
                  <label><span>To</span><select value={connectionTarget} onChange={(event) => setConnectionTarget(event.target.value)}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label>
                  {connectionError && <span className="composer-error">{connectionError}</span>}
                  <button className="primary-button" type="button" onClick={addConnectionsFromComposer}><Plus size={15} /> Add actuator{connectionMode === 2 ? 's' : ''}</button>
                  <button className="icon-button" type="button" aria-label="Close connection composer" title="Close" onClick={() => setConnectionMode(null)}><X size={16} /></button>
                </div>
              )}

              <div className="workspace-body">
                <div className="canvas-column">
                  <div className="canvas-meta"><span><span className="status-dot status-dot--accent" /> {nodes.length} rooms / {edges.length} actuators</span><span className="mono">drag to arrange</span></div>
                  <div className="flow-canvas">
                    <ReactFlow<IcarusNode, IcarusEdge>
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      onNodeClick={(_, node) => selectNode(node.id)}
                      onEdgeClick={(_, edge) => selectEdge(edge.id)}
                      onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
                      fitView
                      fitViewOptions={{ padding: 0.24, minZoom: 0.55, maxZoom: 1.2 }}
                      minZoom={0.35}
                      maxZoom={1.6}
                      proOptions={{ hideAttribution: true }}
                      defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#d87b43' } }}
                    >
                      <Background color="var(--grid)" gap={28} size={1} />
                      <Controls showInteractive={false} />
                      <MiniMap className="mini-map" nodeColor={(node) => node.data?.tone === 'amber' ? '#d87b43' : node.data?.tone === 'blue' ? '#6f9bc2' : node.data?.tone === 'green' ? '#61ad8f' : '#8b9290'} maskColor="rgba(20, 24, 25, 0.72)" />
                    </ReactFlow>
                    <div className="canvas-key"><span><i className="key-line" /> actuator direction</span><span><i className="key-dot" /> editable room</span></div>
                  </div>
                </div>
                <Inspector
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  sourceNode={selectedSource ?? null}
                  targetNode={selectedTarget ?? null}
                  onUpdateNode={updateNodeData}
                  onUpdateEdge={updateEdgeData}
                  onUpdateBias={updateBias}
                  onAddBiasField={addBiasField}
                  onDelete={removeSelected}
                  onAddNode={addNode}
                />
              </div>
            </>
          ) : (
            <LockedView activeTab={activeTab} onReturn={() => setActiveTab('connections')} />
          )}
        </div>
      </section>

      <footer className="app-footer"><span>ICARUS / simulation interface</span><span><Save size={13} /> {notice}</span><span className="mono">schema v1.0</span></footer>
    </main>
  );
}

function Inspector({
  selectedNode,
  selectedEdge,
  sourceNode,
  targetNode,
  onUpdateNode,
  onUpdateEdge,
  onUpdateBias,
  onAddBiasField,
  onDelete,
  onAddNode,
}: {
  selectedNode: IcarusNode | null;
  selectedEdge: IcarusEdge | null;
  sourceNode: IcarusNode | null;
  targetNode: IcarusNode | null;
  onUpdateNode: (id: string, patch: Partial<GraphNodeData>) => void;
  onUpdateEdge: (id: string, patch: Partial<GraphEdgeData>) => void;
  onUpdateBias: (target: 'node' | 'edge', id: string, key: string, value: string) => void;
  onAddBiasField: (target: 'node' | 'edge', id: string) => void;
  onDelete: () => void;
  onAddNode: (preset: PresetId) => void;
}) {
  if (selectedNode) {
    return (
      <div className="inspector-panel">
        <div className="inspector-heading"><div><span className="panel-kicker">Selected room / area</span><h3>{selectedNode.data.label}</h3></div><button className="icon-button" type="button" title="Delete room" aria-label="Delete room" onClick={onDelete}><Trash2 size={16} /></button></div>
        <label className="field"><span>Name</span><input value={selectedNode.data.label} onChange={(event) => onUpdateNode(selectedNode.id, { label: event.target.value })} /></label>
        <label className="field"><span>Preset</span><select value={selectedNode.data.preset} onChange={(event) => onUpdateNode(selectedNode.id, { preset: event.target.value as PresetId })}>{presetIds.map((preset) => <option key={preset} value={preset}>{presetDefinitions[preset].label}</option>)}</select></label>
        <label className="field"><span>Notes</span><textarea value={selectedNode.data.notes} placeholder="What happens here?" onChange={(event) => onUpdateNode(selectedNode.id, { notes: event.target.value })} /></label>
        <label className="field"><span>Tags</span><div className="input-with-icon"><Tag size={14} /><input value={selectedNode.data.tags.join(', ')} onChange={(event) => onUpdateNode(selectedNode.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></div></label>
        <BiasEditor target="node" id={selectedNode.id} bias={selectedNode.data.bias} onUpdateBias={onUpdateBias} onAddBiasField={onAddBiasField} />
      </div>
    );
  }

  if (selectedEdge && sourceNode && targetNode) {
    return (
      <div className="inspector-panel">
        <div className="inspector-heading"><div><span className="panel-kicker">Selected actuator</span><h3>{sourceNode.data.label} → {targetNode.data.label}</h3></div><button className="icon-button" type="button" title="Delete actuator" aria-label="Delete actuator" onClick={onDelete}><Trash2 size={16} /></button></div>
        <div className="route-summary"><span>{sourceNode.data.label}</span><ArrowRight size={14} /><span>{targetNode.data.label}</span></div>
        <label className="field"><span>Connection label</span><input value={selectedEdge.data?.label ?? 'Airflow actuator'} onChange={(event) => onUpdateEdge(selectedEdge.id, { label: event.target.value })} /></label>
        <label className="field"><span>Notes</span><textarea value={selectedEdge.data?.notes ?? ''} placeholder="What does this path control?" onChange={(event) => onUpdateEdge(selectedEdge.id, { notes: event.target.value })} /></label>
        <label className="field"><span>Tags</span><div className="input-with-icon"><Tag size={14} /><input value={selectedEdge.data?.tags.join(', ') ?? ''} onChange={(event) => onUpdateEdge(selectedEdge.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></div></label>
        <BiasEditor target="edge" id={selectedEdge.id} bias={selectedEdge.data?.bias ?? {}} onUpdateBias={onUpdateBias} onAddBiasField={onAddBiasField} />
      </div>
    );
  }

  return (
    <div className="inspector-panel inspector-panel--empty">
      <div className="empty-inspector-icon"><Settings2 size={19} /></div>
      <h3>Shape the system</h3>
      <p>Select any room or actuator to edit its notes, tags, and bias fields. New rooms start from a preset, then become their own editable instance.</p>
      <div className="add-node-list">
        <span className="panel-kicker">Add a node</span>
        <div className="preset-buttons">
          {presetIds.map((preset) => <button key={preset} type="button" className="preset-button" onClick={() => onAddNode(preset)}><Plus size={14} /><span><strong>{presetDefinitions[preset].label}</strong><small>{presetDefinitions[preset].description}</small></span></button>)}
        </div>
      </div>
    </div>
  );
}

function BiasEditor({ target, id, bias, onUpdateBias, onAddBiasField }: { target: 'node' | 'edge'; id: string; bias: Bias; onUpdateBias: (target: 'node' | 'edge', id: string, key: string, value: string) => void; onAddBiasField: (target: 'node' | 'edge', id: string) => void }) {
  return (
    <div className="bias-editor">
      <div className="bias-heading"><span><SlidersHorizontal size={14} /> Bias fields</span><button type="button" className="text-button" onClick={() => onAddBiasField(target, id)}><Plus size={13} /> Add field</button></div>
      {Object.entries(bias).map(([key, value]) => <label className="bias-field" key={key}><span>{formatKey(key)}</span><input value={formatBiasValue(value)} onChange={(event) => onUpdateBias(target, id, key, event.target.value)} /></label>)}
    </div>
  );
}

function LockedView({ activeTab, onReturn }: { activeTab: TabId; onReturn: () => void }) {
  const tab = tabs.find((item) => item.id === activeTab)!;
  return (
    <div className="coming-soon-view">
      <div className="coming-soon-view__icon"><LockKeyhole size={24} /></div>
      <span className="panel-kicker">Locked layer</span>
      <h2>{tab.label} is to be developed.</h2>
      <p>This interface layer will show the running simulation after the Connections view is linked to the ICARUS runtime.</p>
      <button type="button" className="primary-button" onClick={onReturn}><ArrowRight size={15} /> Return to Connections</button>
    </div>
  );
}
