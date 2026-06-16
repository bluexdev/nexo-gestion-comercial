import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchSelect } from './SearchSelect';

describe('SearchSelect', () => {
  it('renderiza el listado mediante portal fuera del contenedor', () => {
    const onChange = vi.fn();
    const { container } = render(
      <div data-testid="clipping-container" style={{ overflow: 'hidden' }}>
        <SearchSelect
          options={[
            { value: 'p1', label: 'Producto uno', meta: 'STOCK 10' },
            { value: 'p2', label: 'Producto dos', meta: 'STOCK 20' },
          ]}
          onChange={onChange}
          placeholder="Producto"
        />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Producto' }));
    const listbox = screen.getByRole('listbox');
    expect(document.body.contains(listbox)).toBe(true);
    expect(container.contains(listbox)).toBe(false);

    fireEvent.click(screen.getByRole('option', { name: /Producto dos/ }));
    expect(onChange).toHaveBeenCalledWith('p2');
  });

  it('filtra opciones y cierra con Escape', () => {
    render(
      <SearchSelect
        options={[
          { value: 'p1', label: 'Monitor' },
          { value: 'p2', label: 'Teclado' },
        ]}
        onChange={vi.fn()}
        placeholder="Producto"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Producto' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar Producto' }), {
      target: { value: 'tec' },
    });
    expect(screen.queryByRole('option', { name: 'Monitor' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Teclado' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
