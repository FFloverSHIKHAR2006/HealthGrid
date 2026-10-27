import React from 'react';

/**
 * 21st.dev inspired ShimmerButton
 * Features sweeping radial/gradient sheen, hover elevation bloom, and click ripple.
 */
export default function ShimmerButton({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'emergency' | 'ghost' | 'outline'
  className = '',
  disabled = false,
  type = 'button',
  icon: Icon,
  size = 'md', // 'sm' | 'md' | 'lg'
  style = {},
  ...props
}) {
  const baseClass = `shimmer-btn shimmer-btn-${variant} shimmer-btn-${size} ${className}`;

  return (
    <button
      type={type}
      className={baseClass}
      onClick={onClick}
      disabled={disabled}
      style={style}
      {...props}
    >
      <span className="shimmer-sheen" aria-hidden="true" />
      {Icon && <Icon className="shimmer-btn-icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 17} />}
      <span className="shimmer-btn-content">{children}</span>
    </button>
  );
}
