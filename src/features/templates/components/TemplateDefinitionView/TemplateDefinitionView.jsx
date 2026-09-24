import TemplateField from '../TemplateField/TemplateField';
import './TemplateDefinitionView.css';

const byPosition = (a, b) => a.position - b.position;

// Muestra todas las secciones y preguntas de una versión, sin poder editarlas
export default function TemplateDefinitionView({ definition }) {
  return (
    <div className="template-definition">
      {[...definition.sections].sort(byPosition).map((section) => (
        <section
          key={section.id}
          className="card template-definition__section"
          aria-labelledby={`section-${section.id}`}
        >
          <h3 id={`section-${section.id}`}>{section.title}</h3>
          <ol className="template-definition__fields">
            {[...section.fields].sort(byPosition).map((field, index) => (
              <TemplateField key={field.id} field={field} number={index + 1} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
