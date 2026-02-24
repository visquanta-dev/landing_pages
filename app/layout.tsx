import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Visquanta Landing Pages',
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
