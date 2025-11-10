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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      invoices: {
        Row: {
          client_address: string | null
          client_email: string
          client_name: string
          created_at: string
          due_date: string
          id: number
          invoice_date: string
          invoice_number: string
          items: Json | null
          notes: string | null
          payment_date: string | null
          payment_status: string
          property_id: number
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_email: string
          client_name: string
          created_at?: string
          due_date: string
          id?: number
          invoice_date: string
          invoice_number: string
          items?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_status: string
          property_id: number
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_email?: string
          client_name?: string
          created_at?: string
          due_date?: string
          id?: number
          invoice_date?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_status?: string
          property_id?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string
          id: number
          location: string | null
          notes: string | null
          property_id: number | null
          reported_date: string
          status: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description: string
          id?: number
          location?: string | null
          notes?: string | null
          property_id?: number | null
          reported_date: string
          status: string
          title: string
          updated_at?: string
          urgency: string
          user_id: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string
          id?: number
          location?: string | null
          notes?: string | null
          property_id?: number | null
          reported_date?: string
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          amenities: Json | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          commission_rate: number | null
          created_at: string
          description: string | null
          estimated_value: number | null
          id: number
          images: Json | null
          monthly_expenses: number | null
          price: number
          property_type: string
          purchase_price: number | null
          size_sqft: number | null
          state: string
          status: string
          title: string
          updated_at: string
          user_id: string
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: number
          images?: Json | null
          monthly_expenses?: number | null
          price: number
          property_type: string
          purchase_price?: number | null
          size_sqft?: number | null
          state: string
          status: string
          title: string
          updated_at?: string
          user_id: string
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: number
          images?: Json | null
          monthly_expenses?: number | null
          price?: number
          property_type?: string
          purchase_price?: number | null
          size_sqft?: number | null
          state?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          deposit: number | null
          email: string
          id: number
          lease_end: string
          lease_start: string
          lease_status: string
          monthly_rent: number | null
          name: string
          notes: string | null
          phone: string | null
          property_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deposit?: number | null
          email: string
          id?: number
          lease_end: string
          lease_start: string
          lease_status: string
          monthly_rent?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          property_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deposit?: number | null
          email?: string
          id?: number
          lease_end?: string
          lease_start?: string
          lease_status?: string
          monthly_rent?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          property_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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

