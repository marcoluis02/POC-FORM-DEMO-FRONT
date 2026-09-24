import '@/shared/components/FormField/FormField.css';
import './SignaturePlaceholderField.css';

// La firma todavía no se puede capturar: se muestra el espacio y no se exige al enviar
export default function SignaturePlaceholderField({ label }) {
  return (
    <div className="signature-placeholder">
      <p className="form-field__label">{label}</p>
      <div className="signature-placeholder__box">Próximamente podrás firmar aquí.</div>
    </div>
  );
}
