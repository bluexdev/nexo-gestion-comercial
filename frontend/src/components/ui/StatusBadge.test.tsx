import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('muestra el estado recibido con semántica de éxito', () => {
    render(<StatusBadge status="RECEIVED" />);
    expect(screen.getByText('RECEIVED')).toHaveClass('text-success');
  });

  it('muestra el estado parcial con semántica de advertencia', () => {
    render(<StatusBadge status="PARTIAL" />);
    expect(screen.getByText('PARTIAL')).toHaveClass('text-warning');
  });
});
