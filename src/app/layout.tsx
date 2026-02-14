import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'UP Catalogo - Sua loja online em minutos',
    template: '%s | UP Catalogo',
  },
  description:
    'Crie seu catalogo digital e venda pelo WhatsApp de forma profissional',
  keywords: ['catalogo digital', 'loja online', 'whatsapp', 'ecommerce'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://upcatalogo.com.br',
    title: 'UP Catalogo',
    description: 'Crie seu catalogo digital e venda pelo WhatsApp',
    siteName: 'UP Catalogo',
  },
  robots: { index: true, follow: true },
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
