import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ops Agent — Rudy',
  description: 'Personal operations command center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F9FAFB' }}>
        {children}
      </body>
    </html>
  )
}
