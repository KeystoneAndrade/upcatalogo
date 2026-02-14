import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'UP Catálogo - Sua loja online em minutos',
    template: '%s | UP Catálogo',
  },
  description: 'Crie seu catálogo digital e venda pelo WhatsApp de forma profissional',
  keywords: ['catálogo digital', 'loja online', 'whatsapp', 'ecommerce'],
  authors: [{ name: 'UP Catálogo' }],
  creator: 'UP Catálogo',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://upcatalogo.com.br',
    title: 'UP Catálogo',
    description: 'Crie seu catálogo digital e venda pelo WhatsApp',
    siteName: 'UP Catálogo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UP Catálogo',
    description: 'Crie seu catálogo digital e venda pelo WhatsApp',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
