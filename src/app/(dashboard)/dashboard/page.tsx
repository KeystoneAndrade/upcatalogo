import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getTenant } from '@/services/tenant-service'

export default async function DashboardPage() {
  const supabase = createClient()
  const tenant = await getTenant(supabase)
  const tenantId = tenant.id

  const [productsRes, ordersRes, revenueRes, recentOrdersRes] = await Promise.all([
    supabase.from('produtos').select('id', { count: 'exact' }).eq('loja_id', tenantId),
    supabase.from('pedidos').select('id', { count: 'exact' }).eq('loja_id', tenantId),
    supabase.from('pedidos').select('total').eq('loja_id', tenantId).eq('status', 'delivered'),
    supabase.from('pedidos').select('*').eq('loja_id', tenantId).order('created_at', { ascending: false }).limit(5)
  ])

  const totalProducts = productsRes.count || 0
  const totalOrders = ordersRes.count || 0
  const totalRevenue = (revenueRes.data || []).reduce((acc, o) => acc + Number(o.total), 0)
  const recentOrders = recentOrdersRes.data || []


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversao</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentOrders || recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">#{order.numero_pedido}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(order.total))}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
