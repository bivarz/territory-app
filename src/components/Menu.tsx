import { ReactNode } from 'react'
import './Menu.css'

interface MenuProps {
  children: ReactNode
}

export default function Menu({ children }: MenuProps) {
  return (
    <div className="menu-container">
      {children}
    </div>
  )
}

