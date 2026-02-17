import Link from 'next/link'
import { ArrowRight, Store, Smartphone, Zap } from 'lucide-react'
import { getTenant } from '@/lib/get-tenant'
import { StorefrontHome } from '@/components/storefront/home'

export default async function HomePage() {
  const tenant = await getTenant()

  // If tenant found, show storefront with banners and products
  if (tenant) {
    return <StorefrontHome tenantId={tenant.id} />
  }

  // Otherwise show landing page
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">UP Catalogo</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar minha loja
            </Link>
          </div>
        </nav>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Sua loja online em
          <span className="text-blue-600"> minutos</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Crie seu catalogo digital profissional e venda pelo WhatsApp. Sem
          mensalidade, sem complicacao.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            Comecar gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="https://demonstracao3.upcatalogo.com.br"
            target="_blank"
            className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-colors"
          >
            Ver demonstracao
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rapido e Facil</h3>
            <p className="text-gray-600">
              Configure sua loja em menos de 5 minutos. Adicione produtos,
              configure entregas e comece a vender.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">WhatsApp Integrado</h3>
            <p className="text-gray-600">
              Seus clientes finalizam o pedido e sao redirecionados direto para
              seu WhatsApp. Simples assim!
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Seu Dominio</h3>
            <p className="text-gray-600">
              Use seu proprio dominio ou um subdominio gratuito. SSL incluido em
              todos os planos.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para comecar?</h2>
          <p className="text-xl mb-8 opacity-90">
            Crie sua loja gratis agora e comece a vender hoje mesmo
          </p>
          <Link
            href="/auth/signup"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Criar minha loja gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Store className="h-6 w-6 text-blue-500" />
                <span className="text-white font-semibold">UP Catalogo</span>
              </div>
              <p className="text-sm">
                A forma mais simples de criar sua loja online e vender pelo
                WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Precos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Demonstracao
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    WhatsApp
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            <p>&copy; 2026 UP Catalogo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
