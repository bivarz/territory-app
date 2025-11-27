import { Navigation } from 'lucide-react'
import './GPSButton.css'

interface GPSButtonProps {
  isActive: boolean
  onToggle: () => void
}

export default function GPSButton({ isActive, onToggle }: GPSButtonProps) {
  return (
    <button
      className={`gps-button ${isActive ? 'active' : ''}`}
      onClick={onToggle}
      title={isActive ? 'Desativar localização GPS' : 'Ativar localização GPS'}
    >
      <Navigation size={18} />
    </button>
  )
}

