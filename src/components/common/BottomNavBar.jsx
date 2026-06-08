import './BottomNavBar.css'
import MaterialIcon from './MaterialIcon.jsx'

/**
 * Mobile-only bottom navigation bar.
 * @param {object} props
 * @param {string} [props.activeItem] - Active navigation item name
 */
export default function BottomNavBar({ activeItem = 'machines' }) {
  const navItems = [
    { id: 'inventory', icon: 'inventory_2', label: 'Inventory' },
    { id: 'machines', icon: 'precision_manufacturing', label: 'Machines', filled: true },
    { id: 'research', icon: 'science', label: 'Research' },
    { id: 'map', icon: 'map', label: 'Map' },
  ]

  return (
    <nav className="bottom-nav pixel-border-top">
      {navItems.map((item) => (
        <a
          key={item.id}
          href="#"
          className={`bottom-nav__item font-label-tech ${
            item.id === activeItem ? 'bottom-nav__item--active' : ''
          }`}
        >
          <MaterialIcon
            icon={item.icon}
            filled={item.id === activeItem}
            className="bottom-nav__icon"
          />
          <span className="bottom-nav__label">{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
