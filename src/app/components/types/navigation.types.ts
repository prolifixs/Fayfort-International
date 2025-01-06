import { ReactNode } from 'react'

export interface NavItem {
  label: string
  path: string
  roles: ('admin' | 'customer' | 'supplier')[]
  icon?: ReactNode
}

export interface NavSection {
  title?: string
  items: NavItem[]
}