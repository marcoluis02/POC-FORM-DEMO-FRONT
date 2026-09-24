import Badge from '@/shared/components/Badge/Badge';
import { RESPONSE_STATUS_LABELS, RESPONSE_STATUS_TONES } from '../../domain/responseStatus';

export default function ResponseStatusBadge({ status }) {
  return (
    <Badge tone={RESPONSE_STATUS_TONES[status] ?? 'neutral'}>
      {RESPONSE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
