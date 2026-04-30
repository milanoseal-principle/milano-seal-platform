export const metadata = {
  metadataBase: new URL('https://themilanoseal.com'),

  title: {
    default: 'The Milano Seal™ — International Document Execution & Apostille',
    template: '%s | The Milano Seal™',
  },

  description:
    'U.S. document execution and apostille coordination for international use. Attorneys, private clients, and institutions operating across jurisdictions.',

  keywords: [
    'apostille',
    'notarization',
    'international documents',
    'RON',
    'Hague Convention',
    'document execution'
  ],

  authors: [
    { name: 'Nicholas Milano', url: 'https://themilanoseal.com/founder' }
  ],

  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://themilanoseal.com',
    siteName: 'The Milano Seal™',
    title: 'The Milano Seal™ — International Document Execution',
    description:
      'U.S. document execution and apostille liaison. Precision, discretion, and procedural control for international matters.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Milano Seal™'
      }
    ]
  }
}
