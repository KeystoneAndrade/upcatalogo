'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const storeName = formData.get('storeName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const whatsapp = formData.get('whatsapp') as string

    const supabase = createClient()

    // 1. Create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      toast.error('Erro ao criar conta')
      setLoading(false)
      return
    }

    // 2. Create tenant
    const subdomain = slugify(storeName)
    const { error: tenantError } = await supabase.from('tenants').insert({
      name: storeName,
      subdomain,
      slug: subdomain,
      owner_id: authData.user.id,
      whatsapp: whatsapp || null,
    })

    if (tenantError) {
      toast.error('Erro ao criar loja. Tente outro nome.')
      setLoading(false)
      return
    }

    toast.success('Conta criada com sucesso!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Store className="h-10 w-10 text-blue-600" />
        </div>
        <CardTitle>Criar sua loja</CardTitle>
        <CardDescription>Comece a vender em minutos</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Nome da loja</Label>
            <Input
              id="storeName"
              name="storeName"
              placeholder="Minha Loja"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              placeholder="11999999999"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar minha loja
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Ja tem uma conta?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
