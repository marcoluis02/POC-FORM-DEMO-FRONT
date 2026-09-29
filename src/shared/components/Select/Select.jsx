import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import FormField from '@/shared/components/FormField/FormField';
import { classNames } from '@/shared/utils/classNames';
import './Select.css';

const MENU_GAP = 6;
const MENU_MIN_WIDTH = 220;

function menuPosition(button) {
  const rect = button.getBoundingClientRect();
  const width = Math.max(rect.width, MENU_MIN_WIDTH);
  const maxLeft = Math.max(8, window.innerWidth - width - 8);
  const left = Math.min(Math.max(8, rect.left), maxLeft);
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUp = spaceBelow < 220 && rect.top > spaceBelow;

  return {
    position: 'fixed',
    left,
    width,
    top: openUp ? 'auto' : rect.bottom + MENU_GAP,
    bottom: openUp ? window.innerHeight - rect.top + MENU_GAP : 'auto',
    zIndex: 100,
  };
}

// options: [{ value, label }]
export default function Select({
  label,
  hint,
  error,
  required,
  requiredMark,
  labelHidden,
  id,
  options,
  placeholder = 'Selecciona una opción',
  className,
  value,
  disabled = false,
  name,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const listId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  function placeMenu() {
    if (!buttonRef.current) return;
    setPosition(menuPosition(buttonRef.current));
  }

  function closeMenu() {
    setOpen(false);
  }

  function openMenu() {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    placeMenu();
    setOpen(true);
  }

  function choose(option) {
    onChange?.({ target: { value: option.value, name } });
    closeMenu();
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      const target = event.target;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    }

    function onLayout() {
      placeMenu();
    }

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = menuRef.current?.querySelector('.select__option--active');
    if (typeof active?.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  function onButtonKeyDown(event) {
    if (disabled) return;

    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openMenu();
      return;
    }

    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(options.length - 1, index + 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option);
    }
  }

  const activeId = open ? `${listId}-option-${activeIndex}` : undefined;

  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      required={required}
      requiredMark={requiredMark}
      labelHidden={labelHidden}
      id={id}
    >
      {({ id: selectId, describedBy, invalid }) => (
        <div className={classNames('select', open && 'select--open')} ref={rootRef}>
          <button
            ref={buttonRef}
            id={selectId}
            type="button"
            className={classNames(
              'form-control',
              'select__trigger',
              !selected && 'select__trigger--placeholder',
              className,
            )}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={activeId}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            disabled={disabled}
            onClick={() => (open ? closeMenu() : openMenu())}
            onKeyDown={onButtonKeyDown}
          >
            <span className="select__value">{selected?.label ?? placeholder}</span>
          </button>
          {open &&
            createPortal(
              <ul
                ref={menuRef}
                id={listId}
                role="listbox"
                className="select__menu"
                style={position}
                aria-labelledby={selectId}
              >
                {options.map((option, index) => (
                  <li key={option.value} role="presentation">
                    <button
                      id={`${listId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      className={classNames(
                        'select__option',
                        option.value === value && 'select__option--selected',
                        index === activeIndex && 'select__option--active',
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(option)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>,
              document.body,
            )}
        </div>
      )}
    </FormField>
  );
}
