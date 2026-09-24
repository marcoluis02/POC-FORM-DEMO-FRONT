import { getFocusableElements, keepFocusInside } from '@/shared/utils/focusTrap';

function renderContainer(innerHtml) {
  document.body.innerHTML = `<div id="modal" tabindex="-1">${innerHtml}</div>`;
  return document.getElementById('modal');
}

const pressTab = ({ shift = false } = {}) => ({ shiftKey: shift, preventDefault: vi.fn() });

const THREE_BUTTONS = `
  <button id="first">Primero</button>
  <button id="middle">En medio</button>
  <button id="last">Último</button>
`;

describe('focusTrap', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Tab', () => {
    it('desde el último elemento regresa al primero', () => {
      const container = renderContainer(THREE_BUTTONS);
      document.getElementById('last').focus();
      const event = pressTab();

      keepFocusInside(event, container);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.activeElement.id).toBe('first');
    });

    it('en medio deja que el navegador avance solo', () => {
      const container = renderContainer(THREE_BUTTONS);
      document.getElementById('middle').focus();
      const event = pressTab();

      keepFocusInside(event, container);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(document.activeElement.id).toBe('middle');
    });
  });

  describe('Shift+Tab', () => {
    it('desde el primer elemento va al último', () => {
      const container = renderContainer(THREE_BUTTONS);
      document.getElementById('first').focus();
      const event = pressTab({ shift: true });

      keepFocusInside(event, container);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.activeElement.id).toBe('last');
    });

    it('en medio deja que el navegador regrese solo', () => {
      const container = renderContainer(THREE_BUTTONS);
      document.getElementById('middle').focus();
      const event = pressTab({ shift: true });

      keepFocusInside(event, container);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(document.activeElement.id).toBe('middle');
    });
  });

  describe('sin elementos enfocables', () => {
    it('deja el foco en el contenedor con Tab', () => {
      const container = renderContainer('<p>Solo texto</p><button disabled>Apagado</button>');
      const event = pressTab();

      keepFocusInside(event, container);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(container);
    });

    it('deja el foco en el contenedor con Shift+Tab', () => {
      const container = renderContainer('<p>Solo texto</p>');
      const event = pressTab({ shift: true });

      keepFocusInside(event, container);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(container);
    });
  });

  describe('getFocusableElements', () => {
    it('ignora elementos deshabilitados y tabindex="-1"', () => {
      const container = renderContainer(`
        <a href="/x" id="link">Enlace</a>
        <a id="no-href">Sin href</a>
        <button id="ok">Ok</button>
        <button disabled>Apagado</button>
        <input id="input" />
        <input disabled />
        <select id="select"><option>1</option></select>
        <textarea id="textarea"></textarea>
        <div tabindex="0" id="custom">Personalizado</div>
        <div tabindex="-1">Fuera del Tab</div>
      `);

      const ids = getFocusableElements(container).map((element) => element.id);

      expect(ids).toEqual(['link', 'ok', 'input', 'select', 'textarea', 'custom']);
    });

    it('sin contenedor regresa una lista vacía', () => {
      expect(getFocusableElements(null)).toEqual([]);
    });
  });
});
