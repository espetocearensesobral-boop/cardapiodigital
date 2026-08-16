export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean;
          created_at: string;
          emoji: string;
          id: string;
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          emoji?: string;
          id: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          emoji?: string;
          id?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      global_addons: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          name: string;
          price: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id: string;
          name: string;
          price: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name?: string;
          price?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          addons: Json;
          available: boolean;
          badge: string | null;
          category: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          name: string;
          price: number;
          sort_order: number;
        };
        Insert: {
          addons?: Json;
          available?: boolean;
          badge?: string | null;
          category: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          name: string;
          price: number;
          sort_order?: number;
        };
        Update: {
          addons?: Json;
          available?: boolean;
          badge?: string | null;
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          name?: string;
          price?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      staff_users: {
        Row: {
          created_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          accepting_orders: boolean;
          categories: Json;
          close_hour: number;
          currency: string;
          delivery_fee: number;
          global_addons: Json;
          id: number;
          min_order: number;
          name: string;
          open_hour: number;
          payment_methods: Json;
          tagline: string;
          timezone: string;
          updated_at: string;
          whatsapp: string;
          whatsapp_display: string;
        };
        Insert: {
          accepting_orders?: boolean;
          categories?: Json;
          close_hour?: number;
          currency?: string;
          delivery_fee?: number;
          global_addons?: Json;
          id?: number;
          min_order?: number;
          name?: string;
          open_hour?: number;
          payment_methods?: Json;
          tagline?: string;
          timezone?: string;
          updated_at?: string;
          whatsapp?: string;
          whatsapp_display?: string;
        };
        Update: {
          accepting_orders?: boolean;
          categories?: Json;
          close_hour?: number;
          currency?: string;
          delivery_fee?: number;
          global_addons?: Json;
          id?: number;
          min_order?: number;
          name?: string;
          open_hour?: number;
          payment_methods?: Json;
          tagline?: string;
          timezone?: string;
          updated_at?: string;
          whatsapp?: string;
          whatsapp_display?: string;
        };
        Relationships: [];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          note: string | null;
          order_id: string;
          status: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id: string;
          status: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          cancelled_at: string | null;
          change_for: string | null;
          client_order_id: string | null;
          code: string;
          complement: string | null;
          created_at: string;
          completed_at: string | null;
          customer_name: string;
          delivery_fee: number;
          id: string;
          items: Json;
          neighborhood: string | null;
          notes: string | null;
          number: string | null;
          order_type: string;
          payment_method: string | null;
          phone: string | null;
          reference: string | null;
          source: string;
          status: string;
          street: string | null;
          subtotal: number;
          table_number: string | null;
          total: number;
          updated_at: string;
        };
        Insert: {
          cancelled_at?: string | null;
          change_for?: string | null;
          client_order_id?: string | null;
          code: string;
          complement?: string | null;
          created_at?: string;
          completed_at?: string | null;
          customer_name: string;
          delivery_fee?: number;
          id?: string;
          items: Json;
          neighborhood?: string | null;
          notes?: string | null;
          number?: string | null;
          order_type: string;
          payment_method?: string | null;
          phone?: string | null;
          reference?: string | null;
          source?: string;
          status?: string;
          street?: string | null;
          subtotal: number;
          table_number?: string | null;
          total: number;
          updated_at?: string;
        };
        Update: {
          cancelled_at?: string | null;
          change_for?: string | null;
          client_order_id?: string | null;
          code?: string;
          complement?: string | null;
          created_at?: string;
          completed_at?: string | null;
          customer_name?: string;
          delivery_fee?: number;
          id?: string;
          items?: Json;
          neighborhood?: string | null;
          notes?: string | null;
          number?: string | null;
          order_type?: string;
          payment_method?: string | null;
          phone?: string | null;
          reference?: string | null;
          source?: string;
          status?: string;
          street?: string | null;
          subtotal?: number;
          table_number?: string | null;
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
