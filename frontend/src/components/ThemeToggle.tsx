import React from 'react';
import { useTheme } from '../context/ThemeContext.js';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
  buttonVariant?: 'ghost' | 'outline' | 'secondary';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  buttonVariant = 'ghost',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const baseVariantStyles =
    buttonVariant === 'outline'
      ? 'border border-border bg-card text-foreground hover:bg-secondary hover:text-primary'
      : buttonVariant === 'secondary'
      ? 'bg-secondary text-secondary-foreground hover:bg-accent'
      : 'text-muted-foreground hover:text-foreground hover:bg-secondary';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${baseVariantStyles} ${className}`}
    >
      <span className="sr-only">{label}</span>
      {isDark ? (
        <Moon className="h-4 w-4 shrink-0 transition-transform duration-200 rotate-0 scale-100 text-foreground" />
      ) : (
        <Sun className="h-4 w-4 shrink-0 transition-transform duration-200 rotate-0 scale-100 text-foreground" />
      )}
    </button>
  );
};
