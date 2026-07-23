import { z } from 'zod';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

export const presetIds = ['crew_cabin', 'lab', 'processing_bay', 'custom'] as const;

export type PresetId = (typeof presetIds)[number];
export type Scalar = string | number | boolean;
export type Bias = Record<string, Scalar>;

export interface PresetDefinition {
  label: string;
  description: string;
  tone: 'amber' | 'blue' | 'green' | 'neutral';
  defaultBias: Bias;
  defaultTags: string[];
}

export const presetDefinitions: Record<PresetId, PresetDefinition> = {
  crew_cabin: {
    label: 'Crew cabin',
    description: 'A lived-in habitat zone with occupant load.',
    tone: 'amber',
    defaultBias: {
      occupants: 1,
      co2_generation: 1,
      ventilation_priority: 'standard',
    },
    defaultTags: ['habitat', 'people'],
  },
  lab: {
    label: 'Laboratory',
    description: 'A higher-load room that can need priority airflow.',
    tone: 'blue',
    defaultBias: {
      occupants: 2,
      co2_generation: 1.7,
      ventilation_priority: 'high',
      lab_load: 0.65,
    },
    defaultTags: ['habitat', 'lab'],
  },
  processing_bay: {
    label: 'Processing bay',
    description: 'A service area with scrubber and processing capacity.',
    tone: 'green',
    defaultBias: {
      scrubber_capacity: 10,
      removal_fraction: 0.5,
      processing_load: 0.8,
    },
    defaultTags: ['service', 'scrubber'],
  },
  custom: {
    label: 'Custom node',
    description: 'A blank node for an area the team defines later.',
    tone: 'neutral',
    defaultBias: {
      load: 0,
      ventilation_priority: 'standard',
    },
    defaultTags: ['custom'],
  },
};

export type GraphNodeData = Record<string, unknown> & {
  label: string;
  preset: PresetId;
  notes: string;
  tags: string[];
  bias: Bias;
  tone: PresetDefinition['tone'];
};

export type GraphEdgeData = Record<string, unknown> & {
  label: string;
  kind: 'airflow_actuator';
  notes: string;
  tags: string[];
  bias: Bias;
};

export type IcarusNode = Node<GraphNodeData, 'icarus'>;
export type IcarusEdge = Edge<GraphEdgeData> & { data: GraphEdgeData };

export interface GraphDocument {
  version: 1;
  name: string;
  nodes: Array<{
    id: string;
    type: 'icarus';
    position: { x: number; y: number };
    data: GraphNodeData;
  }>;
  connections: Array<{
    id: string;
    source: string;
    target: string;
    type: 'smoothstep';
    data: GraphEdgeData;
  }>;
}

const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);
const biasSchema = z.record(z.string(), scalarSchema);
const graphNodeDataSchema = z.object({
  label: z.string().min(1),
  preset: z.enum(presetIds),
  notes: z.string(),
  tags: z.array(z.string()),
  bias: biasSchema,
  tone: z.enum(['amber', 'blue', 'green', 'neutral']),
});
const graphEdgeDataSchema = z.object({
  label: z.string().min(1),
  kind: z.literal('airflow_actuator'),
  notes: z.string(),
  tags: z.array(z.string()),
  bias: biasSchema,
});

export const graphDocumentSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  nodes: z.array(z.object({
    id: z.string().min(1),
    type: z.literal('icarus'),
    position: z.object({ x: z.number(), y: z.number() }),
    data: graphNodeDataSchema,
  })),
  connections: z.array(z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.literal('smoothstep'),
    data: graphEdgeDataSchema,
  })),
});

function createId(prefix: string): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now().toString(36)}`;
}

export function createNodeFromPreset(
  preset: PresetId,
  index: number,
  position?: { x: number; y: number },
): IcarusNode {
  const definition = presetDefinitions[preset];
  const labels: Record<PresetId, string> = {
    crew_cabin: 'Crew Cabin',
    lab: 'Lab',
    processing_bay: 'Processing Bay',
    custom: 'New Node',
  };

  return {
    id: createId(preset),
    type: 'icarus',
    position: position ?? { x: 90 + (index % 3) * 250, y: 90 + Math.floor(index / 3) * 180 },
    data: {
      label: `${labels[preset]}${index > 3 ? ` ${index - 2}` : ''}`,
      preset,
      notes: '',
      tags: [...definition.defaultTags],
      bias: { ...definition.defaultBias },
      tone: definition.tone,
    },
  };
}

export function createConnection(source: string, target: string): IcarusEdge {
  return {
    id: `connection-${source}-${target}`,
    source,
    target,
    type: 'smoothstep',
    data: {
      label: 'Airflow actuator',
      kind: 'airflow_actuator',
      notes: '',
      tags: ['actuator'],
      bias: {
        capacity: 10,
        effectiveness: 1,
        commandable: true,
        maximum_command: 0.8,
      },
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#d87b43',
    },
  };
}

export function createStarterGraph(): { nodes: IcarusNode[]; edges: IcarusEdge[] } {
  const cabinA = createNodeFromPreset('crew_cabin', 0, { x: 60, y: 80 });
  const cabinB = createNodeFromPreset('crew_cabin', 1, { x: 60, y: 330 });
  const lab = createNodeFromPreset('lab', 2, { x: 60, y: 580 });
  const processingBay = createNodeFromPreset('processing_bay', 3, { x: 560, y: 330 });

  cabinA.id = 'cabin-a';
  cabinA.data.label = 'Crew Cabin A';
  cabinB.id = 'cabin-b';
  cabinB.data.label = 'Crew Cabin B';
  lab.id = 'lab';
  lab.data.label = 'Lab';
  processingBay.id = 'processing-bay';
  processingBay.data.label = 'Air Processing Bay';

  const nodes = [cabinA, cabinB, lab, processingBay];
  const edges = [
    createConnection(cabinA.id, processingBay.id),
    createConnection(cabinB.id, processingBay.id),
    createConnection(lab.id, processingBay.id),
    createConnection(processingBay.id, cabinA.id),
    createConnection(processingBay.id, cabinB.id),
    createConnection(processingBay.id, lab.id),
  ];

  return { nodes, edges };
}

export function toGraphDocument(name: string, nodes: IcarusNode[], edges: IcarusEdge[]): GraphDocument {
  return {
    version: 1,
    name,
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type: type ?? 'icarus', position, data })),
    connections: edges.map(({ id, source, target, type, data }) => ({
      id,
      source,
      target,
      type: type === 'smoothstep' ? 'smoothstep' : 'smoothstep',
      data: data ?? createConnection(source, target).data,
    })),
  };
}

export function fromGraphDocument(document: GraphDocument): { nodes: IcarusNode[]; edges: IcarusEdge[] } {
  return {
    nodes: document.nodes.map((node) => ({
      id: node.id,
      type: 'icarus',
      position: node.position,
      data: node.data,
    })),
    edges: document.connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      type: 'smoothstep',
      data: connection.data,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#d87b43',
      },
    })),
  };
}

export function parseGraphDocument(payload: unknown): GraphDocument {
  const result = graphDocumentSchema.safeParse(payload);
  if (!result.success) {
    throw new Error('This file is not a valid ICARUS topology document.');
  }

  return result.data;
}

export function directionExists(edges: IcarusEdge[], source: string, target: string): boolean {
  return edges.some((edge) => edge.source === source && edge.target === target);
}
