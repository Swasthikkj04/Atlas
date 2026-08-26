import type { DomainDto } from '../../../../types/api';

export interface DomainEntryDialogProps {
  /**
   * True for new registered user with 0 domains,
   * False when adding additional domain from within an established Workspace.
   */
  isFirstDomain?: boolean;

  /**
   * Whether the dialog can be closed/cancelled.
   * Defaults to false on first domain, true on additional domains.
   */
  isDismissable?: boolean;

  /**
   * If true, renders with modal overlay backdrop.
   * If false, renders inline centered in the canvas.
   */
  isModal?: boolean;

  /**
   * Callback invoked when domain is successfully established and understanding starts.
   */
  onDomainEstablished?: (domain: DomainDto) => void;

  /**
   * Callback to close the dialog.
   */
  onClose?: () => void;

  /**
   * Optional custom CSS classes.
   */
  className?: string;
}
