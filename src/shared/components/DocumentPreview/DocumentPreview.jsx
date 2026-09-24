import { DOCUMENT_UPLOAD } from '@/shared/domain/documentUpload';
import './DocumentPreview.css';

// Muestra una foto o un PDF. onError avisa si la imagen no se pudo cargar.
export default function DocumentPreview({ url, name, pdf, onError }) {
  return (
    <div className="document-preview">
      {pdf ? (
        <object data={url} type={DOCUMENT_UPLOAD.pdfType} className="document-preview__pdf">
          <p className="document-preview__fallback">
            Tu navegador no puede mostrar el PDF aquí.{' '}
            <a href={url} target="_blank" rel="noreferrer">
              Abrir el PDF en otra pestaña
            </a>
          </p>
        </object>
      ) : (
        <img
          src={url}
          alt={`Documento original: ${name}`}
          className="document-preview__image"
          onError={onError}
        />
      )}
    </div>
  );
}
