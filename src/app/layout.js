import './globals.css'
import { Providers } from '@/components/shared/providers'

export const metadata = {
  title: {
    default: 'Varadhi Tracker',
    template: '%s | Varadhi Tracker',
  },
  description: 'Internal project and task tracker for the Varadhi team',
  applicationName: 'Varadhi',
  // Next serves this from src/app/manifest.js at /manifest.webmanifest.
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Varadhi',
    // Content sits under the status bar so the app fills the screen; paired
    // with viewportFit: 'cover' below.
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  other: {
    // Next 16 emits only the standardised `mobile-web-app-capable` for
    // appleWebApp.capable. Older iOS versions honour just the apple-prefixed
    // form, and without it an "Add to Home Screen" launch opens in Safari
    // chrome rather than standalone. Both are harmless together.
    'apple-mobile-web-app-capable': 'yes',
  },
}

// Must be a separate export in the App Router — themeColor inside `metadata`
// is deprecated and silently ignored.
export const viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  // Lets the standalone window paint into the safe areas on notched devices.
  viewportFit: 'cover',
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