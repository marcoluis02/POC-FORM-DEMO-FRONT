import { Link } from 'react-router';
import { paths } from '@/app/router/routes';
import Badge from '@/shared/components/Badge/Badge';
import { formatDateTime } from '@/shared/utils/formatDate';
import { TEMPLATE_STATUS, TEMPLATE_STATUS_LABELS } from '../../domain/templateStatus';
import './TemplateListItem.css';

// Una plantilla del listado. Toda la tarjeta es clicable para abrir el detalle.
export default function TemplateListItem({ template }) {
  return (
    <li>
      <Link to={paths.templateDetail(template.id)} className="template-list-item card">
        <div className="template-list-item__main">
          <span className="template-list-item__name">{template.name}</span>
          <span className="text-secondary text-small">
            Actualizada: {formatDateTime(template.updated_at)}
          </span>
        </div>
        <div className="template-list-item__badges">
          <Badge tone={template.status === TEMPLATE_STATUS.ACTIVE ? 'success' : 'neutral'}>
            {TEMPLATE_STATUS_LABELS[template.status] ?? template.status}
          </Badge>
          <Badge tone="info">Versión {template.latest_version}</Badge>
        </div>
        <span className="template-list-item__arrow" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  );
}
