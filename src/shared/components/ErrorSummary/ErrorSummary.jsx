import './ErrorSummary.css';

// Resumen de datos por corregir arriba del formulario. Recibe el foco para que el usuario lo vea.
export default function ErrorSummary({ ref, title, messages }) {
  if (messages.length === 0) return null;

  return (
    <div ref={ref} className="error-summary" role="alert" tabIndex={-1}>
      <h2 className="error-summary__title">{title}</h2>
      <ul className="error-summary__list">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
