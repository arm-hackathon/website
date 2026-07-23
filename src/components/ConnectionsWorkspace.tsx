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
  type EdgeChange,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import { ArrowLeftRight, ArrowRight, ChevronDown, CloudUpload, Download, FlaskConical, GitBranch, History, PanelRight, PanelRightClose, Plus, RotateCcw, Search, Settings2, SlidersHorizontal, Tag, Trash2, TriangleAlert, Upload, Users, Wind, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import '@xyflow/react/dist/style.css';
import './NodesWorkspace.css';
import './ConnectionsWorkspace.css';
import SiteChrome, { type SyncState } from './SiteChrome';
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
  type GraphDocument,
  type GraphEdgeData,
  type GraphNodeData,
  type IcarusEdge,
  type IcarusNode,
  type PresetId,
} from '../lib/graph';

type ConnectionMode = 1 | 2;

const nodeTypes = { icarus: IcarusNodeCard };

function IcarusNodeCard({ data, selected }: NodeProps<IcarusNode>) {
  const Icon = data.preset === 'crew_cabin' ? Users : data.preset === 'lab' ? FlaskConical : data.preset === 'processing_bay' ? Wind : Settings2;
  return (
    <div className={`icarus-node icarus-node--${data.tone} ${selected ? 'is-selected' : ''}`}>
      <Handle className="node-handle node-handle--target" type="target" position={Position.Left} />
      <div className="node-card__topline"><span className="node-card__icon"><Icon size={16} /></span><span className="node-card__preset">{presetDefinitions[data.preset].label}</span><span className="node-card__index">{data.tags[0] ?? 'room'}</span></div>
      <strong className="node-card__label">{data.label}</strong>
      <p className="node-card__note">{data.notes || presetDefinitions[data.preset].description}</p>
      <div className="node-card__footer"><span>{Object.keys(data.bias).length} bias fields</span><span>{data.tags.length} tags</span></div>
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

function readLocalDrafts(): Record<string, GraphDocument> {
  try {
    const raw = window.localStorage.getItem('icarus-drafts');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalDraft(document: GraphDocument): void {
  const drafts = readLocalDrafts();
  drafts[document.name] = document;
  window.localStorage.setItem('icarus-drafts', JSON.stringify(drafts));
}

function deleteLocalDraft(name: string): void {
  const drafts = readLocalDrafts();
  delete drafts[name];
  window.localStorage.setItem('icarus-drafts', JSON.stringify(drafts));
}

function seedDefaultDraft(): void {
  const drafts = readLocalDrafts();
  if (Object.keys(drafts).length) return;
  const starter = createStarterGraph();
  const document = toGraphDocument('Habitat circulation / draft 01', starter.nodes, starter.edges);
  drafts[document.name] = document;
  window.localStorage.setItem('icarus-drafts', JSON.stringify(drafts));
}

export default function ConnectionsWorkspace() {
  const starter = useMemo(() => createStarterGraph(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<IcarusNode>(starter.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<IcarusEdge>(starter.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [activeDraftName, setActiveDraftName] = useState<string | null>(null);
  const [draftNames, setDraftNames] = useState<string[]>([]);
  const [draftError, setDraftError] = useState('');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode | null>(null);
  const [connectionSource, setConnectionSource] = useState('');
  const [connectionTarget, setConnectionTarget] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('Synchronised');
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [serverBackup, setServerBackup] = useState<GraphDocument | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [confirmSynchronise, setConfirmSynchronise] = useState(false);
  const [draftMenuOpen, setDraftMenuOpen] = useState(false);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialisingRef = useRef(true);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedSource = selectedEdge ? nodes.find((node) => node.id === selectedEdge.source) : null;
  const selectedTarget = selectedEdge ? nodes.find((node) => node.id === selectedEdge.target) : null;
  const visibleNodes = nodes.map((node) => ({ ...node, hidden: Boolean(searchQuery && !node.data.label.toLowerCase().includes(searchQuery.toLowerCase())) }));
  const hiddenNodeIds = new Set(visibleNodes.filter((node) => node.hidden).map((node) => node.id));
  const visibleEdges = edges.map((edge) => ({ ...edge, hidden: hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target) }));

  useEffect(() => {
    const raw = window.localStorage.getItem('icarus-graph-draft');
    if (raw) {
      try {
        const localDocument = parseGraphDocument(JSON.parse(raw));
        const restored = fromGraphDocument(localDocument);
        setNodes(restored.nodes);
        setEdges(restored.edges);
        setActiveDraftName(localDocument.name);
        setDocumentName('');
        setNotice('Restored local draft');
      } catch {
        setNotice('Starter topology loaded');
      }
    }
    setHydrated(true);
  }, [setEdges, setNodes]);

  useEffect(() => {
    if (!hydrated) return;
    const document = toGraphDocument(documentName, nodes, edges);
    window.localStorage.setItem('icarus-graph-draft', JSON.stringify(document));
  }, [documentName, edges, hydrated, nodes]);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => { initialisingRef.current = false; }, 0);
    return () => window.clearTimeout(timeout);
  }, [hydrated]);

  useEffect(() => {
    document.querySelector<SVGSVGElement>('.connections-page .mini-map .react-flow__minimap-svg')?.setAttribute('preserveAspectRatio', 'none');
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    async function loadSharedTopology() {
      // Ensure a default draft always exists in the picker.
      seedDefaultDraft();
      try {
        const response = await fetch('/api/topology', { cache: 'no-store' });
        const payload = await response.json();
        if (cancelled) return;
        if (payload.drafts) {
          setDraftNames(payload.drafts);
          const localName = window.localStorage.getItem('icarus-active-draft') ?? '';
          if (localName && payload.drafts.includes(localName)) await loadDraft(localName);
        }
        // Server not configured / not reachable: keep `synced` because we have
        // no dirty edits at this point. Real failure feedback is in the notice.
      } catch {
        // Connection error: same reasoning — pill only reflects local dirty state.
      }
      // Merge any locally saved draft names so the picker works without a
      // configured Blob store (local dev, or before first server sync).
      if (!cancelled) {
        const localNames = Object.keys(readLocalDrafts());
        if (localNames.length) setDraftNames((current) => Array.from(new Set([...current, ...localNames])).sort((left, right) => left.localeCompare(right)));
      }
    }
    loadSharedTopology();
    return () => { cancelled = true; };
  }, [hydrated, setEdges, setNodes]);

  async function loadDraft(name: string) {
    let document: GraphDocument | null = null;
    try {
      const response = await fetch(`/api/topology?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (response.ok && payload.document) document = payload.document as GraphDocument;
    } catch {
      // fall through to local fallback
    }
    if (!document) document = readLocalDrafts()[name] ?? null;
    if (!document) {
      setNotice('Draft could not be loaded');
      return;
    }
    const restored = fromGraphDocument(document);
    setNodes(restored.nodes);
    setEdges(restored.edges);
    setDocumentName(document.name);
    setActiveDraftName(document.name);
    setServerBackup(document);
    setSyncState('synced');
    setDraftError('');
    setNotice('Draft loaded');
    window.localStorage.setItem('icarus-active-draft', document.name);
  }

  async function deleteDraft(name: string) {
    deleteLocalDraft(name);
    try {
      await fetch(`/api/topology?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    } catch {
      // local delete already applied; server delete is best-effort
    }
    setDraftNames((current) => current.filter((draft) => draft !== name));
    setConfirmDeleteDraft(null);
    if (name === activeDraftName) {
      setActiveDraftName(null);
      window.localStorage.removeItem('icarus-active-draft');
    }
    setNotice('Draft deleted');
  }

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice('Local draft saved'), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const handleNodesChange = useCallback((changes: NodeChange<IcarusNode>[]) => {
    onNodesChange(changes);
    // Filter out React Flow's internal `dimensions` and pure `select` changes —
    // they fire on mount and on every click without indicating a real edit.
    if (!initialisingRef.current && changes.some((change) => change.type !== 'select' && change.type !== 'dimensions')) setSyncState('local');
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: EdgeChange<IcarusEdge>[]) => {
    onEdgesChange(changes);
    if (!initialisingRef.current && changes.some((change) => change.type !== 'select')) setSyncState('local');
  }, [onEdgesChange]);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setInspectorOpen(true);
  }, []);

  const selectEdge = useCallback((edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    setInspectorOpen(true);
  }, []);

  const toggleInspector = useCallback(() => {
    setInspectorOpen((open) => {
      if (open) {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
      return !open;
    });
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target || directionExists(edges, connection.source, connection.target)) return;
    setEdges((currentEdges) => [...currentEdges, createConnection(connection.source!, connection.target!)]);
    setSyncState('local');
    setNotice('New actuator added');
  }, [edges, setEdges]);

  function addNode(preset: PresetId) {
    const newNode = createNodeFromPreset(preset, nodes.length + 1, { x: 120 + (nodes.length % 3) * 250, y: 120 + (nodes.length % 3) * 160 });
    setNodes((currentNodes) => [...currentNodes, newNode]);
    selectNode(newNode.id);
    setSyncState('local');
    setNotice(`${presetDefinitions[preset].label} added`);
  }

  function updateNodeData(nodeId: string, patch: Partial<GraphNodeData>) {
    setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node));
    setSyncState('local');
  }

  function updateEdgeData(edgeId: string, patch: Partial<GraphEdgeData>) {
    setEdges((currentEdges) => currentEdges.map((edge) => edge.id === edgeId ? { ...edge, data: { ...edge.data, ...patch } } : edge));
    setSyncState('local');
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
      setSyncState('local');
      setNotice('Room removed from draft');
    } else if (selectedEdge) {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdgeId(null);
      setSyncState('local');
      setNotice('Actuator removed from draft');
    }
  }

  function resetAllChanges() {
    const next = createStarterGraph();
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDocumentName('');
    setActiveDraftName(null);
    setSyncState('local');
    setConfirmResetAll(false);
    setNotice('Reset to default topology');
  }

  function resetCurrentChanges() {
    if (!serverBackup) {
      setNotice('No server backup to restore yet');
      return;
    }
    const restored = fromGraphDocument(serverBackup);
    setNodes(restored.nodes);
    setEdges(restored.edges);
    setDocumentName(serverBackup.name);
    setActiveDraftName(serverBackup.name);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSyncState('synced');
    setNotice('Restored from server backup');
  }

  function openConnectionComposer(mode: ConnectionMode) {
    setConnectionMode(mode);
    setConnectionSource(nodes[0]?.id ?? '');
    setConnectionTarget(nodes[1]?.id ?? '');
    setConnectionError('');
  }

  function addConnectionsFromComposer() {
    if (!connectionSource || !connectionTarget || connectionSource === connectionTarget) {
      setConnectionError('Choose two different rooms.');
      return;
    }
    const pairs = connectionMode === 2 ? [[connectionSource, connectionTarget], [connectionTarget, connectionSource]] : [[connectionSource, connectionTarget]];
    const nextEdges = [...edges];
    let added = 0;
    for (const [source, target] of pairs) {
      if (!directionExists(nextEdges, source, target)) {
        nextEdges.push(createConnection(source, target));
        added += 1;
      }
    }
    if (!added) {
      setConnectionError('Those actuator directions already exist.');
      return;
    }
    setEdges(nextEdges);
    setConnectionMode(null);
    setSyncState('local');
    setNotice(`${added} actuator${added > 1 ? 's' : ''} added`);
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
        const document = parseGraphDocument(JSON.parse(String(reader.result)));
        const restored = fromGraphDocument(document);
        setNodes(restored.nodes);
        setEdges(restored.edges);
        setDocumentName(document.name);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setSyncState('local');
        setNotice('Topology JSON imported');
      } catch {
        setNotice('Import failed: invalid topology JSON');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async function synchronise() {
    setSyncState('syncing');
    const document = toGraphDocument(documentName.trim() || activeDraftName || '', nodes, edges);
    // Always persist locally so the draft list works without a configured Blob
    // store; the server write is the source of truth once deployed.
    writeLocalDraft(document);
    let serverError = '';
    try {
      const response = await fetch('/api/topology', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(document) });
      const payload = await response.json();
      if (!response.ok && response.status !== 503) {
        setSyncState('local');
        setNotice(payload.message ?? 'Synchronisation failed');
        return;
      }
      if (response.status === 503) serverError = 'Saved locally (server storage not configured)';
    } catch {
      serverError = 'Saved locally (server unreachable)';
    }
    setServerBackup(document);
    setActiveDraftName(document.name);
    setDraftNames((current) => current.includes(document.name) ? current : [...current, document.name].sort((left, right) => left.localeCompare(right)));
    window.localStorage.setItem('icarus-active-draft', document.name);
    setSyncState('synced');
    setNotice(serverError || 'Shared topology synchronised');
  }

  function validateDraft(): string {
    const name = documentName.trim() || activeDraftName || '';
    if (name.length < 3) return 'Give this draft a name of at least 3 characters.';
    if (/^(draft|draft name|new draft|untitled)\s*\d*$/i.test(name)) return 'Use a descriptive draft name instead of a placeholder.';
    if (draftNames.some((draft) => draft.toLocaleLowerCase() === name.toLocaleLowerCase() && draft !== activeDraftName)) return 'That draft name is already in use.';
    if (!nodes.length) return 'Add at least one room before synchronising.';
    return '';
  }

  function requestSynchronise() {
    const error = validateDraft();
    setDraftError(error);
    if (!error) setConfirmSynchronise(true);
  }

  return (
    <main className="app-shell connections-page">
      <SiteChrome activePage="connections" syncState={syncState} />
      <div className="workspace-content">
        <div className="workspace-toolbar">
          <div className="workspace-title"><span className="workspace-title__icon"><GitBranch size={20} /></span><div><span className="panel-kicker">Simulation interface</span><h1>Connections</h1></div></div>
          <div className="workspace-actions">
            <label className={`document-control${draftError ? ' has-error' : ''}`}><Tag size={15} className="document-control__icon" /><input aria-label="Draft name" placeholder="Draft name" title={documentName || 'Draft name'} value={documentName} onChange={(event) => { setDocumentName(event.target.value); setDraftError(''); setSyncState('local'); }} /><button type="button" className="draft-toggle" aria-label="Show saved drafts" aria-expanded={draftMenuOpen} title="Show saved drafts" onClick={() => setDraftMenuOpen((open) => !open)}><ChevronDown size={15} /></button>{draftMenuOpen && (<><button type="button" className="draft-menu__scrim" aria-label="Close draft list" onClick={() => { setDraftMenuOpen(false); setConfirmDeleteDraft(null); }} /><div className="draft-menu" role="listbox" aria-label="Saved drafts"><span className="draft-menu__label">Saved drafts</span>{draftNames.length ? draftNames.map((draft) => confirmDeleteDraft === draft ? (<div key={draft} className="draft-menu__confirm"><span>Delete “{draft}”?</span><div className="draft-menu__confirm-actions"><button type="button" className="draft-menu__confirm-yes" onClick={() => void deleteDraft(draft)}>Delete</button><button type="button" className="draft-menu__confirm-no" onClick={() => setConfirmDeleteDraft(null)}>Cancel</button></div></div>) : (<div key={draft} className={`draft-menu__row${draft === (documentName || activeDraftName) ? ' is-active' : ''}`}><button type="button" role="option" aria-selected={draft === (documentName || activeDraftName)} className="draft-menu__item" onClick={() => { void loadDraft(draft); setDraftMenuOpen(false); }}>{draft}</button><button type="button" className="draft-menu__delete" aria-label={`Delete ${draft}`} title="Delete draft" onClick={() => setConfirmDeleteDraft(draft)}><Trash2 size={14} /></button></div>)) : <span className="draft-menu__empty">No saved drafts yet</span>}</div></>)}</label>
            <div className="toolbar-search"><Search size={16} /><input aria-label="Search rooms and actuators" placeholder="Search rooms & actuators" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div>
            <div className="toolbar-group">
              <button className="secondary-button" type="button" onClick={() => openConnectionComposer(1)}><ArrowRight size={16} /> Add actuator</button>
              <button className="secondary-button" type="button" onClick={() => openConnectionComposer(2)}><ArrowLeftRight size={16} /> Add pair</button>
            </div>
            <div className="toolbar-group">
              <button className="secondary-button" type="button" title="Discard your unsaved local changes and reload the last synchronised server version" onClick={resetCurrentChanges}><History size={16} /> Reset current changes</button>
              <button className="secondary-button secondary-button--danger" type="button" title="Discard every room and actuator and return to the default topology" onClick={() => setConfirmResetAll(true)}><TriangleAlert size={16} /> Reset all changes</button>
              <button className="primary-button" type="button" title="Synchronise the server with the current draft" disabled={syncState === 'syncing'} onClick={requestSynchronise}><CloudUpload size={16} /> Synchronise</button>
            </div>
            <div className="toolbar-group">
              <button className="icon-button" type="button" aria-label={inspectorOpen ? 'Hide inspector panel' : 'Show inspector panel'} title={inspectorOpen ? 'Hide inspector panel' : 'Show inspector panel'} aria-pressed={inspectorOpen} onClick={toggleInspector}>{inspectorOpen ? <PanelRightClose size={17} /> : <PanelRight size={17} />}</button>
              <button className="icon-button" type="button" aria-label="Export topology" title="Export topology JSON" onClick={exportGraph}><Download size={17} /></button>
              <button className="icon-button" type="button" aria-label="Import topology" title="Import topology JSON" onClick={() => fileInputRef.current?.click()}><Upload size={17} /></button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importGraph} />
            </div>
          </div>
        </div>

        {confirmResetAll && (
          <div className="confirm-bar">
            <span className="confirm-bar__icon"><TriangleAlert size={17} /></span>
            <div className="confirm-bar__copy"><strong>Reset all changes?</strong><small>This discards every room and actuator and returns to the default topology. It does not touch the server until you synchronise.</small></div>
            <button className="secondary-button secondary-button--danger" type="button" onClick={resetAllChanges}><RotateCcw size={15} /> Yes, reset all changes</button>
            <button className="secondary-button" type="button" onClick={() => setConfirmResetAll(false)}>Cancel</button>
          </div>
        )}

        {confirmSynchronise && (
          <div className="confirm-bar confirm-bar--sync">
            <span className="confirm-bar__icon"><CloudUpload size={17} /></span>
            <div className="confirm-bar__copy"><strong>Synchronise this draft?</strong><small>This writes “{documentName.trim() || activeDraftName}” to the shared Vercel draft store.</small></div>
            <button className="primary-button" type="button" onClick={() => { setConfirmSynchronise(false); void synchronise(); }}><CloudUpload size={15} /> Yes, synchronise</button>
            <button className="secondary-button" type="button" onClick={() => setConfirmSynchronise(false)}>Cancel</button>
          </div>
        )}

        {connectionMode && <div className="connection-composer"><div className="connection-composer__heading"><span className="composer-icon"><ArrowLeftRight size={18} /></span><div><strong>{connectionMode === 2 ? 'Add a return actuator pair' : 'Add an actuator path'}</strong><small>Connect two rooms in one or both directions.</small></div></div><label><span>From</span><select value={connectionSource} onChange={(event) => setConnectionSource(event.target.value)}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label><ArrowRight size={17} className="composer-arrow" /><label><span>To</span><select value={connectionTarget} onChange={(event) => setConnectionTarget(event.target.value)}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label>{connectionError && <span className="composer-error">{connectionError}</span>}<button className="primary-button" type="button" onClick={addConnectionsFromComposer}><Plus size={17} /> Add actuator{connectionMode === 2 ? 's' : ''}</button><button className="icon-button" type="button" aria-label="Close connection composer" title="Close" onClick={() => setConnectionMode(null)}><X size={18} /></button></div>}

          <div className={`workspace-body${inspectorOpen ? '' : ' inspector-hidden'}`}><div className="canvas-column"><div className="flow-canvas"><ReactFlow<IcarusNode, IcarusEdge> nodes={visibleNodes} edges={visibleEdges} nodeTypes={nodeTypes} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onConnect={onConnect} onNodeClick={(_, node) => selectNode(node.id)} onEdgeClick={(_, edge) => selectEdge(edge.id)} onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }} fitView fitViewOptions={{ padding: 0.26, minZoom: 0.52, maxZoom: 1.2 }} minZoom={0.35} maxZoom={1.6} proOptions={{ hideAttribution: true }} defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#d87b43' } }}><Background color="var(--grid)" gap={28} size={1} /><Controls showInteractive={false} /><MiniMap className="mini-map" pannable zoomable nodeColor={(node) => node.data?.tone === 'amber' ? '#d87b43' : node.data?.tone === 'blue' ? '#6f9bc2' : node.data?.tone === 'green' ? '#61ad8f' : '#8b9290'} maskColor="rgba(120, 126, 122, 0.28)" maskStrokeColor="transparent" /></ReactFlow><div className="canvas-key"><span><i className="key-line" /> actuator direction</span><span><i className="key-dot" /> editable room</span></div></div></div>{inspectorOpen && <Inspector selectedNode={selectedNode} selectedEdge={selectedEdge} sourceNode={selectedSource ?? null} targetNode={selectedTarget ?? null} onUpdateNode={updateNodeData} onUpdateEdge={updateEdgeData} onUpdateBias={updateBias} onAddBiasField={addBiasField} onDelete={removeSelected} onAddNode={addNode} />}</div>
      </div>
      <footer className="app-footer"><span><span className="status-dot status-dot--accent" /> {nodes.length} rooms / {edges.length} actuators</span><span className="mono">{draftError || 'Drag rooms to arrange · connect handles to add an actuator'}</span><span className="mono">schema v1.0</span></footer>
    </main>
  );
}

