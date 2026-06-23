// components/ui/Icon.jsx

import React, { memo } from 'react';
import { getIcon, isEmoji, DEFAULT_ICON } from '../utils/iconMap';

/**
 * Icon Component - Reusable icon renderer
 * 
 * @component
 * @param {object} props
 * @param {string} props.name - Icon name in format :icon_name:
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Text size (text-base, text-xl, etc.)
 * @param {string} props.fallback - Fallback icon if not found
 * @param {string} props.ariaLabel - Accessibility label
 * @returns {JSX.Element} - Rendered icon
 * 
 * @example
 * // Basic usage
 * <Icon name=":bee:" />
 * 
 * // With custom size and color
 * <Icon name=":leaf:" size="text-2xl" className="text-emerald-400" />
 * 
 * // With fallback
 * <Icon name=":unknown:" fallback="❓" />
 */
export const Icon = memo(({
  name,
  className = '',
  size = 'text-base',
  fallback = DEFAULT_ICON,
  ariaLabel,
  ...rest
}) => {
  const icon = getIcon(name, fallback);
  const isEmojiIcon = isEmoji(icon);
  const label = ariaLabel || name?.replace(/:/g, '') || 'icon';

  if (isEmojiIcon) {
    return (
      <span
        className={`inline-block ${size} ${className}`}
        role="img"
        aria-label={label}
        {...rest}
      >
        {icon}
      </span>
    );
  }

  // If it's a string (could be FontAwesome class or URL)
  return (
    <span
      className={`inline-block ${className}`}
      aria-label={label}
      {...rest}
    >
      {icon}
    </span>
  );
});

Icon.displayName = 'Icon';

export default Icon;