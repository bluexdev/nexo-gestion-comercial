import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('oculta el valor mientras carga y expone estado busy', () => {
    const { container } = render(
      <MetricCard loading value="S/ 9,999.00" label="Venta emitida hoy" />,
    );

    expect(screen.queryByText('S/ 9,999.00')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
