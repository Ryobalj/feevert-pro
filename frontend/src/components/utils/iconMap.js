// components/utils/iconMap.js

/**
 * ============================================================
 * ICON MAP - Centralized Icon Management for FeeVert App
 * ============================================================
 * 
 * This file serves as the SINGLE SOURCE OF TRUTH for all icons
 * used across the application.
 * 
 * Format: :icon_name: → Emoji / FontAwesome / SVG
 * 
 * Usage:
 *   import { getIcon } from '@/components/utils/iconMap';
 *   import Icon from '@/components/ui/Icon';
 * 
 *   // Get icon string
 *   const icon = getIcon(':bee:'); // Returns '🐝'
 * 
 *   // Render icon component
 *   <Icon name=":bee:" size="text-2xl" className="text-emerald-400" />
 * ============================================================
 */

// ============================================================
// ICON MAP - All icons in one place
// ============================================================

export const ICON_MAP = {
  // ========== 🐝 BEEKEEPING ICONS ==========
  ':bee:': '🐝',
  ':home:': '🏠',
  ':tools:': '🛠️',
  ':honey:': '🍯',
  ':books:': '📚',
  ':sunflower:': '🌻',
  ':clipboard:': '📋',
  ':chart:': '📊',
  ':honeyjar:': '🍯',
  ':beeswax:': '🕯️',
  ':propolis:': '💊',
  ':royaljelly:': '💎',
  ':beevenom:': '💉',
  ':beehive:': '🏠',
  ':queenbee:': '👑🐝',

  // ========== 🌿 ENVIRONMENTAL ICONS ==========
  ':leaf:': '🌿',
  ':search:': '🔍',
  ':recycle:': '♻️',
  ':globe:': '🌍',
  ':map:': '🗺️',
  ':scroll:': '📜',
  ':warning:': '⚠️',
  ':graduate:': '🎓',
  ':detective:': '🔎',
  ':water:': '💧',
  ':air:': '🌬️',
  ':soil:': '🧪',
  ':biodiversity:': '🦋',
  ':forest:': '🌳',
  ':climate:': '🌡️',
  ':carbon:': '🌍',
  ':certificate:': '📜',
  ':sustainability:': '♻️',

  // ========== 🛡️ OHS ICONS ==========
  ':shield:': '🛡️',
  ':helmet:': '⛑️',
  ':fire:': '🔥',
  ':ambulance:': '🚑',
  ':emergency:': '🚨',
  ':construction:': '🏗️',
  ':safety:': '🦺',
  ':ppe:': '🦺',
  ':hardhat:': '⛑️',
  ':gloves:': '🧤',
  ':mask:': '😷',
  ':earprotection:': '🔇',
  ':firstaid:': '🏥',
  ':fireextinguisher:': '🧯',
  ':evacuation:': '🚪',

  // ========== 💎 ABOUT SECTION ICONS ==========
  ':diamond:': '💎',
  ':handshake:': '🤝',
  ':star:': '⭐',
  ':lightbulb:': '💡',
  ':team:': '👥',
  ':lightning:': '⚡',
  ':money:': '💰',
  ':check:': '✅',
  ':link:': '🔗',
  ':smile:': '😊',
  ':calendar:': '📅',

  // ========== 🎯 GENERAL ICONS ==========
  ':target:': '🎯',
  ':rocket:': '🚀',
  ':gear:': '⚙️',
  ':clock:': '⏰',
  ':phone:': '📞',
  ':email:': '✉️',
  ':location:': '📍',

  // ========== 💼 BUSINESS ICONS ==========
  ':briefcase:': '💼',
  ':leadership:': '👔',
  ':growth:': '📈',
  ':profit:': '💰',

  // ========== 🧑‍💼 SERVICE ICONS ==========
  ':consulting:': '🧑‍💼',
  ':training:': '📖',
  ':audit:': '📋',
  ':inspection:': '🔎',
  ':monitoring:': '📊',
  ':reporting:': '📄',
  ':planning:': '🗂️',

  // ========== 📁 ADDITIONAL ICONS ==========
  ':document:': '📄',
  ':folder:': '📁',
  ':database:': '🗄️',
  ':server:': '🖥️',
  ':cloud:': '☁️',
  ':mobile:': '📱',
  ':payment:': '💳',
  ':award:': '🏆',
  ':medal:': '🥇',
};

// ============================================================
// CONSTANTS
// ============================================================

