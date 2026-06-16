import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './useTheme';

function Consumer() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>{theme}</button>;
}

describe('ThemeProvider', () => {
  it('persiste el cambio de tema', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    fireEvent.click(screen.getByText('dark'));
    expect(screen.getByText('light')).toBeInTheDocument();
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
