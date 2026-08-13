export const navigationItems = [
  { id: 'connections', label: 'Connections', detail: 'Rooms & actuators', href: '/connections', available: true },
  { id: 'live', label: 'Live system', detail: 'Control lifecycle', href: '/live', available: true },
  { id: 'scenarios', label: 'Scenarios', detail: 'Fault families', href: '/scenarios', available: true },
  { id: 'telemetry', label: 'Telemetry', detail: 'Observable contract', href: '/telemetry', available: true },
  { id: 'benchmarks', label: 'Benchmarks', detail: 'Measured evidence', href: '/benchmarks', available: true },
] as const;

export type NavigationId = (typeof navigationItems)[number]['id'];