export const DEFAULT_ICON = '📌';
export const ICON_CATEGORIES = {
  BEEKEEPING: 'beekeeping',
  ENVIRONMENTAL: 'environmental',
  OHS: 'ohs',
  ABOUT: 'about',
  GENERAL: 'general',
  BUSINESS: 'business',
  SERVICE: 'service',
  ADDITIONAL: 'additional',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get icon by name
 * @param {string} icon - Icon name in format :icon_name:
 * @param {string} fallback - Fallback icon if not found
 * @returns {string} - The icon (emoji or FontAwesome class)
 */
export const getIcon = (icon, fallback = DEFAULT_ICON) => {
  if (!icon || typeof icon !== 'string') return fallback;
  return ICON_MAP[icon] || fallback;
};

/**
 * Check if icon is an emoji
 * @param {string} icon - The icon to check
 * @returns {boolean} - True if icon is an emoji
 */
export const isEmoji = (icon) => {
  if (!icon || typeof icon !== 'string') return false;
  return icon.length === 1 || icon.codePointAt(0) > 127;
};

/**
 * Get icon category based on name
 * @param {string} icon - Icon name in format :icon_name:
 * @returns {string} - Category name
 */
export const getIconCategory = (icon) => {
  if (!icon) return ICON_CATEGORIES.GENERAL;
  
  const categories = {
    [ICON_CATEGORIES.BEEKEEPING]: [
      ':bee:', ':home:', ':tools:', ':honey:', ':books:', ':sunflower:',
      ':clipboard:', ':chart:', ':honeyjar:', ':beeswax:', ':propolis:',
      ':royaljelly:', ':beevenom:', ':beehive:', ':queenbee:'
    ],
    [ICON_CATEGORIES.ENVIRONMENTAL]: [
      ':leaf:', ':search:', ':recycle:', ':globe:', ':map:', ':scroll:',
      ':warning:', ':graduate:', ':detective:', ':water:', ':air:', ':soil:',
      ':biodiversity:', ':forest:', ':climate:', ':carbon:', ':certificate:',
      ':sustainability:'
    ],
    [ICON_CATEGORIES.OHS]: [
      ':shield:', ':helmet:', ':fire:', ':ambulance:', ':emergency:',
      ':construction:', ':safety:', ':ppe:', ':hardhat:', ':gloves:', ':mask:',
      ':earprotection:', ':firstaid:', ':fireextinguisher:', ':evacuation:'
    ],
    [ICON_CATEGORIES.ABOUT]: [
      ':diamond:', ':handshake:', ':star:', ':lightbulb:', ':team:',
      ':lightning:', ':money:', ':check:', ':link:', ':smile:', ':calendar:'
    ],
    [ICON_CATEGORIES.BUSINESS]: [
      ':briefcase:', ':leadership:', ':growth:', ':profit:'
    ],
    [ICON_CATEGORIES.SERVICE]: [
      ':consulting:', ':training:', ':audit:', ':inspection:',
      ':monitoring:', ':reporting:', ':planning:'
    ],
    [ICON_CATEGORIES.ADDITIONAL]: [
      ':document:', ':folder:', ':database:', ':server:', ':cloud:',
      ':mobile:', ':payment:', ':award:', ':medal:'
    ],
  };

  for (const [category, icons] of Object.entries(categories)) {
    if (icons.includes(icon)) return category;
  }
  
  return ICON_CATEGORIES.GENERAL;
};

/**
 * Get all icons in a specific category
 * @param {string} category - Category name
 * @returns {object} - Object of icons in that category
 */
export const getIconsByCategory = (category) => {
  const entries = Object.entries(ICON_MAP);
  const result = {};
  
  for (const [key, value] of entries) {
    if (getIconCategory(key) === category) {
      result[key] = value;
    }
  }
  
  return result;
};

/**
 * Convert emoji to :icon_name: format
 * @param {string} emoji - The emoji to convert
 * @returns {string} - The icon name in :icon_name: format
 */
export const emojiToIconName = (emoji) => {
  const entries = Object.entries(ICON_MAP);
  for (const [key, value] of entries) {
    if (value === emoji) return key;
  }
  return emoji;
};

/**
 * Get all icon names
 * @returns {string[]} - Array of all icon names
 */
export const getAllIconNames = () => Object.keys(ICON_MAP);

/**
 * Get all icon values
 * @returns {string[]} - Array of all icon values
 */
export const getAllIconValues = () => Object.values(ICON_MAP);

/**
 * Check if icon exists
 * @param {string} icon - Icon name to check
 * @returns {boolean} - True if icon exists
 */
export const hasIcon = (icon) => Boolean(icon && ICON_MAP[icon]);

// ============================================================
// ICON CATEGORY EXPORTS
// ============================================================

export const BEEKEEPING_ICONS = getIconsByCategory(ICON_CATEGORIES.BEEKEEPING);
export const ENVIRONMENTAL_ICONS = getIconsByCategory(ICON_CATEGORIES.ENVIRONMENTAL);
export const OHS_ICONS = getIconsByCategory(ICON_CATEGORIES.OHS);
export const ABOUT_ICONS = getIconsByCategory(ICON_CATEGORIES.ABOUT);
export const GENERAL_ICONS = getIconsByCategory(ICON_CATEGORIES.GENERAL);
export const BUSINESS_ICONS = getIconsByCategory(ICON_CATEGORIES.BUSINESS);
export const SERVICE_ICONS = getIconsByCategory(ICON_CATEGORIES.SERVICE);
export const ADDITIONAL_ICONS = getIconsByCategory(ICON_CATEGORIES.ADDITIONAL);

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default ICON_MAP;