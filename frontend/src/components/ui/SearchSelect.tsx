import { Search } from 'lucide-react';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type Option = { value: string; label: string; meta?: string };
type DropdownPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

const GAP = 8;
const VIEWPORT_MARGIN = 12;
const PREFERRED_HEIGHT = 288;

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
}: {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(
    () =>
      options.filter((option) =>
        `${option.label} ${option.meta ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [options, search],
  );

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const availableBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
      const availableAbove = rect.top - VIEWPORT_MARGIN;
      const openAbove =
        availableBelow < Math.min(PREFERRED_HEIGHT, availableAbove) &&
        availableAbove > availableBelow;
      const maxHeight = Math.max(
        160,
        Math.min(
          PREFERRED_HEIGHT,
          (openAbove ? availableAbove : availableBelow) - GAP,
        ),
      );

      setPosition({
        left: Math.min(
          Math.max(VIEWPORT_MARGIN, rect.left),
          window.innerWidth - rect.width - VIEWPORT_MARGIN,
        ),
        top: openAbove
          ? Math.max(VIEWPORT_MARGIN, rect.top - maxHeight - GAP)
          : rect.bottom + GAP,
        width: rect.width,
        maxHeight,
      });
    };

    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearch('');
        triggerRef.current?.focus();
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const select = (option: Option) => {
    onChange(option.value);
    setOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        className="liquid-glass flex w-full items-center justify-between rounded-[14px] px-4 py-3 text-left text-[13px] text-primary"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? 'truncate' : 'truncate text-muted'}>
          {selected?.label ?? placeholder}
        </span>
        <Search size={16} className="shrink-0 text-muted" />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            id={listboxId}
            className="fixed z-[70] flex flex-col rounded-[14px] border border-border bg-surface p-2 shadow-2xl"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            <input
              className="field mb-2 shrink-0 text-xs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
              aria-label={`Buscar ${placeholder}`}
              autoFocus
            />
            <div
              className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain"
              role="listbox"
            >
              {filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className="block w-full rounded-xl px-3 py-3 text-left text-xs text-primary/80 hover:bg-glass focus:bg-glass focus:outline-none"
                  onClick={() => select(option)}
                >
                  <span className="block truncate">{option.label}</span>
                  {option.meta && (
                    <span className="mt-1 block truncate text-[10px] text-muted">
                      {option.meta}
                    </span>
                  )}
                </button>
              ))}
              {!filtered.length && (
                <p className="px-3 py-4 text-xs text-muted">Sin resultados</p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
