import { byPosition } from '@/shared/utils/byPosition';
import TemplateField from '../TemplateField/TemplateField';
import './TemplateDefinitionView.css';

// Muestra todas las secciones y preguntas de una versión, sin poder editarlas
export default function TemplateDefinitionView({ definition }) {
  return (
    <div className="template-definition">
      {[...definition.sections].sort(byPosition).map((section, sectionIndex) => (
        <section
          key={section.id}
          className="template-definition__section"
          aria-labelledby={`section-${section.id}`}
        >
          <h3 id={`section-${section.id}`} className="template-definition__heading">
            <span className="template-definition__index">{sectionIndex + 1}</span>
            {section.title}
          </h3>
          <ol className="template-definition__fields">
            {[...section.fields].sort(byPosition).map((field, fieldIndex) => (
              <TemplateField
                key={field.id}
                field={field}
                number={`${sectionIndex + 1}.${fieldIndex + 1}`}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
