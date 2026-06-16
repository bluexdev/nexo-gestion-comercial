import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectMenu } from './SelectMenu';

describe('SelectMenu', () => {
  it('renderiza el menú en un portal y selecciona una opción habilitada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <div className="overflow-hidden">
        <SelectMenu
          ariaLabel="Estado de despacho"
          value="PENDING"
          onChange={onChange}
          options={[
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'IN_TRANSIT', label: 'En tránsito' },
          ]}
        />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: 'Estado de despacho' }));
    const listbox = screen.getByRole('listbox', {
      name: 'Estado de despacho',
    });
    expect(container.contains(listbox)).toBe(false);
    await user.click(screen.getByRole('option', { name: 'En tránsito' }));
    expect(onChange).toHaveBeenCalledWith('IN_TRANSIT');
  });

  it('impide seleccionar transiciones deshabilitadas', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectMenu
        ariaLabel="Estado de despacho"
        value="PENDING"
        onChange={onChange}
        options={[
          { value: 'PENDING', label: 'Pendiente' },
          { value: 'DELIVERED', label: 'Entregado', disabled: true },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Estado de despacho' }));
    const delivered = screen.getByRole('option', { name: 'Entregado' });
    expect(delivered).toBeDisabled();
    await user.click(delivered);
    expect(onChange).not.toHaveBeenCalled();
  });
});
