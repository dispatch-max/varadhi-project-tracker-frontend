import './globals.css'
import { Providers } from '@/components/shared/providers'

export const metadata = {
  title: {
    default: 'Varadhi Tracker',
    template: '%s | Varadhi Tracker',
  },
  description: 'Internal project and task tracker for the Varadhi team',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}