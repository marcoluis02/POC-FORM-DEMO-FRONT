import { ArrowRightIcon, CircleHelpIcon, ClockIcon, ListIcon, SquarePenIcon } from 'lucide-animated';
import { Link } from 'react-router';
import { paths } from '@/app/router/routes';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import { useAnimatedIcon } from '@/shared/hooks/useAnimatedIcon';
import { formatRelativeTime } from '@/shared/utils/formatDate';
import { TEMPLATE_STATUS, TEMPLATE_STATUS_LABELS } from '../../domain/templateStatus';
import { summarizeTemplate } from '../../domain/templateSummary';
import './TemplateListItem.css';

export default function TemplateListItem({ template }) {
  const active = template.status === TEMPLATE_STATUS.ACTIVE;
  const statusLabel = TEMPLATE_STATUS_LABELS[template.status] ?? template.status;
  const facts = summarizeTemplate(template);
  const when = formatRelativeTime(template.updated_at);
  const editIcon = useAnimatedIcon();
  const useIcon = useAnimatedIcon();

  return (
    <li className="template-list-item">
      <div className="template-list-item__body">
      <Link to={paths.templateDetail(template.id)} className="template-list-item__name">
        {template.name}
      </Link>

      {facts?.summary && <p className="template-list-item__summary">{facts.summary}</p>}

      <ul className="template-list-item__facts">
        <li>
          <span className={active ? 'template-list-item__badge' : 'template-list-item__badge template-list-item__badge--muted'}>
            <span className="template-list-item__dot" aria-hidden="true" />
            {statusLabel}
          </span>
        </li>
        {facts && (
          <li>
            <AnimatedIcon icon={CircleHelpIcon} size={15} />
            {facts.questions} preguntas
          </li>
        )}
        {facts && (
          <li>
            <AnimatedIcon icon={ListIcon} size={15} />
            {facts.sections} secciones
          </li>
        )}
        <li>Versión {template.latest_version}</li>
        {when && (
          <li>
            <AnimatedIcon icon={ClockIcon} size={15} />
            Actualizada {when}
          </li>
        )}
      </ul>
      </div>

      <div className="template-list-item__actions">
        <ButtonLink
          variant="secondary"
          size="sm"
          className="template-list-item__edit"
          to={paths.templateEdit(template.id)}
          onMouseEnter={editIcon.onMouseEnter}
          onMouseLeave={editIcon.onMouseLeave}
          onFocus={editIcon.onFocus}
          onBlur={editIcon.onBlur}
        >
          <AnimatedIcon icon={SquarePenIcon} iconRef={editIcon.ref} size={16} />
          Editar
        </ButtonLink>
        <ButtonLink
          className="template-list-item__use"
          size="sm"
          to={paths.templateDetail(template.id)}
          onMouseEnter={useIcon.onMouseEnter}
          onMouseLeave={useIcon.onMouseLeave}
          onFocus={useIcon.onFocus}
          onBlur={useIcon.onBlur}
        >
          Usar formulario
          <AnimatedIcon icon={ArrowRightIcon} iconRef={useIcon.ref} size={16} />
        </ButtonLink>
      </div>
    </li>
  );
}
