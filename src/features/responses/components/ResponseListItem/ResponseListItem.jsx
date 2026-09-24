import { Link } from 'react-router';
import { paths } from '@/app/router/routes';
import Badge from '@/shared/components/Badge/Badge';
import { formatDateTime } from '@/shared/utils/formatDate';
import { RESPONSE_STATUS } from '../../domain/responseStatus';
import ResponseStatusBadge from '../ResponseStatusBadge/ResponseStatusBadge';
import './ResponseListItem.css';

// Un formulario llenado del listado. Toda la tarjeta es clicable para abrirlo.
export default function ResponseListItem({ response }) {
  const submitted = response.status === RESPONSE_STATUS.SUBMITTED;

  return (
    <li>
      <Link to={paths.responseDetail(response.id)} className="response-list-item">
        <div className="response-list-item__main">
          <span className="response-list-item__title">{response.name}</span>
          <span className="text-secondary text-small">
            {submitted
              ? `Enviado: ${formatDateTime(response.submitted_at)}`
              : `Último guardado: ${formatDateTime(response.updated_at)}`}
          </span>
        </div>
        <div className="response-list-item__badges">
          <ResponseStatusBadge status={response.status} />
          <Badge tone="info">Versión {response.version}</Badge>
        </div>
        <span className="response-list-item__arrow" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  );
}
