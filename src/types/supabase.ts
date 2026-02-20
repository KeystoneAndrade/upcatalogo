export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          loja_id: string
          open_in_new_tab: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          loja_id: string
          open_in_new_tab?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          loja_id?: string
          open_in_new_tab?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_tenant_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          loja_id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          loja_id: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          loja_id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expiration_date: string | null
          id: string
          is_active: boolean | null
          max_usage_limit: number | null
          min_purchase_amount: number | null
          tenant_id: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          max_usage_limit?: number | null
          min_purchase_amount?: number | null
          tenant_id: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          max_usage_limit?: number | null
          min_purchase_amount?: number | null
          tenant_id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          email: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          plan: string | null
          primary_color: string | null
          proprietario_id: string
          secondary_color: string | null
          settings: Json | null
          slug: string
          status: string | null
          subdomain: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          plan?: string | null
          primary_color?: string | null
          proprietario_id: string
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          subdomain: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          plan?: string | null
          primary_color?: string | null
          proprietario_id?: string
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          subdomain?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      metodos_pagamento: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          loja_id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          loja_id: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          loja_id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_tenant_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      order_history: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_customer_visible: boolean | null
          metadata: Json | null
          order_id: string
          tenant_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_customer_visible?: boolean | null
          metadata?: Json | null
          order_id: string
          tenant_id: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_customer_visible?: boolean | null
          metadata?: Json | null
          order_id?: string
          tenant_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          attributes: Json | null
          created_at: string | null
          id: string
          image_url: string | null
          loja_id: string
          name: string
          pedido_id: string
          price_at_purchase: number
          produto_id: string | null
          quantity: number
          sku: string | null
          subtotal: number
          updated_at: string | null
          variacao_id: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          loja_id: string
          name: string
          pedido_id: string
          price_at_purchase: number
          produto_id?: string | null
          quantity: number
          sku?: string | null
          subtotal: number
          updated_at?: string | null
          variacao_id?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          loja_id?: string
          name?: string
          pedido_id?: string
          price_at_purchase?: number
          produto_id?: string | null
          quantity?: number
          sku?: string | null
          subtotal?: number
          updated_at?: string | null
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "produtos_variacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          address: Json
          cancelled_at: string | null
          confirmed_at: string | null
          coupon_code: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_notes: string | null
          customer_phone: string
          delivered_at: string | null
          discount: number | null
          id: string
          internal_notes: string | null
          items: Json
          loja_id: string
          melhor_envio_label_url: string | null
          melhor_envio_protocol: string | null
          melhor_envio_service_id: number | null
          melhor_envio_service_name: string | null
          melhor_envio_shipment_id: string | null
          melhor_envio_status: string | null
          numero_pedido: string
          payment_method: string
          payment_method_type: string | null
          shipped_at: string | null
          shipping_cost: number | null
          shipping_method: string
          shipping_method_id: string | null
          status: string | null
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string | null
          zona_entrega_id: string | null
        }
        Insert: {
          address: Json
          cancelled_at?: string | null
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_notes?: string | null
          customer_phone: string
          delivered_at?: string | null
          discount?: number | null
          id?: string
          internal_notes?: string | null
          items: Json
          loja_id: string
          melhor_envio_label_url?: string | null
          melhor_envio_protocol?: string | null
          melhor_envio_service_id?: number | null
          melhor_envio_service_name?: string | null
          melhor_envio_shipment_id?: string | null
          melhor_envio_status?: string | null
          numero_pedido: string
          payment_method: string
          payment_method_type?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_method: string
          shipping_method_id?: string | null
          status?: string | null
          subtotal: number
          total: number
          tracking_code?: string | null
          updated_at?: string | null
          zona_entrega_id?: string | null
        }
        Update: {
          address?: Json
          cancelled_at?: string | null
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string
          delivered_at?: string | null
          discount?: number | null
          id?: string
          internal_notes?: string | null
          items?: Json
          loja_id?: string
          melhor_envio_label_url?: string | null
          melhor_envio_protocol?: string | null
          melhor_envio_service_id?: number | null
          melhor_envio_service_name?: string | null
          melhor_envio_shipment_id?: string | null
          melhor_envio_status?: string | null
          numero_pedido?: string
          payment_method?: string
          payment_method_type?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_method?: string
          shipping_method_id?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
          zona_entrega_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_zone_id_fkey"
            columns: ["zona_entrega_id"]
            isOneToOne: false
            referencedRelation: "zonas_entrega"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          featured: boolean | null
          height: number | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          length: number | null
          loja_id: string
          low_stock_alert: number | null
          manage_stock: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          sku: string | null
          slug: string
          stock_quantity: number | null
          tags: string[] | null
          updated_at: string | null
          variants: Json | null
          weight: number | null
          width: number | null
        }
        Insert: {
          categoria_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          length?: number | null
          loja_id: string
          low_stock_alert?: number | null
          manage_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price: number
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
          variants?: Json | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          categoria_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          length?: number | null
          loja_id?: string
          low_stock_alert?: number | null
          manage_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          sku?: string | null
          slug?: string
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
          variants?: Json | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_variacoes: {
        Row: {
          attributes: Json | null
          compare_at_price: number | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          loja_id: string
          manage_stock: boolean | null
          name: string
          price: number
          produto_id: string
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          compare_at_price?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          loja_id: string
          manage_stock?: boolean | null
          name: string
          price: number
          produto_id: string
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          compare_at_price?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          loja_id?: string
          manage_stock?: boolean | null
          name?: string
          price?: number
          produto_id?: string
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_variacoes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_variacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          created_at: string | null
          delivery_time_max: number | null
          delivery_time_min: number | null
          display_order: number | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          display_order?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
          zone_id: string
        }
        Update: {
          created_at?: string | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          display_order?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_methods_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zonas_entrega"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zone_ranges: {
        Row: {
          cep_end: string
          cep_start: string
          created_at: string | null
          id: string
          zone_id: string
        }
        Insert: {
          cep_end: string
          cep_start: string
          created_at?: string | null
          id?: string
          zone_id: string
        }
        Update: {
          cep_end?: string
          cep_start?: string
          created_at?: string | null
          id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zone_ranges_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zonas_entrega"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_entrega: {
        Row: {
          cep_end: string | null
          cep_start: string | null
          created_at: string | null
          delivery_time_max: number | null
          delivery_time_min: number | null
          description: string | null
          display_order: number | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean | null
          loja_id: string
          name: string
          neighborhoods: string[] | null
          price: number
          updated_at: string | null
          zipcodes: string[] | null
        }
        Insert: {
          cep_end?: string | null
          cep_start?: string | null
          created_at?: string | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          description?: string | null
          display_order?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          loja_id: string
          name: string
          neighborhoods?: string[] | null
          price: number
          updated_at?: string | null
          zipcodes?: string[] | null
        }
        Update: {
          cep_end?: string | null
          cep_start?: string | null
          created_at?: string | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          description?: string | null
          display_order?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          loja_id?: string
          name?: string
          neighborhoods?: string[] | null
          price?: number
          updated_at?: string | null
          zipcodes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_tenant_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
