import { createClient } from '@/lib/supabase/server'
import { BannerSlider } from '@/components/storefront/banner-slider'
import { ProductsList } from '@/components/storefront/products-list'

interface StorefrontHomeProps {
  tenantId: string
}

export async function StorefrontHome({ tenantId }: StorefrontHomeProps) {
  const supabase = createClient()

  // Fetch active banners
  const { data: banners } = await supabase
    .from('banners')
    .select('id, title, description, image_url, link_url, open_in_new_tab')
    .eq('loja_id', tenantId)
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="space-y-8">
      {/* Banner slider */}
      {banners && banners.length > 0 && (
        <BannerSlider banners={banners} />
      )}

      {/* Products list */}
      <ProductsList />
    </div>
  )
}
