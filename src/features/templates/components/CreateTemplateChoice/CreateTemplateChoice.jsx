import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, FilePenLineIcon, ScanTextIcon, SparklesIcon } from 'lucide-animated';
import { Link, useNavigate } from 'react-router';
import { ROUTES, paths } from '@/app/router/routes';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import Loader from '@/shared/components/Loader/Loader';
import Modal from '@/shared/components/Modal/Modal';
import { useToast } from '@/shared/components/Toast/useToast';
import { DOCUMENT_CAPTURE, DOCUMENT_UPLOAD } from '@/shared/domain/documentUpload';
import { IMPORT_STATUS } from '@/shared/domain/importStatus';
import { animatedIconEvents } from '@/shared/hooks/useAnimatedIcon';
import { useCreateImport } from '@/shared/hooks/useCreateImport';
import { useImport } from '@/shared/hooks/useImport';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { validateFile } from '@/shared/utils/fileValidation';
import './CreateTemplateChoice.css';

const MOBILE_QUERY = '(max-width: 720px)';
const STEP_INTERVAL_MS = 2200;
const PROGRESS_STEPS = [
  'Subiendo el documento...',
  'Leyendo el archivo...',
  'Identificando secciones...',
  'Armando las preguntas...',
  'Preparando la revisión...',
];

