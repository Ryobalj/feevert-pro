import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  rounded = false,
  block = false,
  loading = false,
  icon = null,
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    liquid: 'btn-liquid',
    glass: 'btn-glass',
    ghost: 'btn-ghost',
    gradient: 'btn-gradient',
    danger: 'btn-danger',
    success: 'btn-success',
    warning: 'btn-warning',
  }

  const sizes = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl',
  }

  const classes = [
    'btn',
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    rounded ? 'btn-rounded' : '',
    block ? 'btn-block' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {icon && <span className="btn-icon-left">{icon}</span>}
      {children}
    </button>
  )
}

export default Button