function Inspector({ selectedNode, selectedEdge, sourceNode, targetNode, onUpdateNode, onUpdateEdge, onUpdateBias, onAddBiasField, onDelete, onAddNode }: { selectedNode: IcarusNode | null; selectedEdge: IcarusEdge | null; sourceNode: IcarusNode | null; targetNode: IcarusNode | null; onUpdateNode: (id: string, patch: Partial<GraphNodeData>) => void; onUpdateEdge: (id: string, patch: Partial<GraphEdgeData>) => void; onUpdateBias: (target: 'node' | 'edge', id: string, key: string, value: string) => void; onAddBiasField: (target: 'node' | 'edge', id: string) => void; onDelete: () => void; onAddNode: (preset: PresetId) => void }) {
  if (selectedNode) return <div className="inspector-panel"><div className="inspector-heading"><div><span className="panel-kicker">Selected room / area</span><h2>{selectedNode.data.label}</h2></div><button className="icon-button" type="button" title="Delete room" aria-label="Delete room" onClick={onDelete}><Trash2 size={18} /></button></div><label className="field"><span>Name</span><input value={selectedNode.data.label} onChange={(event) => onUpdateNode(selectedNode.id, { label: event.target.value })} /></label><label className="field"><span>Preset</span><select value={selectedNode.data.preset} onChange={(event) => onUpdateNode(selectedNode.id, { preset: event.target.value as PresetId })}>{presetIds.map((preset) => <option key={preset} value={preset}>{presetDefinitions[preset].label}</option>)}</select></label><label className="field"><span>Notes</span><textarea value={selectedNode.data.notes} placeholder="What happens here?" onChange={(event) => onUpdateNode(selectedNode.id, { notes: event.target.value })} /></label><label className="field"><span>Tags</span><div className="input-with-icon"><Tag size={16} /><input value={selectedNode.data.tags.join(', ')} onChange={(event) => onUpdateNode(selectedNode.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></div></label><BiasEditor target="node" id={selectedNode.id} bias={selectedNode.data.bias} onUpdateBias={onUpdateBias} onAddBiasField={onAddBiasField} /></div>;
  if (selectedEdge && sourceNode && targetNode) return <div className="inspector-panel"><div className="inspector-heading"><div><span className="panel-kicker">Selected actuator</span><h2>{sourceNode.data.label} → {targetNode.data.label}</h2></div><button className="icon-button" type="button" title="Delete actuator" aria-label="Delete actuator" onClick={onDelete}><Trash2 size={18} /></button></div><div className="route-summary"><span>{sourceNode.data.label}</span><ArrowRight size={16} /><span>{targetNode.data.label}</span></div><label className="field"><span>Actuator label</span><input value={selectedEdge.data?.label ?? 'Airflow actuator'} onChange={(event) => onUpdateEdge(selectedEdge.id, { label: event.target.value })} /></label><label className="field"><span>Notes</span><textarea value={selectedEdge.data?.notes ?? ''} placeholder="What does this actuator control?" onChange={(event) => onUpdateEdge(selectedEdge.id, { notes: event.target.value })} /></label><label className="field"><span>Tags</span><div className="input-with-icon"><Tag size={16} /><input value={selectedEdge.data?.tags.join(', ') ?? ''} onChange={(event) => onUpdateEdge(selectedEdge.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></div></label><BiasEditor target="edge" id={selectedEdge.id} bias={selectedEdge.data?.bias ?? {}} onUpdateBias={onUpdateBias} onAddBiasField={onAddBiasField} /></div>;
  return <div className="inspector-panel inspector-panel--empty"><div className="empty-inspector-icon"><Settings2 size={22} /></div><h2>Shape the system</h2><p>Select a room or actuator to edit its notes, tags, and bias fields. Add a preset room when the layout needs to grow.</p><div className="add-node-list"><span className="panel-kicker">Add a room</span><div className="preset-buttons">{presetIds.map((preset) => <button key={preset} type="button" className="preset-button" onClick={() => onAddNode(preset)}><Plus size={16} /><span><strong>{presetDefinitions[preset].label}</strong><small>{presetDefinitions[preset].description}</small></span></button>)}</div></div></div>;
}

function BiasEditor({ target, id, bias, onUpdateBias, onAddBiasField }: { target: 'node' | 'edge'; id: string; bias: Bias; onUpdateBias: (target: 'node' | 'edge', id: string, key: string, value: string) => void; onAddBiasField: (target: 'node' | 'edge', id: string) => void }) {
  return <div className="bias-editor"><div className="bias-heading"><span><SlidersHorizontal size={16} /> Bias fields</span><button type="button" className="text-button" onClick={() => onAddBiasField(target, id)}><Plus size={14} /> Add field</button></div>{Object.entries(bias).map(([key, value]) => <label className="bias-field" key={key}><span>{formatKey(key)}</span><input value={formatBiasValue(value)} onChange={(event) => onUpdateBias(target, id, key, event.target.value)} /></label>)}</div>;
}
