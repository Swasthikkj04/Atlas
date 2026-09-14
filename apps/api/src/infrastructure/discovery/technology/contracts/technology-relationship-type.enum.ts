export enum TechnologyRelationshipType {
  // Request / Traffic Flow
  ROUTES_TO = 'ROUTES_TO',
  FORWARDS_TO = 'FORWARDS_TO',
  SERVES = 'SERVES',
  PROXIES_TO = 'PROXIES_TO',

  // Infrastructure Dependency / Hosting
  DEPENDS_ON = 'DEPENDS_ON',
  HOSTED_ON = 'HOSTED_ON',
  RUNS_ON = 'RUNS_ON',

  // Integration
  INTEGRATES_WITH = 'INTEGRATES_WITH',
  REPORTS_TO = 'REPORTS_TO',
  USES = 'USES',

  // Infrastructure Position / Topology Layer
  EDGE_OF = 'EDGE_OF',
  ORIGIN_OF = 'ORIGIN_OF',
  APPLICATION_LAYER = 'APPLICATION_LAYER',
  RUNTIME_LAYER = 'RUNTIME_LAYER',
}
