import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

describe('DataTable', () => {
  it('muestra filas skeleton durante la carga', () => {
    type Row = { name: string; status: string };
    const { container } = render(
      <DataTable<Row>
        rows={[]}
        columns={[
          { key: 'name', label: 'Nombre', render: (row) => row.name },
          { key: 'status', label: 'Estado', render: (row) => row.status },
        ]}
        search=""
        onSearch={vi.fn()}
        page={1}
        totalPages={1}
        onPage={vi.fn()}
        loading
      />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Cargando fila')).toHaveLength(5);
    expect(screen.queryByText('Sin registros')).not.toBeInTheDocument();
  });

  it('expone filtros y alterna el orden de una columna', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(
      <DataTable
        rows={[{ id: '1', name: 'Producto A' }]}
        columns={[
          {
            key: 'name',
            label: 'Nombre',
            sortKey: 'name',
            render: (row) => row.name,
          },
        ]}
        search=""
        onSearch={vi.fn()}
        page={1}
        totalPages={1}
        onPage={vi.fn()}
        filters={<button type="button">Filtro activo</button>}
        sortBy="name"
        sortOrder="asc"
        onSort={onSort}
      />,
    );

    expect(screen.getByRole('button', { name: 'Filtro activo' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ordenar por Nombre' }));
    expect(onSort).toHaveBeenCalledWith('name', 'desc');
  });
});
