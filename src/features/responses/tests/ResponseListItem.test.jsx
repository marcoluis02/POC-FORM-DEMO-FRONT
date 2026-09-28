import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ResponseListItem from "../components/ResponseListItem/ResponseListItem";

function response(status) {
  return {
    id: "response-1",
    name: "Visita A",
    status,
    version: 1,
    submitted_at: status === "submitted" ? "2026-09-25T12:00:00Z" : null,
    updated_at: "2026-09-25T11:00:00Z",
  };
}

describe("ResponseListItem", () => {
  it("abre el llenado cuando todavía es borrador", () => {
    render(
      <MemoryRouter>
        <ResponseListItem response={response("draft")} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Visita A/ })).toHaveAttribute(
      "href",
      "/responses/response-1",
    );
  });

  it("abre directamente el reporte cuando ya fue enviado", () => {
    render(
      <MemoryRouter>
        <ResponseListItem response={response("submitted")} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Visita A/ })).toHaveAttribute(
      "href",
      "/responses/response-1/report",
    );
  });
});
