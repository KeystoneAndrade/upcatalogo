// Este arquivo será gerado automaticamente pelo comando:
// npm run supabase:types
// 
// Por enquanto, este é um placeholder básico

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          subdomain: string
          custom_domain: string | null
          name: string
          slug: string
          owner_id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          whatsapp: string | null
          email: string | null
          instagram: string | null
          status: 'active' | 'suspended' | 'cancelled'
          plan: 'free' | 'basic' | 'pro' | 'enterprise'
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          category_id: string | null
          name: string
          slug: string
          description: string | null
          price: number
          compare_at_price: number | null
          cost_price: number | null
          sku: string | null
          stock_quantity: number
          manage_stock: boolean
          low_stock_alert: number
          image_url: string | null
          images: Json
          tags: string[] | null
          is_active: boolean
          featured: boolean
          variants: Json
          meta_title: string | null
          meta_description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          tenant_id: string
          order_number: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          address: Json
          subtotal: number
          shipping_cost: number
          discount: number
          total: number
          items: Json
          payment_method: string
          payment_method_type: string | null
          shipping_method: string
          shipping_zone_id: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
          customer_notes: string | null
          internal_notes: string | null
          tracking_code: string | null
          created_at: string
          updated_at: string
          confirmed_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      // Adicionar outros tipos conforme necessário...
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
