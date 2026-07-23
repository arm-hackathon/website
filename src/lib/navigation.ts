export const navigationItems = [
  { id: 'connections', label: 'Connections', detail: 'Rooms & actuators', href: '/connections', available: true },
  { id: 'live', label: 'Live system', detail: 'Locked / to be developed', href: '/live', available: false },
  { id: 'scenarios', label: 'Scenarios', detail: 'Locked / to be developed', href: '/scenarios', available: false },
  { id: 'telemetry', label: 'Telemetry', detail: 'Locked / to be developed', href: '/telemetry', available: false },
  { id: 'benchmarks', label: 'Benchmarks', detail: 'Locked / to be developed', href: '/benchmarks', available: false },
] as const;

export type NavigationId = (typeof navigationItems)[number]['id'];
