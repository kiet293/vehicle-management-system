import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const sizeStyle = size === 'sm' 
    ? { padding: '0.375rem 0.75rem', fontSize: '0.75rem' }
    : size === 'lg'
    ? { padding: '0.75rem 1.5rem', fontSize: '1rem' }
    : {};

  return (
    <button
      className={`btn ${variantClass} ${className}`}
      style={sizeStyle}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="pulse-dot" /> Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
