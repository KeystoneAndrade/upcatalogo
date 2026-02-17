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
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subdomain: string
          custom_domain?: string | null
          name: string
          slug: string
          owner_id: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          whatsapp?: string | null
          email?: string | null
          instagram?: string | null
          status?: 'active' | 'suspended' | 'cancelled'
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          meta_title?: string | null
          meta_description?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subdomain?: string
          custom_domain?: string | null
          name?: string
          slug?: string
          owner_id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          whatsapp?: string | null
          email?: string | null
          instagram?: string | null
          status?: 'active' | 'suspended' | 'cancelled'
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          meta_title?: string | null
          meta_description?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          tenant_id: string
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          price: number
          compare_at_price?: number | null
          cost_price?: number | null
          sku?: string | null
          stock_quantity?: number
          manage_stock?: boolean
          low_stock_alert?: number
          image_url?: string | null
          images?: Json
          tags?: string[] | null
          is_active?: boolean
          featured?: boolean
          variants?: Json
          meta_title?: string | null
          meta_description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          category_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          price?: number
          compare_at_price?: number | null
          cost_price?: number | null
          sku?: string | null
          stock_quantity?: number
          manage_stock?: boolean
          low_stock_alert?: number
          image_url?: string | null
          images?: Json
          tags?: string[] | null
          is_active?: boolean
          featured?: boolean
          variants?: Json
          meta_title?: string | null
          meta_description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      shipping_zones: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          neighborhoods: string[] | null
          zipcodes: string[] | null
          cep_start: string | null
          cep_end: string | null
          price: number
          free_shipping_threshold: number | null
          delivery_time_min: number | null
          delivery_time_max: number | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null

          neighborhoods?: string[] | null
          zipcodes?: string[] | null
          cep_start?: string | null
          cep_end?: string | null
          price: number
          free_shipping_threshold?: number | null
          delivery_time_min?: number | null
          delivery_time_max?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null

          neighborhoods?: string[] | null
          zipcodes?: string[] | null
          cep_start?: string | null
          cep_end?: string | null
          price?: number
          free_shipping_threshold?: number | null
          delivery_time_min?: number | null
          delivery_time_max?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          tenant_id: string
          name: string
          type: 'pix' | 'money' | 'card' | 'transfer' | 'other'
          icon: string | null
          instructions: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          type: 'pix' | 'money' | 'card' | 'transfer' | 'other'
          icon?: string | null
          instructions?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          type?: 'pix' | 'money' | 'card' | 'transfer' | 'other'
          icon?: string | null
          instructions?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
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
          shipping_method_id: string | null
          coupon_code: string | null
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
        Insert: {
          id?: string
          tenant_id: string
          order_number?: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          address: Json
          subtotal: number
          shipping_cost?: number
          discount?: number
          total: number
          items: Json
          payment_method: string
          payment_method_type?: string | null
          shipping_method: string
          shipping_zone_id?: string | null
          shipping_method_id?: string | null
          coupon_code?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
          customer_notes?: string | null
          internal_notes?: string | null
          tracking_code?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          order_number?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          address?: Json
          subtotal?: number
          shipping_cost?: number
          discount?: number
          total?: number
          items?: Json
          payment_method?: string
          payment_method_type?: string | null
          shipping_method?: string
          shipping_zone_id?: string | null
          shipping_method_id?: string | null
          coupon_code?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
          customer_notes?: string | null
          internal_notes?: string | null
          tracking_code?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
      }
      banners: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          image_url: string
          link_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          description?: string | null
          image_url: string
          link_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          description?: string | null
          image_url?: string
          link_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      shipping_zone_ranges: {
        Row: {
          id: string
          zone_id: string
          cep_start: string
          cep_end: string
          created_at: string
        }
        Insert: {
          id?: string
          zone_id: string
          cep_start: string
          cep_end: string
          created_at?: string
        }
        Update: {
          id?: string
          zone_id?: string
          cep_start?: string
          cep_end?: string
          created_at?: string
        }
      }
      shipping_methods: {
        Row: {
          id: string
          zone_id: string
          name: string
          price: number
          free_shipping_threshold: number | null
          delivery_time_min: number | null
          delivery_time_max: number | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          zone_id: string
          name: string
          price: number
          free_shipping_threshold?: number | null
          delivery_time_min?: number | null
          delivery_time_max?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          zone_id?: string
          name?: string
          price?: number
          free_shipping_threshold?: number | null
          delivery_time_min?: number | null
          delivery_time_max?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          tenant_id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_purchase_amount: number | null
          max_usage_limit: number | null
          usage_count: number
          expiration_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_purchase_amount?: number | null
          max_usage_limit?: number | null
          usage_count?: number
          expiration_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          min_purchase_amount?: number | null
          max_usage_limit?: number | null
          usage_count?: number
          expiration_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      order_history: {
        Row: {
          id: string
          tenant_id: string
          order_id: string
          user_id: string | null
          type: string
          description: string
          metadata: Json
          is_customer_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          order_id: string
          user_id?: string | null
          type: string
          description: string
          metadata?: Json
          is_customer_visible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          order_id?: string
          user_id?: string | null
          type?: string
          description?: string
          metadata?: Json
          is_customer_visible?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
