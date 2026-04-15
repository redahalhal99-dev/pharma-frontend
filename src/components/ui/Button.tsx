import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRepeat } from 'react-bootstrap-icons';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', isLoading, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-600': variant === 'default',
            'border border-border bg-surface hover:bg-slate-50 text-textMain focus-visible:ring-slate-400': variant === 'outline',
            'hover:bg-slate-100 text-textMain focus-visible:ring-slate-400': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500': variant === 'danger',
            'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 focus-visible:ring-green-500': variant === 'success',
            'h-10 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-12 rounded-lg px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {isLoading && <ArrowRepeat className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