export default function CreateTemplateChoice({ open, onClose }) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const navigate = useNavigate();
  const toast = useToast();
  const createImport = useCreateImport();
  const cameraInput = useRef(null);
  const fileInput = useRef(null);
  const camera = useRef(null);
  const cameraArrow = useRef(null);
  const file = useRef(null);
  const fileArrow = useRef(null);
  const blank = useRef(null);
  const blankArrow = useRef(null);
  const closeRef = useRef(onClose);
  const finished = useRef(false);
  const [importId, setImportId] = useState(null);
  const [step, setStep] = useState(0);
  const importQuery = useImport(importId, { poll: true });
  const imported = importQuery.data;
  const uploading = createImport.isPending;
  const tracking = Boolean(importId);
  const progressing = uploading || tracking;
  closeRef.current = onClose;

  useEffect(() => {
    if (open) return;
    finished.current = false;
    setImportId(null);
    setStep(0);
  }, [open]);

  useEffect(() => {
    if (!tracking) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, PROGRESS_STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [tracking]);

  useEffect(() => {
    if (!imported || finished.current) return;
    if (imported.status === IMPORT_STATUS.FAILED) {
      finished.current = true;
      closeRef.current();
      navigate(paths.importDetail(imported.id));
      return;
    }
    if (imported.status === IMPORT_STATUS.REQUIRES_REVIEW) {
      finished.current = true;
      closeRef.current();
      navigate(`${ROUTES.templateNew}?importId=${encodeURIComponent(imported.id)}`);
    }
  }, [imported, navigate]);

  const sendFile = async (selected, rules) => {
    const invalid = validateFile(selected, rules);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setStep(0);
    try {
      const created = await createImport.mutateAsync(selected);
      setStep(1);
      setImportId(created.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onPicked = (rules) => (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (selected) sendFile(selected, rules);
  };

  return (
    <Modal
      open={open}
      wide={!progressing}
      className="create-template-modal"
      title={progressing ? 'Creando tu plantilla' : '¿Cómo deseas crear tu plantilla?'}
      description={
        progressing
          ? 'Sigue en esta ventana.'
          : 'Elige el punto de partida que mejor se adapte a tu ritmo de trabajo actual.'
      }
      onClose={uploading ? undefined : onClose}
      closeOnBackdrop={!uploading}
      kicker={<span className="create-template-choice__badge">Asistente Sannia</span>}
    >
      {progressing ? (
        <div className="create-template-choice__progress" aria-live="polite">
          <Loader label={PROGRESS_STEPS[uploading ? 0 : step]} />
          <ol className="create-template-choice__progress-list">
            {PROGRESS_STEPS.map((label, index) => {
              const current = uploading ? 0 : step;
              const state = index < current ? 'done' : index === current ? 'current' : 'wait';
              return (
                <li
                  key={label}
                  className={`create-template-choice__progress-item create-template-choice__progress-item--${state}`}
                >
                  <span className="create-template-choice__progress-mark" aria-hidden="true" />
                  {label}
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
      <div className={mobile ? 'create-template-choice' : 'create-template-choice create-template-choice--pair'}>
        {mobile && (
          <button
            type="button"
            className="create-template-choice__option"
            onClick={() => cameraInput.current?.click()}
            {...animatedIconEvents(camera, cameraArrow)}
          >
            <div className="create-template-choice__icon create-template-choice__icon--camera">
              <AnimatedIcon icon={ScanTextIcon} iconRef={camera} size={22} />
            </div>
            <strong>Tomar foto o escanear</strong>
            <span className="create-template-choice__text">Hojas impresas o una captura directa con la cámara.</span>
            <div className="create-template-choice__action create-template-choice__action--camera">
              Iniciar cámara
              <AnimatedIcon icon={ArrowRightIcon} iconRef={cameraArrow} size={16} />
            </div>
          </button>
        )}

        <button
          type="button"
          className="create-template-choice__option create-template-choice__option--featured"
          onClick={() => fileInput.current?.click()}
          {...animatedIconEvents(file, fileArrow)}
        >
          <div className="create-template-choice__icon-row">
            <div className="create-template-choice__icon create-template-choice__icon--file">
              <AnimatedIcon icon={SparklesIcon} iconRef={file} size={22} />
            </div>
            <span className="create-template-choice__ia">IA Activa</span>
          </div>
          <strong>Subir documento o PDF</strong>
          <span className="create-template-choice__text">
            PDF o imagen, hasta {DOCUMENT_UPLOAD.maxSizeMb} MB. La IA arma secciones y preguntas.
          </span>
          <div className="create-template-choice__action">
            Explorar archivos
            <AnimatedIcon icon={ArrowRightIcon} iconRef={fileArrow} size={16} />
          </div>
        </button>

        <Link
          to={ROUTES.templateNew}
          className="create-template-choice__option"
          onClick={onClose}
          {...animatedIconEvents(blank, blankArrow)}
        >
          <div className="create-template-choice__icon">
            <AnimatedIcon icon={FilePenLineIcon} iconRef={blank} size={22} />
          </div>
          <strong>Crear desde cero</strong>
          <span className="create-template-choice__text">Empieza en blanco y diseña los campos a mano.</span>
          <div className="create-template-choice__action create-template-choice__action--muted">
            Abrir editor
            <AnimatedIcon icon={ArrowRightIcon} iconRef={blankArrow} size={16} />
          </div>
        </Link>
      </div>
      )}

      {mobile && (
        <input
          ref={cameraInput}
          type="file"
          className="visually-hidden"
          accept={DOCUMENT_CAPTURE.accept}
          capture={DOCUMENT_CAPTURE.capture}
          aria-label="Tomar foto o escanear"
          tabIndex={-1}
          onChange={onPicked({ accept: DOCUMENT_CAPTURE.accept, maxSizeMb: DOCUMENT_UPLOAD.maxSizeMb })}
        />
      )}
      <input
        ref={fileInput}
        type="file"
        className="visually-hidden"
        accept={DOCUMENT_UPLOAD.accept}
        aria-label="Subir documento o PDF"
        tabIndex={-1}
        onChange={onPicked({ accept: DOCUMENT_UPLOAD.accept, maxSizeMb: DOCUMENT_UPLOAD.maxSizeMb })}
      />

      {!progressing && (
      <p className="create-template-choice__tip">
        <span className="create-template-choice__tip-icon" aria-hidden="true">
          i
        </span>
        Puedes adjuntar el documento después, dentro del editor, para que la IA proponga las preguntas.
      </p>
      )}
    </Modal>
  );
}
