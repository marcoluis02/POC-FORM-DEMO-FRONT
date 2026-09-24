import Badge from '@/shared/components/Badge/Badge';
import { FIELD_TYPE_LABELS } from '../../domain/fieldTypes';
import './TemplateField.css';

// Vista de solo lectura de una pregunta
export default function TemplateField({ field, number }) {
  return (
    <li className="template-field">
      <span className="template-field__number" aria-hidden="true">
        {number}
      </span>
      <div className="template-field__content">
        <p className="template-field__label">{field.label}</p>
        <div className="template-field__tags">
          <Badge>{FIELD_TYPE_LABELS[field.type] ?? field.type}</Badge>
          {field.unit && <Badge tone="info">Unidad: {field.unit}</Badge>}
          {field.required && <Badge tone="warning">Obligatoria</Badge>}
          {field.allow_evidence && <Badge tone="info">Foto de evidencia</Badge>}
        </div>
      </div>
    </li>
  );
}
