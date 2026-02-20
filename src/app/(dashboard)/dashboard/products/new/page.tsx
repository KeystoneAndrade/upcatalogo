import { ProductForm } from '@/components/dashboard/products/product-form'
import { createClient } from '@/lib/supabase/server'

export default async function NewProductPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: tenant } = await supabase
    .from('lojas')
    .select('id')
    .eq('proprietario_id', session!.user.id)
    .single()

  const { data: categories } = await supabase
    .from('categorias')
    .select('*')
    .eq('loja_id', tenant!.id)
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Produto</h1>
      <ProductForm tenantId={tenant!.id} categories={categories || []} />
    </div>
  )
}
