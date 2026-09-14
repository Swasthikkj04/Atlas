export type TechnologySignalType =
  | 'HEADER'
  | 'COOKIE'
  | 'BODY'
  | 'DNS'
  | 'TLS'
  | 'CERTIFICATE'
  | 'META'
  | 'SCRIPT'
  | 'WIRE_BEHAVIOR';

export interface TechnologySignal {
  readonly name: string;
  readonly type: TechnologySignalType;
  readonly indicator: string;
  readonly matched: boolean;
  readonly weight: number;
  readonly details?: string;
}
