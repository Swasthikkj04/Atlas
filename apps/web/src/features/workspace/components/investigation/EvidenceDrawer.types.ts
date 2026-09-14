import { type HTMLAttributes } from 'react';
import type { EvidenceDrawerItem } from '../../contracts/investigation-continuity.contract';

export interface EvidenceDrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onCopy'> {
  /** Whether the evidence drawer is currently open */
  isOpen: boolean;
  /** Callback fired when drawer is closed */
  onClose: () => void;
  /** The active evidence item to inspect */
  evidenceItem?: EvidenceDrawerItem | null;
  /** Active domain name for display context */
  domainName: string;
  /** Callback to transition to deep finding investigation */
  onOpenInvestigation?: (findingId?: string) => void;
  /** Callback to view associated snapshot */
  onOpenSnapshot?: (snapshotId: string) => void;
  /** Callback on copy action */
  onCopy?: (text: string) => void;
  className?: string;
}
