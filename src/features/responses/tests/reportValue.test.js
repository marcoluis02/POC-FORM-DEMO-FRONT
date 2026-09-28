import {
  reportAnswer,
  REPORT_EMPTY_VALUE,
  REPORT_SIGNATURE_PLACEHOLDER,
} from "../domain/reportValue";

function field(type, changes = {}) {
  return {
    id: "f_999",
    type,
    label: "Campo",
    required: false,
    position: 1,
    allow_evidence: false,
    ...changes,
  };
}

describe("reportAnswer", () => {
  it("muestra claramente los valores vacíos", () => {
    expect(reportAnswer(field("short_text"), undefined)).toEqual({
      text: REPORT_EMPTY_VALUE,
      unanswered: true,
    });
    expect(reportAnswer(field("photo"), undefined, 0)).toEqual({
      text: REPORT_EMPTY_VALUE,
      unanswered: true,
    });
  });

  it("traduce yes/no/na y select a sus etiquetas", () => {
    expect(reportAnswer(field("yes_no_na"), "na").text).toBe("No aplica");
    expect(
      reportAnswer(
        field("select", {
          options: [
            { value: "ok", label: "Buen estado" },
            { value: "bad", label: "Requiere atención" },
          ],
        }),
        "ok",
      ).text,
    ).toBe("Buen estado");
  });

  it("formatea checkbox, número con unidad, fecha y foto", () => {
    expect(reportAnswer(field("checkbox"), false).text).toBe("No marcado");
    expect(reportAnswer(field("number", { unit: "°F" }), 72.5).text).toBe(
      "72.5 °F",
    );
    expect(reportAnswer(field("date"), "2026-09-25").unanswered).toBe(false);
    expect(reportAnswer(field("photo"), undefined, 2).text).toBe(
      "2 fotos adjuntas",
    );
  });

  it("explica que la firma no se captura en esta POC", () => {
    expect(reportAnswer(field("signature_placeholder"), undefined)).toEqual({
      text: REPORT_SIGNATURE_PLACEHOLDER,
      unanswered: false,
    });
  });
});
