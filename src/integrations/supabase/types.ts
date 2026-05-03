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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      daily_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["daily_post_kind"]
          published: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["daily_post_kind"]
          published?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["daily_post_kind"]
          published?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          pinned_at: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          pinned_at?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          pinned_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "global_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      message_flags: {
        Row: {
          created_at: string
          flagged_by: string
          id: string
          message_id: string
          reason: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flagged_by: string
          id?: string
          message_id: string
          reason: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flagged_by?: string
          id?: string
          message_id?: string
          reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_flags_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "global_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          match_id: string
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          match_id: string
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          match_id?: string
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_cadastro_matches: {
        Row: {
          created_at: string
          created_by: string
          id: string
          internal_notes: string | null
          partner_age: number | null
          partner_children_count: number | null
          partner_church: string | null
          partner_city: string | null
          partner_full_name: string | null
          partner_has_children: boolean | null
          partner_height_cm: number | null
          partner_marital: string | null
          partner_pre_cadastro_id: string | null
          partner_sex: string | null
          partner_state: string | null
          partner_user_id: string | null
          partner_username: string | null
          pre_cadastro_id: string
          status: Database["public"]["Enums"]["couple_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          internal_notes?: string | null
          partner_age?: number | null
          partner_children_count?: number | null
          partner_church?: string | null
          partner_city?: string | null
          partner_full_name?: string | null
          partner_has_children?: boolean | null
          partner_height_cm?: number | null
          partner_marital?: string | null
          partner_pre_cadastro_id?: string | null
          partner_sex?: string | null
          partner_state?: string | null
          partner_user_id?: string | null
          partner_username?: string | null
          pre_cadastro_id: string
          status?: Database["public"]["Enums"]["couple_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          internal_notes?: string | null
          partner_age?: number | null
          partner_children_count?: number | null
          partner_church?: string | null
          partner_city?: string | null
          partner_full_name?: string | null
          partner_has_children?: boolean | null
          partner_height_cm?: number | null
          partner_marital?: string | null
          partner_pre_cadastro_id?: string | null
          partner_sex?: string | null
          partner_state?: string | null
          partner_user_id?: string | null
          partner_username?: string | null
          pre_cadastro_id?: string
          status?: Database["public"]["Enums"]["couple_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_cadastro_matches_partner_pre_cadastro_id_fkey"
            columns: ["partner_pre_cadastro_id"]
            isOneToOne: false
            referencedRelation: "pre_cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_cadastro_matches_pre_cadastro_id_fkey"
            columns: ["pre_cadastro_id"]
            isOneToOne: false
            referencedRelation: "pre_cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_cadastros: {
        Row: {
          accepts_partner_with_children: boolean | null
          age: number | null
          bio: string | null
          children_count: number | null
          church: string | null
          city: string | null
          created_at: string
          created_by: string
          email: string | null
          full_name: string | null
          has_children: boolean | null
          height_cm: number | null
          id: string
          marital: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          pref_accepts_children: boolean | null
          pref_age_max: number | null
          pref_age_min: number | null
          pref_custom_states: string[] | null
          pref_desired_quality: string | null
          pref_distance_ok: boolean | null
          pref_location_scope: string | null
          pref_looking_for_bio: string | null
          sex: string | null
          state: string | null
          tiktok_user: string | null
          updated_at: string
          years_baptized: number | null
        }
        Insert: {
          accepts_partner_with_children?: boolean | null
          age?: number | null
          bio?: string | null
          children_count?: number | null
          church?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          full_name?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          id?: string
          marital?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          pref_accepts_children?: boolean | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_custom_states?: string[] | null
          pref_desired_quality?: string | null
          pref_distance_ok?: boolean | null
          pref_location_scope?: string | null
          pref_looking_for_bio?: string | null
          sex?: string | null
          state?: string | null
          tiktok_user?: string | null
          updated_at?: string
          years_baptized?: number | null
        }
        Update: {
          accepts_partner_with_children?: boolean | null
          age?: number | null
          bio?: string | null
          children_count?: number | null
          church?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          full_name?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          id?: string
          marital?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          pref_accepts_children?: boolean | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_custom_states?: string[] | null
          pref_desired_quality?: string | null
          pref_distance_ok?: boolean | null
          pref_location_scope?: string | null
          pref_looking_for_bio?: string | null
          sex?: string | null
          state?: string | null
          tiktok_user?: string | null
          updated_at?: string
          years_baptized?: number | null
        }
        Relationships: []
      }
      profile_preferences: {
        Row: {
          accepts_children: boolean
          age_max: number
          age_min: number
          created_at: string
          custom_states: string[] | null
          desired_quality: string | null
          location_scope: Database["public"]["Enums"]["location_scope"]
          looking_for_bio: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepts_children?: boolean
          age_max: number
          age_min: number
          created_at?: string
          custom_states?: string[] | null
          desired_quality?: string | null
          location_scope: Database["public"]["Enums"]["location_scope"]
          looking_for_bio?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepts_children?: boolean
          age_max?: number
          age_min?: number
          created_at?: string
          custom_states?: string[] | null
          desired_quality?: string | null
          location_scope?: Database["public"]["Enums"]["location_scope"]
          looking_for_bio?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          viewed_id: string
          viewer_age: number | null
          viewer_city: string | null
          viewer_id: string
          viewer_state: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          viewed_id: string
          viewer_age?: number | null
          viewer_city?: string | null
          viewer_id: string
          viewer_state?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          viewed_id?: string
          viewer_age?: number | null
          viewer_city?: string | null
          viewer_id?: string
          viewer_state?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          bio: string | null
          church: string
          city: string
          created_at: string
          full_name: string
          height_cm: number | null
          id: string
          marital: Database["public"]["Enums"]["marital_status"]
          photo_url: string | null
          rejection_reason: string | null
          sex: Database["public"]["Enums"]["sex_type"]
          state: string
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          years_baptized: number
        }
        Insert: {
          age: number
          bio?: string | null
          church: string
          city: string
          created_at?: string
          full_name: string
          height_cm?: number | null
          id: string
          marital: Database["public"]["Enums"]["marital_status"]
          photo_url?: string | null
          rejection_reason?: string | null
          sex: Database["public"]["Enums"]["sex_type"]
          state: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          years_baptized: number
        }
        Update: {
          age?: number
          bio?: string | null
          church?: string
          city?: string
          created_at?: string
          full_name?: string
          height_cm?: number | null
          id?: string
          marital?: Database["public"]["Enums"]["marital_status"]
          photo_url?: string | null
          rejection_reason?: string | null
          sex?: Database["public"]["Enums"]["sex_type"]
          state?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          years_baptized?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: []
      }
      restricted_words: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          word?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          badge_color: string | null
          created_at: string
          id: string
          public_listing: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          badge_color?: string | null
          created_at?: string
          id?: string
          public_listing?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          badge_color?: string | null
          created_at?: string
          id?: string
          public_listing?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_ids: { Args: never; Returns: string[] }
      get_flagged_message_ids: { Args: never; Returns: string[] }
      get_hidden_staff_ids: { Args: never; Returns: string[] }
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      mark_message_read: { Args: { _message_id: string }; Returns: undefined }
      unaccent_safe: { Args: { input: string }; Returns: string }
      unmatch: { Args: { _match_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin" | "apresentador" | "moderador"
      couple_status: "aceitaram_conversar" | "namorando" | "casamento_marcado"
      daily_post_kind: "news" | "devotional"
      location_scope: "regiao" | "brasil" | "mundo" | "personalizado"
      marital_status: "solteiro" | "divorciado"
      profile_status: "pending" | "approved" | "rejected" | "banned"
      report_status: "open" | "reviewed" | "dismissed"
      sex_type: "masculino" | "feminino"
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
    Enums: {
      app_role: ["admin", "user", "super_admin", "apresentador", "moderador"],
      couple_status: ["aceitaram_conversar", "namorando", "casamento_marcado"],
      daily_post_kind: ["news", "devotional"],
      location_scope: ["regiao", "brasil", "mundo", "personalizado"],
      marital_status: ["solteiro", "divorciado"],
      profile_status: ["pending", "approved", "rejected", "banned"],
      report_status: ["open", "reviewed", "dismissed"],
      sex_type: ["masculino", "feminino"],
    },
  },
} as const
