import { FIELD_TYPES } from "@/features/templates/domain/fieldTypes";
import { YES_NO_NA_OPTIONS } from "./answerRules";

export const REPORT_EMPTY_VALUE = "Sin contestar";
export const REPORT_NO_EVIDENCE = "Sin evidencia";
export const REPORT_SIGNATURE_PLACEHOLDER = "Firma no disponible en esta POC.";

const YES_NO_NA_LABELS = new Map(
  YES_NO_NA_OPTIONS.map((option) => [option.value, option.label]),
);

function hasValue(value) {
  return (
    value !== undefined &&
    value !== null &&
    !(typeof value === "string" && value.trim() === "")
  );
}

function formatDate(value) {
  if (typeof value !== "string") return String(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

// Convierte el valor persistido a texto legible para la vista de reporte.
// En foto, la "respuesta" real son los adjuntos de esa pregunta.
export function reportAnswer(field, value, attachmentCount = 0) {
  if (field.type === FIELD_TYPES.SIGNATURE_PLACEHOLDER) {
    return { text: REPORT_SIGNATURE_PLACEHOLDER, unanswered: false };
  }

  if (field.type === FIELD_TYPES.PHOTO) {
    if (attachmentCount === 0)
      return { text: REPORT_EMPTY_VALUE, unanswered: true };
    return {
      text: `${attachmentCount} ${attachmentCount === 1 ? "foto adjunta" : "fotos adjuntas"}`,
      unanswered: false,
    };
  }

  if (!hasValue(value)) return { text: REPORT_EMPTY_VALUE, unanswered: true };

  switch (field.type) {
    case FIELD_TYPES.YES_NO_NA:
      return {
        text: YES_NO_NA_LABELS.get(value) ?? String(value),
        unanswered: false,
      };
    case FIELD_TYPES.SELECT: {
      const option = (field.options ?? []).find((item) => item.value === value);
      return { text: option?.label ?? String(value), unanswered: false };
    }
    case FIELD_TYPES.CHECKBOX:
      return {
        text: value === true ? "Sí, marcado" : "No marcado",
        unanswered: false,
      };
    case FIELD_TYPES.NUMBER:
      return {
        text: `${value}${field.unit ? ` ${field.unit}` : ""}`,
        unanswered: false,
      };
    case FIELD_TYPES.DATE:
      return { text: formatDate(value), unanswered: false };
    default:
      return { text: String(value), unanswered: false };
  }
}
