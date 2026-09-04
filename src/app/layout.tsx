import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Landed — Sourcing at the Canton Fair and Beyond | FayFay',
  description: 'The practical guide to buying from Chinese factories, verifying suppliers, shipping goods, and calculating your true landed cost.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
