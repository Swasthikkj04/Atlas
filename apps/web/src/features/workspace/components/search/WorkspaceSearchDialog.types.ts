import type { SearchItemDto } from '../../../../types/api/search.dto';
import type { DomainDto } from '../../../../types/api/domain.dto';

export interface WorkspaceSearchDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelectResult: (item: SearchItemDto, domainId: string) => void;
  readonly domains: readonly DomainDto[];
  readonly activeDomainId?: string | null;
  readonly className?: string;
}
