import './MaterialIcon.css'

/**
 * Material Symbols Outlined icon component.
 * @param {object} props
 * @param {string} props.icon - Icon name (e.g. "play_circle")
 * @param {boolean} [props.filled] - Whether to use filled variant
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.size] - Font size override
 * @param {object} [props.style] - Inline style overrides
 */
export default function MaterialIcon({ icon, filled = false, className = '', size, style = {} }) {
  const iconStyle = { ...style }
  if (size) iconStyle.fontSize = size

  if (filled) {
    iconStyle.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
  }

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={iconStyle}
    >
      {icon}
    </span>
  )
}
