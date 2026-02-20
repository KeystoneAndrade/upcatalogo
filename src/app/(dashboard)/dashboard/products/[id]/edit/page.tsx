import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/dashboard/products/product-form'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: tenant } = await supabase
    .from('lojas')
    .select('id')
    .eq('proprietario_id', session!.user.id)
    .single()

  const { data: product } = await supabase
    .from('produtos')
    .select('*, produtos_variacoes(*)')
    .eq('id', params.id)
    .eq('loja_id', tenant!.id)
    .single()

  if (!product) notFound()

  const { data: categories } = await supabase
    .from('categorias')
    .select('*')
    .eq('loja_id', tenant!.id)
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Produto</h1>
      <ProductForm tenantId={tenant!.id} categories={categories || []} product={product} />
    </div>
  )
}
