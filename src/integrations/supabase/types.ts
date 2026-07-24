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
      anonymous_hint_options: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["anonymous_hint_category"]
          created_at: string
          id: string
          text: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["anonymous_hint_category"]
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["anonymous_hint_category"]
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: []
      }
      anonymous_message_hints: {
        Row: {
          category:
            | Database["public"]["Enums"]["anonymous_hint_category"]
            | null
          created_at: string
          hint_text: string | null
          id: string
          message_id: string
          requested_at: string
          sent_at: string | null
        }
        Insert: {
          category?:
            | Database["public"]["Enums"]["anonymous_hint_category"]
            | null
          created_at?: string
          hint_text?: string | null
          id?: string
          message_id: string
          requested_at?: string
          sent_at?: string | null
        }
        Update: {
          category?:
            | Database["public"]["Enums"]["anonymous_hint_category"]
            | null
          created_at?: string
          hint_text?: string | null
          id?: string
          message_id?: string
          requested_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_message_hints_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_message_hints_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_message_hints_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_message_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reason: string
          reporter_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reason: string
          reporter_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reason?: string
          reporter_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_message_settings: {
        Row: {
          accept_anonymous: boolean
          extras_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accept_anonymous?: boolean
          extras_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accept_anonymous?: boolean
          extras_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      anonymous_messages: {
        Row: {
          closed_at: string | null
          content: string
          created_at: string
          expires_at: string
          id: string
          match_id: string | null
          receiver_id: string
          receiver_reveal_requested_at: string | null
          replied_at: string | null
          reply_text: string | null
          revealed_at: string | null
          sender_id: string
          sender_reveal_requested_at: string | null
          status: Database["public"]["Enums"]["anonymous_message_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string | null
          receiver_id: string
          receiver_reveal_requested_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          revealed_at?: string | null
          sender_id: string
          sender_reveal_requested_at?: string | null
          status?: Database["public"]["Enums"]["anonymous_message_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string | null
          receiver_id?: string
          receiver_reveal_requested_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          revealed_at?: string | null
          sender_id?: string
          sender_reveal_requested_at?: string | null
          status?: Database["public"]["Enums"]["anonymous_message_status"]
          updated_at?: string
        }
        Relationships: []
      }
      avatar_bases: {
        Row: {
          age_range: string
          body_type: string
          created_at: string
          gender: string
          head_anchor: Json | null
          id: string
          image_url: string
          is_active: boolean
          name: string
          pose_key: string
          skin_tone: string
          sort_order: number
        }
        Insert: {
          age_range?: string
          body_type?: string
          created_at?: string
          gender: string
          head_anchor?: Json | null
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          pose_key?: string
          skin_tone?: string
          sort_order?: number
        }
        Update: {
          age_range?: string
          body_type?: string
          created_at?: string
          gender?: string
          head_anchor?: Json | null
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          pose_key?: string
          skin_tone?: string
          sort_order?: number
        }
        Relationships: []
      }
      avatar_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          layer_index: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          layer_index?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          layer_index?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      avatar_decorations: {
        Row: {
          active: boolean
          created_at: string
          css_value: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_coins: number
          rarity: string
          slug: string
          sort_order: number
          type: Database["public"]["Enums"]["decoration_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          css_value?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_coins?: number
          rarity?: string
          slug: string
          sort_order?: number
          type: Database["public"]["Enums"]["decoration_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          css_value?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_coins?: number
          rarity?: string
          slug?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["decoration_type"]
          updated_at?: string
        }
        Relationships: []
      }
      avatar_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          gender: string
          id: string
          image_url: string
          is_active: boolean
          is_premium: boolean
          metadata: Json
          name: string
          price: number
          rarity: string
          sort_order: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          image_url: string
          is_active?: boolean
          is_premium?: boolean
          metadata?: Json
          name: string
          price?: number
          rarity?: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          image_url?: string
          is_active?: boolean
          is_premium?: boolean
          metadata?: Json
          name?: string
          price?: number
          rarity?: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "avatar_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          active: boolean
          code: string
          color: string
          created_at: string
          description: string
          duration_days: number | null
          id: string
          kind: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          color: string
          created_at?: string
          description: string
          duration_days?: number | null
          id?: string
          kind?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          color?: string
          created_at?: string
          description?: string
          duration_days?: number | null
          id?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      bible_quiz_questions: {
        Row: {
          active: boolean
          correct_index: number
          created_at: string
          difficulty: string
          explanation: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          question: string
          reference: string
        }
        Insert: {
          active?: boolean
          correct_index: number
          created_at?: string
          difficulty?: string
          explanation: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          question: string
          reference: string
        }
        Update: {
          active?: boolean
          correct_index?: number
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          question?: string
          reference?: string
        }
        Relationships: []
      }
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
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          direction: string
          icon_url: string | null
          id: string
          kind: string
          ref_id: string | null
          subtitle: string | null
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          direction: string
          icon_url?: string | null
          id?: string
          kind: string
          ref_id?: string | null
          subtitle?: string | null
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          direction?: string
          icon_url?: string | null
          id?: string
          kind?: string
          ref_id?: string | null
          subtitle?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      couple_time_capsules: {
        Row: {
          author_id: string
          created_at: string
          id: string
          match_id: string
          message: string
          opened_at: string | null
          unlock_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          match_id: string
          message: string
          opened_at?: string | null
          unlock_at: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          match_id?: string
          message?: string
          opened_at?: string | null
          unlock_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_time_capsules_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      community_onboarding_progress: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string
          current_step: string
          questionnaire_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          current_step: string
          questionnaire_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          current_step?: string
          questionnaire_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_posts: {
        Row: {
          author_id: string
          bible_reference: string | null
          bible_text: string | null
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
          bible_reference?: string | null
          bible_text?: string | null
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
          bible_reference?: string | null
          bible_text?: string | null
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
      dating_memberships: {
        Row: {
          activated_at: string | null
          created_at: string
          onboarding_version: string | null
          paused_at: string | null
          receive_anonymous: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          onboarding_version?: string | null
          paused_at?: string | null
          receive_anonymous?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          onboarding_version?: string | null
          paused_at?: string | null
          receive_anonymous?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devotional_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "devotional_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "devotional_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          parent_id: string | null
          pinned_at: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          pinned_at?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          pinned_at?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "devotional_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devotional_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "daily_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_prayed: {
        Row: {
          created_at: string
          day: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_prayed_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "daily_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: Database["public"]["Enums"]["devotional_reaction"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction: Database["public"]["Enums"]["devotional_reaction"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: Database["public"]["Enums"]["devotional_reaction"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "daily_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_transactions: {
        Row: {
          created_at: string
          gift_id: string
          id: string
          message: string | null
          price_paid: number
          receiver_id: string
          redeemed_at: string | null
          redeemed_coins: number | null
          sender_id: string
          status: Database["public"]["Enums"]["gift_tx_status"]
        }
        Insert: {
          created_at?: string
          gift_id: string
          id?: string
          message?: string | null
          price_paid: number
          receiver_id: string
          redeemed_at?: string | null
          redeemed_coins?: number | null
          sender_id: string
          status?: Database["public"]["Enums"]["gift_tx_status"]
        }
        Update: {
          created_at?: string
          gift_id?: string
          id?: string
          message?: string | null
          price_paid?: number
          receiver_id?: string
          redeemed_at?: string | null
          redeemed_coins?: number | null
          sender_id?: string
          status?: Database["public"]["Enums"]["gift_tx_status"]
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "virtual_gifts"
            referencedColumns: ["id"]
          },
        ]
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
          sticker_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          pinned_at?: string | null
          reply_to_id?: string | null
          sender_id: string
          sticker_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          pinned_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
          sticker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "global_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_messages_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
        ]
      }
      grab_config: {
        Row: {
          default_free_daily: number
          default_paid_cost_coins: number
          id: number
          updated_at: string
        }
        Insert: {
          default_free_daily?: number
          default_paid_cost_coins?: number
          id?: number
          updated_at?: string
        }
        Update: {
          default_free_daily?: number
          default_paid_cost_coins?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      grab_pool_cooldowns: {
        Row: {
          available_at: string
          id: string
          pool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_at: string
          id?: string
          pool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_at?: string
          id?: string
          pool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grab_pool_cooldowns_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "grab_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      grab_pool_pity: {
        Row: {
          id: string
          pool_id: string
          rolls_since_rare: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          pool_id: string
          rolls_since_rare?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          pool_id?: string
          rolls_since_rare?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grab_pool_pity_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "grab_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      grab_pool_prizes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          pool_id: string
          prize_amount: number
          prize_kind: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id: string | null
          sort_order: number
          weight: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          pool_id: string
          prize_amount?: number
          prize_kind: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id?: string | null
          sort_order?: number
          weight?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          pool_id?: string
          prize_amount?: number
          prize_kind?: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id?: string | null
          sort_order?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grab_pool_prizes_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "grab_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      grab_pools: {
        Row: {
          active: boolean
          cooldown_hours: number
          cost_coins: number | null
          created_at: string
          description: string | null
          featured_until: string | null
          free_daily_uses: number | null
          icon_key: string | null
          id: string
          name: string
          pity_threshold: number
          pity_tier: string
          rarity: string
          slug: string
          sort_order: number
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          cooldown_hours?: number
          cost_coins?: number | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          free_daily_uses?: number | null
          icon_key?: string | null
          id?: string
          name: string
          pity_threshold?: number
          pity_tier?: string
          rarity?: string
          slug: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          active?: boolean
          cooldown_hours?: number
          cost_coins?: number | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          free_daily_uses?: number | null
          icon_key?: string | null
          id?: string
          name?: string
          pity_threshold?: number
          pity_tier?: string
          rarity?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
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
      live_monthly_highlights: {
        Row: {
          chip_text: string | null
          created_at: string
          id: string
          is_active: boolean
          month: number
          name: string
          photo_url: string | null
          position: number
          ranking_type: string
          storage_path: string | null
          tiktok_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          chip_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          month: number
          name: string
          photo_url?: string | null
          position: number
          ranking_type: string
          storage_path?: string | null
          tiktok_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          chip_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          month?: number
          name?: string
          photo_url?: string | null
          position?: number
          ranking_type?: string
          storage_path?: string | null
          tiktok_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      live_team_members: {
        Row: {
          category: string
          chip_text: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          photo_url: string
          role_title: string
          sort_order: number
          storage_path: string | null
          tiktok_url: string | null
          updated_at: string
        }
        Insert: {
          category: string
          chip_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          photo_url: string
          role_title: string
          sort_order?: number
          storage_path?: string | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          chip_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string
          role_title?: string
          sort_order?: number
          storage_path?: string | null
          tiktok_url?: string | null
          updated_at?: string
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
      name_gradients: {
        Row: {
          color_a: string
          color_b: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color_a?: string
          color_b?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color_a?: string
          color_b?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          id: string
          image_url: string | null
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pet_achievements: {
        Row: {
          active: boolean
          category: string
          coin_reward: number
          created_at: string
          description: string | null
          goal: number
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          category?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          goal?: number
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          category?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          goal?: number
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      pet_album_pack_openings: {
        Row: {
          cost: number
          created_at: string
          game_id: string
          id: string
          pack_size: number
          results: Json
          user_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          game_id: string
          id?: string
          pack_size: number
          results?: Json
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          game_id?: string
          id?: string
          pack_size?: number
          results?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_album_pack_openings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "pet_arcade_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_album_rewards_claimed: {
        Row: {
          claimed_at: string
          reward_key: string
          reward_payload: Json
          user_id: string
        }
        Insert: {
          claimed_at?: string
          reward_key: string
          reward_payload?: Json
          user_id: string
        }
        Update: {
          claimed_at?: string
          reward_key?: string
          reward_payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      pet_album_stickers: {
        Row: {
          catalog_id: string
          catalog_type: string
          category_id: string | null
          category_name: string
          created_at: string
          id: string
          image_path: string
          is_active: boolean
          name: string
          rarity: string
          sort_order: number
        }
        Insert: {
          catalog_id: string
          catalog_type: string
          category_id?: string | null
          category_name: string
          created_at?: string
          id?: string
          image_path: string
          is_active?: boolean
          name: string
          rarity?: string
          sort_order?: number
        }
        Update: {
          catalog_id?: string
          catalog_type?: string
          category_id?: string | null
          category_name?: string
          created_at?: string
          id?: string
          image_path?: string
          is_active?: boolean
          name?: string
          rarity?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_album_stickers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pet_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_arcade_config: {
        Row: {
          daily_reward_limit: number
          daily_round_limit: number
          explanatory_text: string
          flight_active: boolean
          id: number
          maintenance: boolean
          max_entry: number
          max_multiplier: number
          min_entry: number
          treasure_active: boolean
          treasure_difficulties: Json
          treasure_grid_size: number
          updated_at: string
        }
        Insert: {
          daily_reward_limit?: number
          daily_round_limit?: number
          explanatory_text?: string
          flight_active?: boolean
          id?: number
          maintenance?: boolean
          max_entry?: number
          max_multiplier?: number
          min_entry?: number
          treasure_active?: boolean
          treasure_difficulties?: Json
          treasure_grid_size?: number
          updated_at?: string
        }
        Update: {
          daily_reward_limit?: number
          daily_round_limit?: number
          explanatory_text?: string
          flight_active?: boolean
          id?: number
          maintenance?: boolean
          max_entry?: number
          max_multiplier?: number
          min_entry?: number
          treasure_active?: boolean
          treasure_difficulties?: Json
          treasure_grid_size?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_arcade_daily_missions: {
        Row: {
          created_at: string
          description: string
          event_key: string
          id: string
          is_active: boolean
          mission_key: string
          reward_config: Json
          sort_order: number
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          event_key: string
          id?: string
          is_active?: boolean
          mission_key: string
          reward_config?: Json
          sort_order?: number
          target_value: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          event_key?: string
          id?: string
          is_active?: boolean
          mission_key?: string
          reward_config?: Json
          sort_order?: number
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pet_arcade_flight_rounds: {
        Row: {
          auto_collect_multiplier: number | null
          ends_at: string
          final_multiplier: number
          round_id: string
        }
        Insert: {
          auto_collect_multiplier?: number | null
          ends_at: string
          final_multiplier: number
          round_id: string
        }
        Update: {
          auto_collect_multiplier?: number | null
          ends_at?: string
          final_multiplier?: number
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_arcade_flight_rounds_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "pet_arcade_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_arcade_game_configs: {
        Row: {
          category: string
          cooldown_seconds: number
          created_at: string
          daily_play_limit: number
          daily_win_limit: number
          description: string
          difficulty_config: Json
          display_name: string
          game_type: string
          id: string
          is_enabled: boolean
          max_entry: number
          max_multiplier: number
          min_entry: number
          reward_config: Json
          sort_order: number
          updated_at: string
          visual_config: Json
        }
        Insert: {
          category?: string
          cooldown_seconds?: number
          created_at?: string
          daily_play_limit?: number
          daily_win_limit?: number
          description?: string
          difficulty_config?: Json
          display_name: string
          game_type: string
          id?: string
          is_enabled?: boolean
          max_entry?: number
          max_multiplier?: number
          min_entry?: number
          reward_config?: Json
          sort_order?: number
          updated_at?: string
          visual_config?: Json
        }
        Update: {
          category?: string
          cooldown_seconds?: number
          created_at?: string
          daily_play_limit?: number
          daily_win_limit?: number
          description?: string
          difficulty_config?: Json
          display_name?: string
          game_type?: string
          id?: string
          is_enabled?: boolean
          max_entry?: number
          max_multiplier?: number
          min_entry?: number
          reward_config?: Json
          sort_order?: number
          updated_at?: string
          visual_config?: Json
        }
        Relationships: []
      }
      pet_arcade_game_events: {
        Row: {
          created_at: string
          event_type: string
          game_id: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          game_id: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          game_id?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_arcade_game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "pet_arcade_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_arcade_rounds: {
        Row: {
          client_seed: string
          created_at: string
          current_multiplier: number
          day: string
          difficulty: string | null
          ended_at: string | null
          entry_coins: number
          final_multiplier: number | null
          game_type: string
          id: string
          metadata: Json
          nonce: number
          result_summary: Json
          reward_coins: number
          server_seed: string
          server_seed_hash: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          user_pet_id: string
          xp_reward: number
        }
        Insert: {
          client_seed: string
          created_at?: string
          current_multiplier?: number
          day?: string
          difficulty?: string | null
          ended_at?: string | null
          entry_coins: number
          final_multiplier?: number | null
          game_type: string
          id?: string
          metadata?: Json
          nonce: number
          result_summary?: Json
          reward_coins?: number
          server_seed: string
          server_seed_hash: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          user_pet_id: string
          xp_reward?: number
        }
        Update: {
          client_seed?: string
          created_at?: string
          current_multiplier?: number
          day?: string
          difficulty?: string | null
          ended_at?: string | null
          entry_coins?: number
          final_multiplier?: number | null
          game_type?: string
          id?: string
          metadata?: Json
          nonce?: number
          result_summary?: Json
          reward_coins?: number
          server_seed?: string
          server_seed_hash?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          user_pet_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_arcade_rounds_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_arcade_settings: {
        Row: {
          created_at: string
          daily_play_limit: number
          daily_win_limit: number
          global_max_entry: number
          global_min_entry: number
          healthy_play_message: string
          id: number
          is_enabled: boolean
          maintenance_message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_play_limit?: number
          daily_win_limit?: number
          global_max_entry?: number
          global_min_entry?: number
          healthy_play_message?: string
          id?: number
          is_enabled?: boolean
          maintenance_message?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_play_limit?: number
          daily_win_limit?: number
          global_max_entry?: number
          global_min_entry?: number
          healthy_play_message?: string
          id?: number
          is_enabled?: boolean
          maintenance_message?: string
          updated_at?: string
        }
        Relationships: []
      }
      pet_arcade_surprise_eggs: {
        Row: {
          cost_amount: number
          created_at: string
          game_id: string
          id: string
          open_after: string
          opened_at: string | null
          pet_id: string
          rarity: string
          reward_amount: number
          reward_payload: Json
          reward_type: string
          status: string
          user_id: string
        }
        Insert: {
          cost_amount: number
          created_at?: string
          game_id: string
          id?: string
          open_after: string
          opened_at?: string | null
          pet_id: string
          rarity?: string
          reward_amount?: number
          reward_payload?: Json
          reward_type: string
          status?: string
          user_id: string
        }
        Update: {
          cost_amount?: number
          created_at?: string
          game_id?: string
          id?: string
          open_after?: string
          opened_at?: string | null
          pet_id?: string
          rarity?: string
          reward_amount?: number
          reward_payload?: Json
          reward_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_arcade_surprise_eggs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "pet_arcade_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_arcade_surprise_eggs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_arcade_treasure_rounds: {
        Row: {
          difficulty: string
          grid_size: number
          revealed_positions: number[]
          round_id: string
          safe_reveals: number
          trap_count: number
          trap_positions: number[]
        }
        Insert: {
          difficulty: string
          grid_size: number
          revealed_positions?: number[]
          round_id: string
          safe_reveals?: number
          trap_count: number
          trap_positions: number[]
        }
        Update: {
          difficulty?: string
          grid_size?: number
          revealed_positions?: number[]
          round_id?: string
          safe_reveals?: number
          trap_count?: number
          trap_positions?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "pet_arcade_treasure_rounds_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "pet_arcade_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_background_compat: {
        Row: {
          background_id: string
          category_id: string
          created_at: string
          id: string
          species_id: string | null
        }
        Insert: {
          background_id: string
          category_id: string
          created_at?: string
          id?: string
          species_id?: string | null
        }
        Update: {
          background_id?: string
          category_id?: string
          created_at?: string
          id?: string
          species_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_background_compat_background_id_fkey"
            columns: ["background_id"]
            isOneToOne: false
            referencedRelation: "pet_backgrounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_background_compat_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pet_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_background_compat_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "pet_species"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_backgrounds: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url_day: string | null
          image_url_night: string | null
          is_exclusive: boolean
          min_level: number
          name: string
          price_coins: number
          rarity: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url_day?: string | null
          image_url_night?: string | null
          is_exclusive?: boolean
          min_level?: number
          name: string
          price_coins?: number
          rarity?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url_day?: string | null
          image_url_night?: string | null
          is_exclusive?: boolean
          min_level?: number
          name?: string
          price_coins?: number
          rarity?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_benefits: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          effect_key: string | null
          effect_param: number | null
          effect_target_id: string | null
          id: string
          image_url: string | null
          name: string
          perk_label: string | null
          scope: string
          scope_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          effect_key?: string | null
          effect_param?: number | null
          effect_target_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          perk_label?: string | null
          scope?: string
          scope_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          effect_key?: string | null
          effect_param?: number | null
          effect_target_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          perk_label?: string | null
          scope?: string
          scope_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_benefits_effect_key_fkey"
            columns: ["effect_key"]
            isOneToOne: false
            referencedRelation: "pet_perk_effects"
            referencedColumns: ["key"]
          },
        ]
      }
      pet_care_config: {
        Row: {
          decay_per_hour: number
          energy_regen_minutes_per_point: number
          id: number
          updated_at: string
        }
        Insert: {
          decay_per_hour?: number
          energy_regen_minutes_per_point?: number
          id?: number
          updated_at?: string
        }
        Update: {
          decay_per_hour?: number
          energy_regen_minutes_per_point?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_care_events: {
        Row: {
          cost_coins: number
          created_at: string
          delta: number
          id: string
          item_id: string | null
          kind: string
          user_id: string
          user_pet_id: string
        }
        Insert: {
          cost_coins?: number
          created_at?: string
          delta: number
          id?: string
          item_id?: string | null
          kind: string
          user_id: string
          user_pet_id: string
        }
        Update: {
          cost_coins?: number
          created_at?: string
          delta?: number
          id?: string
          item_id?: string | null
          kind?: string
          user_id?: string
          user_pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_care_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pet_care_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_care_events_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_care_item_compat: {
        Row: {
          category_id: string
          id: string
          item_id: string
          species_id: string | null
        }
        Insert: {
          category_id: string
          id?: string
          item_id: string
          species_id?: string | null
        }
        Update: {
          category_id?: string
          id?: string
          item_id?: string
          species_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_care_item_compat_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pet_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_care_item_compat_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pet_care_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_care_item_compat_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "pet_species"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_care_items: {
        Row: {
          active: boolean
          cost_coins: number
          created_at: string
          daily_uses: number
          description: string | null
          energy_cost: number
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["pet_care_kind"]
          name: string
          restore_amount: number
          sleep_hours: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost_coins?: number
          created_at?: string
          daily_uses?: number
          description?: string | null
          energy_cost?: number
          id?: string
          image_url?: string | null
          kind: Database["public"]["Enums"]["pet_care_kind"]
          name: string
          restore_amount?: number
          sleep_hours?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost_coins?: number
          created_at?: string
          daily_uses?: number
          description?: string | null
          energy_cost?: number
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["pet_care_kind"]
          name?: string
          restore_amount?: number
          sleep_hours?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_care_push_log: {
        Row: {
          last_push_at: string | null
          last_push_kind: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_push_at?: string | null
          last_push_kind?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_push_at?: string | null
          last_push_kind?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pet_care_state: {
        Row: {
          anchor_at: string
          id: string
          kind: string
          updated_at: string
          user_pet_id: string
          value_at_anchor: number
        }
        Insert: {
          anchor_at?: string
          id?: string
          kind: string
          updated_at?: string
          user_pet_id: string
          value_at_anchor?: number
        }
        Update: {
          anchor_at?: string
          id?: string
          kind?: string
          updated_at?: string
          user_pet_id?: string
          value_at_anchor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_care_state_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_care_streaks: {
        Row: {
          best_streak: number
          current_streak: number
          last_care_date: string | null
          shield_count: number
          shield_week_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          last_care_date?: string | null
          shield_count?: number
          shield_week_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          last_care_date?: string | null
          shield_count?: number
          shield_week_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pet_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_confessions: {
        Row: {
          active: boolean
          category: string
          created_at: string
          effect_delta: number
          effect_kind: string | null
          id: string
          personality_slug: string | null
          text: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          effect_delta?: number
          effect_kind?: string | null
          id?: string
          personality_slug?: string | null
          text: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          effect_delta?: number
          effect_kind?: string | null
          id?: string
          personality_slug?: string | null
          text?: string
        }
        Relationships: []
      }
      pet_expeditions: {
        Row: {
          active: boolean
          coin_reward: number
          created_at: string
          crit_rate: number
          description: string | null
          difficulty: string
          duration_minutes: number
          energy_cost: number
          icon: string
          id: string
          image_url: string | null
          item_reward_label: string | null
          min_user_level: number
          slug: string
          sort_order: number
          success_rate: number
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          coin_reward?: number
          created_at?: string
          crit_rate?: number
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          energy_cost?: number
          icon?: string
          id?: string
          image_url?: string | null
          item_reward_label?: string | null
          min_user_level?: number
          slug: string
          sort_order?: number
          success_rate?: number
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          coin_reward?: number
          created_at?: string
          crit_rate?: number
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          energy_cost?: number
          icon?: string
          id?: string
          image_url?: string | null
          item_reward_label?: string | null
          min_user_level?: number
          slug?: string
          sort_order?: number
          success_rate?: number
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      pet_life_stages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          kind: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_missions: {
        Row: {
          action_key: string
          active: boolean
          category: string
          coin_reward: number
          created_at: string
          description: string | null
          difficulty: string
          icon: string
          id: string
          slug: string
          sort_order: number
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          action_key: string
          active?: boolean
          category: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          slug: string
          sort_order?: number
          target?: number
          title: string
          xp_reward?: number
        }
        Update: {
          action_key?: string
          active?: boolean
          category?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          slug?: string
          sort_order?: number
          target?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      pet_perk_effects: {
        Row: {
          active: boolean
          category: string
          created_at: string
          default_param: number | null
          description: string | null
          key: string
          label: string
          needs_target: string | null
          numeric_param: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          default_param?: number | null
          description?: string | null
          key: string
          label: string
          needs_target?: string | null
          numeric_param?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          default_param?: number | null
          description?: string | null
          key?: string
          label?: string
          needs_target?: string | null
          numeric_param?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_personalities: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_personality_effects: {
        Row: {
          active: boolean
          cap_max: number | null
          condition_kind: string | null
          condition_op: string | null
          condition_value: number | null
          created_at: string
          daypart: string
          decay_mult: number
          energy_cost_mult: number
          id: string
          kind: string
          note: string | null
          personality_id: string
          restore_mult: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cap_max?: number | null
          condition_kind?: string | null
          condition_op?: string | null
          condition_value?: number | null
          created_at?: string
          daypart?: string
          decay_mult?: number
          energy_cost_mult?: number
          id?: string
          kind: string
          note?: string | null
          personality_id: string
          restore_mult?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cap_max?: number | null
          condition_kind?: string | null
          condition_op?: string | null
          condition_value?: number | null
          created_at?: string
          daypart?: string
          decay_mult?: number
          energy_cost_mult?: number
          id?: string
          kind?: string
          note?: string | null
          personality_id?: string
          restore_mult?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_personality_effects_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "pet_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_random_events: {
        Row: {
          active: boolean
          base_chance: number
          created_at: string
          daily_cap: number
          id: string
          item_id: string | null
          kind: string | null
          payload: Json
          personality_chance_mult: number
          personality_id: string | null
          scope: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_chance?: number
          created_at?: string
          daily_cap?: number
          id?: string
          item_id?: string | null
          kind?: string | null
          payload?: Json
          personality_chance_mult?: number
          personality_id?: string | null
          scope: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_chance?: number
          created_at?: string
          daily_cap?: number
          id?: string
          item_id?: string | null
          kind?: string | null
          payload?: Json
          personality_chance_mult?: number
          personality_id?: string | null
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_random_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pet_care_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_random_events_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "pet_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_rebirth_history: {
        Row: {
          created_at: string
          id: string
          medal: string | null
          prestige_level: number
          user_id: string
          xp_at_rebirth: number
        }
        Insert: {
          created_at?: string
          id?: string
          medal?: string | null
          prestige_level: number
          user_id: string
          xp_at_rebirth?: number
        }
        Update: {
          created_at?: string
          id?: string
          medal?: string | null
          prestige_level?: number
          user_id?: string
          xp_at_rebirth?: number
        }
        Relationships: []
      }
      pet_species: {
        Row: {
          active: boolean
          benefit_id: string | null
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          image_url_adult: string | null
          image_url_baby: string | null
          is_exclusive: boolean
          name: string
          nocturnal: boolean
          price_coins: number
          rarity: Database["public"]["Enums"]["pet_rarity"]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          benefit_id?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_url_adult?: string | null
          image_url_baby?: string | null
          is_exclusive?: boolean
          name: string
          nocturnal?: boolean
          price_coins?: number
          rarity?: Database["public"]["Enums"]["pet_rarity"]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          benefit_id?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_url_adult?: string | null
          image_url_baby?: string | null
          is_exclusive?: boolean
          name?: string
          nocturnal?: boolean
          price_coins?: number
          rarity?: Database["public"]["Enums"]["pet_rarity"]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_species_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "pet_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_species_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pet_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_variants: {
        Row: {
          active: boolean
          benefit_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          image_url_adult: string | null
          image_url_baby: string | null
          is_exclusive: boolean
          name: string
          price_coins: number
          rarity: Database["public"]["Enums"]["pet_rarity"]
          slug: string
          sort_order: number
          species_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          benefit_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_url_adult?: string | null
          image_url_baby?: string | null
          is_exclusive?: boolean
          name: string
          price_coins?: number
          rarity?: Database["public"]["Enums"]["pet_rarity"]
          slug: string
          sort_order?: number
          species_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          benefit_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_url_adult?: string | null
          image_url_baby?: string | null
          is_exclusive?: boolean
          name?: string
          price_coins?: number
          rarity?: Database["public"]["Enums"]["pet_rarity"]
          slug?: string
          sort_order?: number
          species_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_variants_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "pet_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_variants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pet_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_variants_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "pet_species"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          animation_url: string | null
          created_at: string
          description: string | null
          event_tag: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_exclusive: boolean
          limited_until: string | null
          name: string
          pose: string | null
          preview_url: string | null
          price_coins: number
          rarity: Database["public"]["Enums"]["pet_rarity"]
          shadow_url: string | null
          slug: string
          sort_order: number
          sound_url: string | null
          species: string
          updated_at: string
        }
        Insert: {
          animation_url?: string | null
          created_at?: string
          description?: string | null
          event_tag?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_exclusive?: boolean
          limited_until?: string | null
          name: string
          pose?: string | null
          preview_url?: string | null
          price_coins?: number
          rarity?: Database["public"]["Enums"]["pet_rarity"]
          shadow_url?: string | null
          slug: string
          sort_order?: number
          sound_url?: string | null
          species: string
          updated_at?: string
        }
        Update: {
          animation_url?: string | null
          created_at?: string
          description?: string | null
          event_tag?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_exclusive?: boolean
          limited_until?: string | null
          name?: string
          pose?: string | null
          preview_url?: string | null
          price_coins?: number
          rarity?: Database["public"]["Enums"]["pet_rarity"]
          shadow_url?: string | null
          slug?: string
          sort_order?: number
          sound_url?: string | null
          species?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_moderation_log: {
        Row: {
          ai_result: Json
          confidence: number | null
          created_at: string
          decision: string
          id: string
          photo_url: string | null
          reason: string | null
          scope: Database["public"]["Enums"]["photo_moderation_scope"]
          storage_bucket: string | null
          storage_path: string | null
          user_id: string
        }
        Insert: {
          ai_result?: Json
          confidence?: number | null
          created_at?: string
          decision: string
          id?: string
          photo_url?: string | null
          reason?: string | null
          scope: Database["public"]["Enums"]["photo_moderation_scope"]
          storage_bucket?: string | null
          storage_path?: string | null
          user_id: string
        }
        Update: {
          ai_result?: Json
          confidence?: number | null
          created_at?: string
          decision?: string
          id?: string
          photo_url?: string | null
          reason?: string | null
          scope?: Database["public"]["Enums"]["photo_moderation_scope"]
          storage_bucket?: string | null
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      photo_moderation_queue: {
        Row: {
          ai_result: Json
          created_at: string
          id: string
          photo_id: string | null
          photo_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          scope: Database["public"]["Enums"]["photo_moderation_scope"]
          status: Database["public"]["Enums"]["photo_moderation_status"]
          user_id: string
        }
        Insert: {
          ai_result?: Json
          created_at?: string
          id?: string
          photo_id?: string | null
          photo_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope: Database["public"]["Enums"]["photo_moderation_scope"]
          status?: Database["public"]["Enums"]["photo_moderation_status"]
          user_id: string
        }
        Update: {
          ai_result?: Json
          created_at?: string
          id?: string
          photo_id?: string | null
          photo_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: Database["public"]["Enums"]["photo_moderation_scope"]
          status?: Database["public"]["Enums"]["photo_moderation_status"]
          user_id?: string
        }
        Relationships: []
      }
      photo_moderation_settings: {
        Row: {
          extra_reject_threshold: number
          extra_review_threshold: number
          id: boolean
          main_approve_threshold: number
          main_review_threshold: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          extra_reject_threshold?: number
          extra_review_threshold?: number
          id?: boolean
          main_approve_threshold?: number
          main_review_threshold?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          extra_reject_threshold?: number
          extra_review_threshold?: number
          id?: boolean
          main_approve_threshold?: number
          main_review_threshold?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      prayer_request_prayed: {
        Row: {
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_request_prayed_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_request_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string
          reporter_id: string
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          request_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          request_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          category: Database["public"]["Enums"]["prayer_category"]
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          moderation_status: Database["public"]["Enums"]["prayer_moderation_status"]
          resolved: boolean
          resolved_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["prayer_category"]
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: Database["public"]["Enums"]["prayer_moderation_status"]
          resolved?: boolean
          resolved_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["prayer_category"]
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: Database["public"]["Enums"]["prayer_moderation_status"]
          resolved?: boolean
          resolved_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      presence_last_seen: {
        Row: {
          last_seen_at: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          user_id: string
        }
        Update: {
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_advanced: {
        Row: {
          available_time: string | null
          calling_description: string | null
          children_count: number | null
          church_frequency: string | null
          communication: string | null
          created_at: string
          energy: string | null
          essential_quality: string | null
          faith_moment: string | null
          favorite_worships: string | null
          free_time: string | null
          has_calling: string | null
          hobbies: string | null
          in_relationship_iam: string | null
          introversion: string | null
          life_goals: string[] | null
          life_verse: string | null
          living_place: string | null
          love_language: string | null
          ministry: string | null
          ministry_other: string | null
          non_negotiable: string | null
          pace: string | null
          participates: string[] | null
          routine: string | null
          seeking: string | null
          spiritual_routine: string[] | null
          style: string | null
          testimony: string | null
          updated_at: string
          user_id: string
          wants_children: string | null
          wants_marriage: string | null
          willing_to_build: string | null
          worship_style: string | null
        }
        Insert: {
          available_time?: string | null
          calling_description?: string | null
          children_count?: number | null
          church_frequency?: string | null
          communication?: string | null
          created_at?: string
          energy?: string | null
          essential_quality?: string | null
          faith_moment?: string | null
          favorite_worships?: string | null
          free_time?: string | null
          has_calling?: string | null
          hobbies?: string | null
          in_relationship_iam?: string | null
          introversion?: string | null
          life_goals?: string[] | null
          life_verse?: string | null
          living_place?: string | null
          love_language?: string | null
          ministry?: string | null
          ministry_other?: string | null
          non_negotiable?: string | null
          pace?: string | null
          participates?: string[] | null
          routine?: string | null
          seeking?: string | null
          spiritual_routine?: string[] | null
          style?: string | null
          testimony?: string | null
          updated_at?: string
          user_id: string
          wants_children?: string | null
          wants_marriage?: string | null
          willing_to_build?: string | null
          worship_style?: string | null
        }
        Update: {
          available_time?: string | null
          calling_description?: string | null
          children_count?: number | null
          church_frequency?: string | null
          communication?: string | null
          created_at?: string
          energy?: string | null
          essential_quality?: string | null
          faith_moment?: string | null
          favorite_worships?: string | null
          free_time?: string | null
          has_calling?: string | null
          hobbies?: string | null
          in_relationship_iam?: string | null
          introversion?: string | null
          life_goals?: string[] | null
          life_verse?: string | null
          living_place?: string | null
          love_language?: string | null
          ministry?: string | null
          ministry_other?: string | null
          non_negotiable?: string | null
          pace?: string | null
          participates?: string[] | null
          routine?: string | null
          seeking?: string | null
          spiritual_routine?: string[] | null
          style?: string | null
          testimony?: string | null
          updated_at?: string
          user_id?: string
          wants_children?: string | null
          wants_marriage?: string | null
          willing_to_build?: string | null
          worship_style?: string | null
        }
        Relationships: []
      }
      profile_backgrounds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          name: string
          price: number
          rarity: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          price?: number
          rarity?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          price?: number
          rarity?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_photos: {
        Row: {
          ai_checked_at: string | null
          ai_confidence: number | null
          ai_verified: boolean
          category: string | null
          created_at: string
          id: string
          sort_order: number
          url: string
          user_id: string
        }
        Insert: {
          ai_checked_at?: string | null
          ai_confidence?: number | null
          ai_verified?: boolean
          category?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          url: string
          user_id: string
        }
        Update: {
          ai_checked_at?: string | null
          ai_confidence?: number | null
          ai_verified?: boolean
          category?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
          user_id?: string
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
          avatar_ai_checked_at: string | null
          avatar_ai_confidence: number | null
          avatar_ai_verified: boolean
          banned_at: string | null
          banned_by: string | null
          banned_reason: string | null
          bio: string | null
          church: string
          city: string
          community_onboarding_completed_at: string | null
          community_onboarding_version: string | null
          contributor_highlight: boolean
          created_at: string
          deactivated_at: string | null
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          equipped_aura_id: string | null
          equipped_background_id: string | null
          equipped_frame_id: string | null
          equipped_name_gradient_id: string | null
          equipped_sticker_id: string | null
          full_name: string
          height_cm: number | null
          id: string
          is_anonymized: boolean
          marital: Database["public"]["Enums"]["marital_status"] | null
          photo_url: string | null
          rejection_reason: string | null
          sex: Database["public"]["Enums"]["sex_type"] | null
          state: string
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          years_baptized: number
        }
        Insert: {
          age: number
          avatar_ai_checked_at?: string | null
          avatar_ai_confidence?: number | null
          avatar_ai_verified?: boolean
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          bio?: string | null
          church: string
          city: string
          community_onboarding_completed_at?: string | null
          community_onboarding_version?: string | null
          contributor_highlight?: boolean
          created_at?: string
          deactivated_at?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          equipped_aura_id?: string | null
          equipped_background_id?: string | null
          equipped_frame_id?: string | null
          equipped_name_gradient_id?: string | null
          equipped_sticker_id?: string | null
          full_name: string
          height_cm?: number | null
          id: string
          is_anonymized?: boolean
          marital?: Database["public"]["Enums"]["marital_status"] | null
          photo_url?: string | null
          rejection_reason?: string | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          state: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          years_baptized: number
        }
        Update: {
          age?: number
          avatar_ai_checked_at?: string | null
          avatar_ai_confidence?: number | null
          avatar_ai_verified?: boolean
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          bio?: string | null
          church?: string
          city?: string
          community_onboarding_completed_at?: string | null
          community_onboarding_version?: string | null
          contributor_highlight?: boolean
          created_at?: string
          deactivated_at?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          equipped_aura_id?: string | null
          equipped_background_id?: string | null
          equipped_frame_id?: string | null
          equipped_name_gradient_id?: string | null
          equipped_sticker_id?: string | null
          full_name?: string
          height_cm?: number | null
          id?: string
          is_anonymized?: boolean
          marital?: Database["public"]["Enums"]["marital_status"] | null
          photo_url?: string | null
          rejection_reason?: string | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          state?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          years_baptized?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_equipped_aura_id_fkey"
            columns: ["equipped_aura_id"]
            isOneToOne: false
            referencedRelation: "avatar_decorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_background_id_fkey"
            columns: ["equipped_background_id"]
            isOneToOne: false
            referencedRelation: "profile_backgrounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_frame_id_fkey"
            columns: ["equipped_frame_id"]
            isOneToOne: false
            referencedRelation: "avatar_decorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_name_gradient_id_fkey"
            columns: ["equipped_name_gradient_id"]
            isOneToOne: false
            referencedRelation: "name_gradients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_sticker_id_fkey"
            columns: ["equipped_sticker_id"]
            isOneToOne: false
            referencedRelation: "avatar_decorations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_queue: {
        Row: {
          attempts: number
          body: string | null
          created_at: string
          id: string
          last_error: string | null
          processed_at: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          body?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          body?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reactivation_reminders: {
        Row: {
          id: string
          sent_at: string
          tier: number
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          tier: number
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          tier?: number
          user_id?: string
        }
        Relationships: []
      }
      relationship_commitments: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          match_id: string
          requested_at: string
          requested_by: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          match_id: string
          requested_at?: string
          requested_by: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          match_id?: string
          requested_at?: string
          requested_by?: string
          status?: string
          user_a?: string
          user_b?: string
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
      sticker_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      stickers: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_animated: boolean
          mime_type: string
          name: string
          public_url: string
          sort_order: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_animated?: boolean
          mime_type: string
          name: string
          public_url: string
          sort_order?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_animated?: boolean
          mime_type?: string
          name?: string
          public_url?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stickers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sticker_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_articles: {
        Row: {
          category: Database["public"]["Enums"]["support_category"]
          content: string
          created_at: string
          created_by: string | null
          featured: boolean
          id: string
          published: boolean
          slug: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["support_category"]
          content: string
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["support_category"]
          content?: string
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json
          content: string
          created_at: string
          id: string
          is_staff: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          content: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["support_category"]
          created_at: string
          id: string
          last_message_at: string
          priority: Database["public"]["Enums"]["support_priority"]
          status: Database["public"]["Enums"]["support_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          status?: Database["public"]["Enums"]["support_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          status?: Database["public"]["Enums"]["support_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "pet_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          day: string
          user_id: string
        }
        Insert: {
          day?: string
          user_id: string
        }
        Update: {
          day?: string
          user_id?: string
        }
        Relationships: []
      }
      user_admin_requests: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          message: string
          status: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind: string
          message: string
          status?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_admin_warnings: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          created_by: string
          id: string
          message: string
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          message: string
          severity?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      user_avatar_base: {
        Row: {
          age_range: string
          avatar_name: string | null
          base_id: string
          color_selections: Json
          skin_tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string
          avatar_name?: string | null
          base_id: string
          color_selections?: Json
          skin_tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string
          avatar_name?: string | null
          base_id?: string
          color_selections?: Json
          skin_tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatar_base_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "avatar_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatar_equipped: {
        Row: {
          base_id: string | null
          category_id: string
          id: string
          item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_id?: string | null
          category_id: string
          id?: string
          item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_id?: string | null
          category_id?: string
          id?: string
          item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatar_equipped_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "avatar_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_avatar_equipped_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "avatar_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_avatar_equipped_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatar_inventory: {
        Row: {
          acquired_at: string
          id: string
          is_favorite: boolean
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          is_favorite?: boolean
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          is_favorite?: boolean
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatar_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatar_looks: {
        Row: {
          created_at: string
          id: string
          image_path: string
          name: string | null
          snapshot: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          name?: string | null
          snapshot?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          name?: string | null
          snapshot?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          active: boolean
          awarded_at: string
          badge_id: string
          expires_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          awarded_at?: string
          badge_id: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          active?: boolean
          awarded_at?: string
          badge_id?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ban_appeals: {
        Row: {
          appeal_text: string
          created_at: string
          id: string
          kind: string
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          status: string
          user_id: string
        }
        Insert: {
          appeal_text: string
          created_at?: string
          id?: string
          kind?: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string
          user_id: string
        }
        Update: {
          appeal_text?: string
          created_at?: string
          id?: string
          kind?: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_coins: {
        Row: {
          balance: number
          claim_streak: number
          created_at: string
          last_claim_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          claim_streak?: number
          created_at?: string
          last_claim_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          claim_streak?: number
          created_at?: string
          last_claim_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_expeditions: {
        Row: {
          created_at: string
          day: string
          expedition_id: string
          id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          expedition_id: string
          id?: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          expedition_id?: string
          id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_expeditions_expedition_id_fkey"
            columns: ["expedition_id"]
            isOneToOne: false
            referencedRelation: "pet_expeditions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_grabs: {
        Row: {
          created_at: string
          day: string
          free_used: number
          id: string
          paid_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          free_used?: number
          id?: string
          paid_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          free_used?: number
          id?: string
          paid_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_grabs_by_pool: {
        Row: {
          created_at: string
          day: string
          free_used: number
          id: string
          paid_used: number
          pool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          free_used?: number
          id?: string
          paid_used?: number
          pool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          free_used?: number
          id?: string
          paid_used?: number
          pool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_grabs_by_pool_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "grab_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          day: string
          id: string
          mission_id: string
          progress: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day?: string
          id?: string
          mission_id: string
          progress?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day?: string
          id?: string
          mission_id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "pet_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_decorations: {
        Row: {
          decoration_id: string
          id: string
          is_free_claim: boolean
          purchased_at: string
          user_id: string
        }
        Insert: {
          decoration_id: string
          id?: string
          is_free_claim?: boolean
          purchased_at?: string
          user_id: string
        }
        Update: {
          decoration_id?: string
          id?: string
          is_free_claim?: boolean
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_decorations_decoration_id_fkey"
            columns: ["decoration_id"]
            isOneToOne: false
            referencedRelation: "avatar_decorations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_donations: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_freebie_claims: {
        Row: {
          category: string
          claimed_at: string
          item_id: string
          rarity: string
          user_id: string
        }
        Insert: {
          category: string
          claimed_at?: string
          item_id: string
          rarity: string
          user_id: string
        }
        Update: {
          category?: string
          claimed_at?: string
          item_id?: string
          rarity?: string
          user_id?: string
        }
        Relationships: []
      }
      user_grab_inventory: {
        Row: {
          created_at: string
          id: string
          prize_kind: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prize_kind: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prize_kind?: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_grab_log: {
        Row: {
          id: string
          pool_id: string | null
          prize_amount: number
          prize_kind: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id: string | null
          rolled_at: string
          user_id: string
          was_paid: boolean
        }
        Insert: {
          id?: string
          pool_id?: string | null
          prize_amount?: number
          prize_kind: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id?: string | null
          rolled_at?: string
          user_id: string
          was_paid?: boolean
        }
        Update: {
          id?: string
          pool_id?: string | null
          prize_amount?: number
          prize_kind?: Database["public"]["Enums"]["grab_prize_kind"]
          prize_ref_id?: string | null
          rolled_at?: string
          user_id?: string
          was_paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_grab_log_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "grab_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_name_gradients: {
        Row: {
          gradient_id: string
          id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          gradient_id: string
          id?: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          gradient_id?: string
          id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_name_gradients_gradient_id_fkey"
            columns: ["gradient_id"]
            isOneToOne: false
            referencedRelation: "name_gradients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_album_stickers: {
        Row: {
          first_collected_at: string
          quantity: number
          sticker_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          first_collected_at?: string
          quantity?: number
          sticker_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          first_collected_at?: string
          quantity?: number
          sticker_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_album_stickers_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "pet_album_stickers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_arcade_daily_missions: {
        Row: {
          assigned_date: string
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          pet_id: string
          progress: number
          status: string
          target_value: number
          user_id: string
        }
        Insert: {
          assigned_date: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          pet_id: string
          progress?: number
          status?: string
          target_value: number
          user_id: string
        }
        Update: {
          assigned_date?: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          pet_id?: string
          progress?: number
          status?: string
          target_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_arcade_daily_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "pet_arcade_daily_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pet_arcade_daily_missions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_backgrounds: {
        Row: {
          acquired_at: string
          background_id: string
          id: string
          is_equipped: boolean
          user_id: string
        }
        Insert: {
          acquired_at?: string
          background_id: string
          id?: string
          is_equipped?: boolean
          user_id: string
        }
        Update: {
          acquired_at?: string
          background_id?: string
          id?: string
          is_equipped?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_backgrounds_background_id_fkey"
            columns: ["background_id"]
            isOneToOne: false
            referencedRelation: "pet_backgrounds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_buffs: {
        Row: {
          created_at: string
          decay_mult: number
          expires_at: string
          id: string
          kind: string
          label: string | null
          restore_mult: number
          source: string
          user_id: string
          user_pet_id: string
        }
        Insert: {
          created_at?: string
          decay_mult?: number
          expires_at: string
          id?: string
          kind: string
          label?: string | null
          restore_mult?: number
          source?: string
          user_id: string
          user_pet_id: string
        }
        Update: {
          created_at?: string
          decay_mult?: number
          expires_at?: string
          id?: string
          kind?: string
          label?: string | null
          restore_mult?: number
          source?: string
          user_id?: string
          user_pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_buffs_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_chest_claims: {
        Row: {
          claimed_at: string
          coins_awarded: number
          id: string
          user_id: string
          week_start: string
          xp_awarded: number
        }
        Insert: {
          claimed_at?: string
          coins_awarded?: number
          id?: string
          user_id: string
          week_start: string
          xp_awarded?: number
        }
        Update: {
          claimed_at?: string
          coins_awarded?: number
          id?: string
          user_id?: string
          week_start?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      user_pet_confession_log: {
        Row: {
          confession_id: string
          id: string
          shown_at: string
          user_id: string
        }
        Insert: {
          confession_id: string
          id?: string
          shown_at?: string
          user_id: string
        }
        Update: {
          confession_id?: string
          id?: string
          shown_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_confession_log_confession_id_fkey"
            columns: ["confession_id"]
            isOneToOne: false
            referencedRelation: "pet_confessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_expedition_runs: {
        Row: {
          claimed_at: string | null
          coin_awarded: number
          created_at: string
          ends_at: string
          expedition_id: string
          id: string
          item_awarded_label: string | null
          outcome: string
          started_at: string
          user_id: string
          user_pet_id: string
          xp_awarded: number
        }
        Insert: {
          claimed_at?: string | null
          coin_awarded?: number
          created_at?: string
          ends_at: string
          expedition_id: string
          id?: string
          item_awarded_label?: string | null
          outcome?: string
          started_at?: string
          user_id: string
          user_pet_id: string
          xp_awarded?: number
        }
        Update: {
          claimed_at?: string | null
          coin_awarded?: number
          created_at?: string
          ends_at?: string
          expedition_id?: string
          id?: string
          item_awarded_label?: string | null
          outcome?: string
          started_at?: string
          user_id?: string
          user_pet_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_expedition_runs_expedition_id_fkey"
            columns: ["expedition_id"]
            isOneToOne: false
            referencedRelation: "pet_expeditions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_perk_state: {
        Row: {
          created_at: string
          effect_key: string
          id: string
          last_collected_at: string | null
          total_collected: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effect_key: string
          id?: string
          last_collected_at?: string | null
          total_collected?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effect_key?: string
          id?: string
          last_collected_at?: string | null
          total_collected?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_perk_state_effect_key_fkey"
            columns: ["effect_key"]
            isOneToOne: false
            referencedRelation: "pet_perk_effects"
            referencedColumns: ["key"]
          },
        ]
      }
      user_pet_random_event_log: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          payload: Json | null
          user_id: string
          user_pet_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          payload?: Json | null
          user_id: string
          user_pet_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          payload?: Json | null
          user_id?: string
          user_pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_random_event_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "pet_random_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pet_random_event_log_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_unlocks: {
        Row: {
          adult_unlocked_at: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adult_unlocked_at?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adult_unlocked_at?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_pets: {
        Row: {
          acquired_at: string
          created_at: string
          custom_name: string | null
          id: string
          is_equipped: boolean
          pet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_equipped?: boolean
          pet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_equipped?: boolean
          pet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pets_v2: {
        Row: {
          benefit_id: string | null
          category_id: string
          created_at: string
          custom_name: string
          evolved_at: string | null
          id: string
          is_equipped: boolean
          life_stage_id: string
          personality_id: string
          species_id: string | null
          updated_at: string
          user_id: string
          variant_id: string | null
          visibility: string
        }
        Insert: {
          benefit_id?: string | null
          category_id: string
          created_at?: string
          custom_name: string
          evolved_at?: string | null
          id?: string
          is_equipped?: boolean
          life_stage_id: string
          personality_id: string
          species_id?: string | null
          updated_at?: string
          user_id: string
          variant_id?: string | null
          visibility?: string
        }
        Update: {
          benefit_id?: string | null
          category_id?: string
          created_at?: string
          custom_name?: string
          evolved_at?: string | null
          id?: string
          is_equipped?: boolean
          life_stage_id?: string
          personality_id?: string
          species_id?: string | null
          updated_at?: string
          user_id?: string
          variant_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pets_v2_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "pet_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pets_v2_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pet_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pets_v2_life_stage_id_fkey"
            columns: ["life_stage_id"]
            isOneToOne: false
            referencedRelation: "pet_life_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pets_v2_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "pet_personalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pets_v2_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "pet_species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pets_v2_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "pet_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prestige: {
        Row: {
          last_prestige_at: string | null
          level: number
          total_rebirths: number
          updated_at: string
          user_id: string
        }
        Insert: {
          last_prestige_at?: string | null
          level?: number
          total_rebirths?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          last_prestige_at?: string | null
          level?: number
          total_rebirths?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profile_backgrounds: {
        Row: {
          background_id: string
          id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          background_id: string
          id?: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          background_id?: string
          id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_backgrounds_background_id_fkey"
            columns: ["background_id"]
            isOneToOne: false
            referencedRelation: "profile_backgrounds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          chosen_index: number
          correct: boolean
          created_at: string
          day: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          chosen_index: number
          correct: boolean
          created_at?: string
          day?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          chosen_index?: number
          correct?: boolean
          created_at?: string
          day?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "bible_quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          badge_color: string | null
          created_at: string
          id: string
          is_support_agent: boolean
          public_listing: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          badge_color?: string | null
          created_at?: string
          id?: string
          is_support_agent?: boolean
          public_listing?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          badge_color?: string | null
          created_at?: string
          id?: string
          is_support_agent?: boolean
          public_listing?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_starter_bundle: {
        Row: {
          claimed_at: string
          coins_granted: number
          user_id: string
          xp_granted: number
        }
        Insert: {
          claimed_at?: string
          coins_granted?: number
          user_id: string
          xp_granted?: number
        }
        Update: {
          claimed_at?: string
          coins_granted?: number
          user_id?: string
          xp_granted?: number
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          level: number
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          level?: number
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          level?: number
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_path: string
          document_type: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_path: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_path: string
          document_type: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_path?: string
          document_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      virtual_gifts: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["gift_category"]
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          price_coins: number
          rarity: Database["public"]["Enums"]["gift_rarity"]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["gift_category"]
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_coins: number
          rarity?: Database["public"]["Enums"]["gift_rarity"]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["gift_category"]
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_coins?: number
          rarity?: Database["public"]["Enums"]["gift_rarity"]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          meta: Json | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          meta?: Json | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      anonymous_messages_inbox: {
        Row: {
          content: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          match_id: string | null
          receiver_id: string | null
          receiver_reveal_requested_at: string | null
          replied_at: string | null
          reply_text: string | null
          revealed_at: string | null
          sender_id: string | null
          sender_reveal_requested_at: string | null
          status: Database["public"]["Enums"]["anonymous_message_status"] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          match_id?: string | null
          receiver_id?: string | null
          receiver_reveal_requested_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          revealed_at?: string | null
          sender_id?: never
          sender_reveal_requested_at?: string | null
          status?:
            | Database["public"]["Enums"]["anonymous_message_status"]
            | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          match_id?: string | null
          receiver_id?: string | null
          receiver_reveal_requested_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          revealed_at?: string | null
          sender_id?: never
          sender_reveal_requested_at?: string | null
          status?:
            | Database["public"]["Enums"]["anonymous_message_status"]
            | null
        }
        Relationships: []
      }
      anonymous_messages_outbox: {
        Row: {
          content: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          match_id: string | null
          receiver_id_revealed: string | null
          receiver_reveal_requested_at: string | null
          replied_at: string | null
          reply_text: string | null
          revealed_at: string | null
          sender_id: string | null
          sender_reveal_requested_at: string | null
          status: Database["public"]["Enums"]["anonymous_message_status"] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          match_id?: string | null
          receiver_id_revealed?: never
          receiver_reveal_requested_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          revealed_at?: string | null
          sender_id?: string | null
          sender_reveal_requested_at?: string | null
          status?:
            | Database["public"]["Enums"]["anonymous_message_status"]
            | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          match_id?: string | null
          receiver_id_revealed?: never
          receiver_reveal_requested_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          revealed_at?: string | null
          sender_id?: string | null
          sender_reveal_requested_at?: string | null
          status?:
            | Database["public"]["Enums"]["anonymous_message_status"]
            | null
        }
        Relationships: []
      }
      v_economy_daily: {
        Row: {
          coins_in: number | null
          coins_out: number | null
          day: string | null
          peak_balance: number | null
          tx_in: number | null
          tx_out: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _pet_arcade_add_event: {
        Args: { _event_type: string; _game_id: string; _payload: Json }
        Returns: undefined
      }
      _pet_arcade_begin: {
        Args: {
          _client_seed: string
          _difficulty: string
          _entry: number
          _game_type: string
          _metadata?: Json
        }
        Returns: {
          client_seed: string
          created_at: string
          current_multiplier: number
          day: string
          difficulty: string | null
          ended_at: string | null
          entry_coins: number
          final_multiplier: number | null
          game_type: string
          id: string
          metadata: Json
          nonce: number
          result_summary: Json
          reward_coins: number
          server_seed: string
          server_seed_hash: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          user_pet_id: string
          xp_reward: number
        }
        SetofOptions: {
          from: "*"
          to: "pet_arcade_rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _pet_arcade_finish: {
        Args: {
          _game_id: string
          _multiplier: number
          _reward_override?: number
          _status: string
          _summary: Json
          _xp?: number
        }
        Returns: Json
      }
      _pet_arcade_progress_event: {
        Args: { _amount?: number; _event_key: string }
        Returns: undefined
      }
      _pet_arcade_result: { Args: { _game_id: string }; Returns: Json }
      _pet_streak_grant: {
        Args: {
          _coins: number
          _source: string
          _title: string
          _user: string
          _xp: number
        }
        Returns: undefined
      }
      activate_dating_membership: {
        Args: {
          _accepts_children: boolean
          _age_max: number
          _age_min: number
          _custom_states: string[]
          _essential_quality: string
          _height_cm: number
          _location_scope: Database["public"]["Enums"]["location_scope"]
          _looking_for_bio: string
          _marital: Database["public"]["Enums"]["marital_status"]
          _onboarding_version: string
          _pace: string
          _receive_anonymous?: boolean
          _seeking: string
          _sex: Database["public"]["Enums"]["sex_type"]
        }
        Returns: Database["public"]["Tables"]["dating_memberships"]["Row"]
      }
      admin_add_user_coins: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      admin_ban_user: {
        Args: { _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_delete_user_photo: {
        Args: {
          _photo_id: string
          _photo_url: string
          _reason: string
          _scope: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_economy_summary: { Args: { _days?: number }; Returns: Json }
      admin_grant_coins: {
        Args: { _amount: number; _note?: string; _user_id: string }
        Returns: Json
      }
      admin_hard_delete_user: {
        Args: { _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_remove_badge: {
        Args: { _code: string; _user_id: string }
        Returns: undefined
      }
      admin_search_users: {
        Args: { _limit?: number; _q?: string }
        Returns: {
          balance: number
          claim_streak: number
          full_name: string
          photo_url: string
          top_role: string
          user_id: string
        }[]
      }
      admin_unban_user: { Args: { _user_id: string }; Returns: undefined }
      admin_user_economy: {
        Args: { _limit?: number; _user_id: string }
        Returns: Json
      }
      anon_check_restricted: { Args: { _text: string }; Returns: undefined }
      answer_quiz: {
        Args: { _chosen: number; _question_id: string }
        Returns: {
          correct: boolean
          correct_index: number
          explanation: string
          reference: string
        }[]
      }
      apply_pet_care: {
        Args: { _item_id: string; _user_pet_id: string }
        Returns: Json
      }
      award_contributor_badge: {
        Args: { _amount?: number; _note?: string; _user_id: string }
        Returns: undefined
      }
      award_xp: {
        Args: {
          _amount: number
          _daily_cap?: number
          _meta?: Json
          _source: string
        }
        Returns: Json
      }
      bump_achievement_slug: {
        Args: { _inc?: number; _slug: string; _user_id: string }
        Returns: undefined
      }
      buy_anonymous_extra: {
        Args: never
        Returns: {
          coin_balance: number
          extras: number
        }[]
      }
      can_access_support_ticket: {
        Args: { _ticket_id: string }
        Returns: boolean
      }
      cancel_account_deletion: { Args: never; Returns: undefined }
      cancel_pet_piggybank: { Args: { _game_id: string }; Returns: Json }
      cashout_pet_hilo: { Args: { _game_id: string }; Returns: Json }
      cashout_pet_towers: { Args: { _game_id: string }; Returns: Json }
      check_text_restricted: { Args: { _text: string }; Returns: string }
      choose_pet_hilo: {
        Args: { _choice: string; _expected_step?: number; _game_id: string }
        Returns: Json
      }
      choose_pet_tower_tile: {
        Args: { _expected_floor?: number; _game_id: string; _tile: number }
        Returns: Json
      }
      claim_daily_coins: {
        Args: never
        Returns: {
          awarded: number
          balance: number
        }[]
      }
      claim_expedition: { Args: { _run_id: string }; Returns: Json }
      claim_free_frame: { Args: { _decoration_id: string }; Returns: Json }
      claim_freebie: {
        Args: { _category: string; _item_id: string; _rarity: string }
        Returns: Json
      }
      claim_pet_album_category: { Args: { _category: string }; Returns: Json }
      claim_pet_arcade_mission: {
        Args: { _assignment_id: string }
        Returns: Json
      }
      claim_pet_piggybank: { Args: { _game_id: string }; Returns: Json }
      claim_pet_surprise_egg: {
        Args: { _egg_id: string; _instant?: boolean }
        Returns: Json
      }
      claim_pet_weekly_chest: { Args: never; Returns: Json }
      claim_starter_bundle: { Args: never; Returns: Json }
      cleanup_photo_moderation_rejects: { Args: never; Returns: number }
      collect_pet_arcade_flight: { Args: { _round_id: string }; Returns: Json }
      collect_pet_arcade_treasure: {
        Args: { _round_id: string }
        Returns: Json
      }
      collect_pet_reward: {
        Args: never
        Returns: {
          awarded: number
          balance: number
          source: string
        }[]
      }
      consume_care_inventory: { Args: { _item_id: string }; Returns: boolean }
      complete_community_onboarding: {
        Args: {
          _bio: string
          _birth_date: string
          _church: string
          _city: string
          _faith_moment: string
          _full_name: string
          _photo_url: string
          _questionnaire_version: string
          _state: string
          _years_baptized: number
        }
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
      }
      count_advanced_sections: { Args: { _user_id: string }; Returns: number }
      create_notification: {
        Args: {
          _actor_id?: string
          _body?: string
          _entity_id?: string
          _link?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      current_terms_version: { Args: never; Returns: string }
      deactivate_dating_membership: {
        Args: never
        Returns: Database["public"]["Tables"]["dating_memberships"]["Row"]
      }
      enqueue_pet_care_reminders: { Args: never; Returns: number }
      enqueue_push_for_shop_item: {
        Args: { p_emoji: string; p_label: string; p_name: string }
        Returns: undefined
      }
      equip_decoration: { Args: { _decoration_id: string }; Returns: Json }
      equip_name_gradient: { Args: { _gradient_id: string }; Returns: Json }
      equip_pet: { Args: { _user_pet_id: string }; Returns: undefined }
      equip_pet_background: {
        Args: { _background_id: string }
        Returns: undefined
      }
      equip_profile_background: {
        Args: { _background_id: string }
        Returns: undefined
      }
      equip_user_pet_v2: { Args: { _user_pet_id: string }; Returns: undefined }
      evolve_my_pet: { Args: never; Returns: Json }
      expire_anonymous_messages: { Args: never; Returns: number }
      finalize_pet_arcade_flight: { Args: { _round_id: string }; Returns: Json }
      finish_pet_coinflip: { Args: { _game_id: string }; Returns: Json }
      finish_pet_dice: { Args: { _game_id: string }; Returns: Json }
      finish_pet_keno: { Args: { _game_id: string }; Returns: Json }
      finish_pet_memory: { Args: { _game_id: string }; Returns: Json }
      finish_pet_plinko: { Args: { _game_id: string }; Returns: Json }
      finish_pet_race: { Args: { _game_id: string }; Returns: Json }
      finish_pet_wheel: { Args: { _game_id: string }; Returns: Json }
      freebie_required_level: {
        Args: { _category: string; _rarity: string }
        Returns: number
      }
      get_active_expedition: {
        Args: { _user_pet_id: string }
        Returns: {
          coin_reward: number
          crit_rate: number
          difficulty: string
          duration_minutes: number
          ends_at: string
          expedition_id: string
          icon: string
          image_url: string
          item_reward_label: string
          run_id: string
          slug: string
          started_at: string
          success_rate: number
          title: string
          xp_reward: number
        }[]
      }
      get_active_pet_perks: {
        Args: { _user_id: string }
        Returns: {
          benefit_id: string
          effect_key: string
          effect_param: number
          effect_target_id: string
          label: string
        }[]
      }
      get_active_streak: {
        Args: { _user_id: string }
        Returns: {
          best_streak: number
          current_streak: number
          last_day: string
          total_days: number
        }[]
      }
      get_admin_ids: { Args: never; Returns: string[] }
      get_anonymous_cooldown: {
        Args: { _receiver_id: string }
        Returns: {
          can_send: boolean
          reason: string
          seconds_remaining: number
        }[]
      }
      get_anonymous_quota: {
        Args: never
        Returns: {
          daily_free: number
          daily_used: number
          extras: number
          free_remaining: number
          total_remaining: number
        }[]
      }
      get_flagged_message_ids: { Args: never; Returns: string[] }
      get_grab_state: { Args: never; Returns: Json }
      get_hidden_staff_ids: { Args: never; Returns: string[] }
      get_my_coins: {
        Args: never
        Returns: {
          balance: number
          can_claim_today: boolean
          last_claim_date: string
        }[]
      }
      get_my_missions: {
        Args: never
        Returns: {
          active_streak: number
          advanced_sections: number
          advanced_target: number
          best_streak: number
          devotional_count_14: number
          devotional_target: number
          has_first_devotional: boolean
          has_first_match: boolean
          prayer_count_7: number
          prayer_target: number
          profile_complete: boolean
        }[]
      }
      get_my_prestige: { Args: never; Returns: Json }
      get_my_rebirth_history: {
        Args: never
        Returns: {
          created_at: string
          id: string
          medal: string
          prestige_level: number
          xp_at_rebirth: number
        }[]
      }
      get_my_starter_bundle: { Args: never; Returns: Json }
      get_my_terms_status: {
        Args: never
        Returns: {
          accepted: boolean
          accepted_at: string
          accepted_version: string
          current_version: string
        }[]
      }
      get_my_xp_state: { Args: never; Returns: Json }
      get_next_pet_confession: {
        Args: never
        Returns: {
          category: string
          effect_delta: number
          effect_kind: string
          id: string
          text: string
        }[]
      }
      get_pet_album_state: { Args: never; Returns: Json }
      get_pet_arcade_active_rounds: { Args: never; Returns: Json }
      get_pet_arcade_catalog: { Args: never; Returns: Json }
      get_pet_arcade_config: { Args: never; Returns: Json }
      get_pet_arcade_daily_missions: { Args: never; Returns: Json }
      get_pet_arcade_history: { Args: { _limit?: number }; Returns: Json }
      get_pet_arcade_history_v2: { Args: { _limit?: number }; Returns: Json }
      get_pet_arcade_usage_today: { Args: never; Returns: Json }
      get_pet_dream_match: {
        Args: never
        Returns: {
          age: number
          city: string
          full_name: string
          id: string
          photo_url: string
          state: string
        }[]
      }
      get_pet_evolution_status: { Args: never; Returns: Json }
      get_pet_streak: { Args: never; Returns: Json }
      get_pet_weekly_chest: { Args: never; Returns: Json }
      get_prayer_streak: {
        Args: { _user_id: string }
        Returns: {
          best_streak: number
          current_streak: number
          last_day: string
        }[]
      }
      get_received_gifts_public: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          created_at: string
          gift_category: Database["public"]["Enums"]["gift_category"]
          gift_emoji: string
          gift_id: string
          gift_image_url: string
          gift_name: string
          gift_rarity: Database["public"]["Enums"]["gift_rarity"]
          id: string
          message: string
          sender_id: string
        }[]
      }
      get_today_expeditions: {
        Args: never
        Returns: {
          coin_reward: number
          crit_rate: number
          description: string
          difficulty: string
          duration_minutes: number
          energy_cost: number
          expedition_id: string
          icon: string
          id: string
          image_url: string
          item_reward_label: string
          min_user_level: number
          sent_at: string
          slug: string
          success_rate: number
          title: string
          xp_reward: number
        }[]
      }
      get_today_missions: {
        Args: never
        Returns: {
          action_key: string
          category: string
          coin_reward: number
          completed_at: string
          description: string
          difficulty: string
          icon: string
          id: string
          mission_id: string
          progress: number
          slug: string
          target: number
          title: string
          xp_reward: number
        }[]
      }
      get_today_quiz: {
        Args: never
        Returns: {
          already_answered: boolean
          chosen_index: number
          correct_index: number
          difficulty: string
          explanation: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          question: string
          reference: string
          was_correct: boolean
        }[]
      }
      get_user_equipped_pet_image: { Args: { _uid: string }; Returns: string }
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      grab_prize_rarity: {
        Args: {
          _amount: number
          _kind: Database["public"]["Enums"]["grab_prize_kind"]
          _ref_id: string
        }
        Returns: string
      }
      grab_rarity_rank: { Args: { _r: string }; Returns: number }
      grant_coin_event: {
        Args: { _amount: number; _ref: string; _user: string }
        Returns: undefined
      }
      has_accepted_current_terms: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ignore_anonymous_message: {
        Args: { _message_id: string }
        Returns: undefined
      }
      increment_article_views: { Args: { _slug: string }; Returns: undefined }
      is_adult_pet_unlocked: { Args: { _user_id: string }; Returns: boolean }
      is_match_participant: { Args: { _match_id: string }; Returns: boolean }
      is_pet_catalog_admin: { Args: never; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_support_staff: { Args: { _user_id: string }; Returns: boolean }
      level_from_xp: { Args: { _xp: number }; Returns: number }
      list_my_freebie_status: {
        Args: never
        Returns: {
          category: string
          claimed: boolean
          claimed_item_id: string
          rarity: string
          required_level: number
          unlocked: boolean
        }[]
      }
      log_coin_tx: {
        Args: {
          _amount: number
          _balance_after: number
          _direction: string
          _icon_url?: string
          _kind: string
          _ref_id?: string
          _subtitle?: string
          _title: string
          _user_id: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_message_read: { Args: { _message_id: string }; Returns: undefined }
      medal_for_prestige: { Args: { _level: number }; Returns: string }
      open_pet_album_pack: {
        Args: { _client_seed?: string; _pack_size: number }
        Returns: Json
      }
      pause_dating_membership: {
        Args: never
        Returns: Database["public"]["Tables"]["dating_memberships"]["Row"]
      }
      perform_grab: { Args: { _pool_id: string }; Returns: Json }
      perform_grab_multi: {
        Args: { _count: number; _pool_id: string }
        Returns: Json
      }
      pet_arcade_admin_metrics: { Args: never; Returns: Json }
      pet_arcade_admin_recent_rounds: {
        Args: { _limit?: number }
        Returns: {
          client_seed: string
          created_at: string
          current_multiplier: number
          day: string
          difficulty: string | null
          ended_at: string | null
          entry_coins: number
          final_multiplier: number | null
          game_type: string
          id: string
          metadata: Json
          nonce: number
          result_summary: Json
          reward_coins: number
          server_seed: string
          server_seed_hash: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          user_pet_id: string
          xp_reward: number
        }[]
        SetofOptions: {
          from: "*"
          to: "pet_arcade_rounds"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pet_arcade_admin_update_config: { Args: { _patch: Json }; Returns: Json }
      pet_arcade_admin_update_game_config: {
        Args: { _game_type: string; _patch: Json }
        Returns: Json
      }
      pet_arcade_admin_update_settings: {
        Args: { _patch: Json }
        Returns: Json
      }
      pet_arcade_admin_user_signals: {
        Args: never
        Returns: {
          high_activity: boolean
          net_coins: number
          rounds_7d: number
          total_entries: number
          total_rewards: number
          user_id: string
        }[]
      }
      pet_arcade_flight_multiplier_at: {
        Args: { _at: string; _max: number; _started_at: string }
        Returns: number
      }
      pet_arcade_seed_unit: {
        Args: {
          _client_seed: string
          _counter: number
          _nonce: number
          _server_seed: string
        }
        Returns: number
      }
      pet_arcade_settle_reward: {
        Args: { _multiplier: number; _round_id: string; _title: string }
        Returns: Json
      }
      pet_arcade_treasure_multiplier: {
        Args: {
          _grid_size: number
          _max: number
          _safe_reveals: number
          _trap_count: number
        }
        Returns: number
      }
      pet_care_uses_today: {
        Args: { _item_id: string; _user_pet_id: string }
        Returns: number
      }
      pet_daypart_sp: { Args: { _now?: string }; Returns: string }
      pet_effect_condition_passes: {
        Args: {
          _condition_kind: string
          _condition_op: string
          _condition_value: number
          _values: Json
        }
        Returns: boolean
      }
      pet_perk_has: {
        Args: { _key: string; _user_id: string }
        Returns: boolean
      }
      pet_perk_sum: {
        Args: { _keys: string[]; _user_id: string }
        Returns: number
      }
      pet_runtime_modifiers: { Args: { _user_pet_id: string }; Returns: Json }
      pet_state_snapshot: { Args: { _user_pet_id: string }; Returns: Json }
      prestige_rebirth: { Args: never; Returns: Json }
      progress_mission_action: {
        Args: { _action_key: string; _inc?: number; _user_id: string }
        Returns: undefined
      }
      purchase_avatar_item: { Args: { _item_id: string }; Returns: Json }
      purchase_decoration: { Args: { _decoration_id: string }; Returns: Json }
      purchase_name_gradient: { Args: { _gradient_id: string }; Returns: Json }
      purchase_profile_background: {
        Args: { _background_id: string }
        Returns: Json
      }
      recompute_all_badges: { Args: never; Returns: undefined }
      recompute_user_badges: { Args: { _user_id: string }; Returns: undefined }
      redeem_virtual_gift: { Args: { _tx_id: string }; Returns: number }
      reply_anonymous_message: {
        Args: { _message_id: string; _reply: string }
        Returns: undefined
      }
      report_anonymous_message: {
        Args: { _message_id: string; _reason: string }
        Returns: undefined
      }
      request_account_deactivation: { Args: never; Returns: undefined }
      request_account_deletion: { Args: { _confirm: string }; Returns: string }
      request_account_reactivation: { Args: never; Returns: undefined }
      request_anonymous_hint: {
        Args: { _message_id: string }
        Returns: undefined
      }
      request_anonymous_reveal: {
        Args: { _message_id: string }
        Returns: string
      }
      request_reverification: { Args: { _message: string }; Returns: string }
      resume_pet_arcade_game: { Args: { _game_id: string }; Returns: Json }
      reveal_pet_arcade_treasure: {
        Args: { _position: number; _round_id: string }
        Returns: Json
      }
      reveal_pet_memory_card: {
        Args: { _game_id: string; _position: number }
        Returns: Json
      }
      roll_daily_expeditions: { Args: never; Returns: undefined }
      roll_daily_missions: {
        Args: never
        Returns: {
          completed_at: string | null
          created_at: string
          day: string
          id: string
          mission_id: string
          progress: number
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_daily_missions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      rotate_grab_featured_pool: { Args: never; Returns: undefined }
      run_reactivation_reminders: { Args: never; Returns: number }
      send_anonymous_hint: {
        Args: { _hint_option_id: string; _message_id: string }
        Returns: undefined
      }
      send_anonymous_hint_text: {
        Args: {
          _category: Database["public"]["Enums"]["anonymous_hint_category"]
          _message_id: string
          _text: string
        }
        Returns: undefined
      }
      send_anonymous_message: {
        Args: { _content: string; _receiver_id: string }
        Returns: string
      }
      send_virtual_gift: {
        Args: { _gift_id: string; _message?: string; _receiver_id: string }
        Returns: string
      }
      set_anonymous_optout: { Args: { _accept: boolean }; Returns: undefined }
      spend_coin: { Args: { _amount?: number }; Returns: number }
      spend_coin_for_pet_care: {
        Args: { _amount: number; _item_id: string; _user_pet_id: string }
        Returns: number
      }
      start_expedition: {
        Args: { _expedition_id: string; _user_pet_id: string }
        Returns: string
      }
      start_pet_arcade_flight: {
        Args: {
          _auto_collect_multiplier?: number
          _client_seed?: string
          _entry_coins: number
        }
        Returns: Json
      }
      start_pet_arcade_treasure: {
        Args: {
          _client_seed?: string
          _difficulty: string
          _entry_coins: number
        }
        Returns: Json
      }
      start_pet_capsule: {
        Args: { _client_seed?: string; _entry_coins: number }
        Returns: Json
      }
      start_pet_coinflip: {
        Args: { _client_seed?: string; _entry_coins: number; _side: string }
        Returns: Json
      }
      start_pet_dice: {
        Args: {
          _client_seed?: string
          _condition: string
          _entry_coins: number
          _target: number
        }
        Returns: Json
      }
      start_pet_hilo: {
        Args: { _client_seed?: string; _entry_coins: number }
        Returns: Json
      }
      start_pet_keno: {
        Args: {
          _chosen_numbers: number[]
          _client_seed?: string
          _entry_coins: number
        }
        Returns: Json
      }
      start_pet_memory: {
        Args: {
          _client_seed?: string
          _difficulty: string
          _entry_coins: number
        }
        Returns: Json
      }
      start_pet_piggybank: {
        Args: { _deposit: number; _hours?: number }
        Returns: Json
      }
      start_pet_plinko: {
        Args: {
          _client_seed?: string
          _difficulty: string
          _entry_coins: number
        }
        Returns: Json
      }
      start_pet_race: {
        Args: { _client_seed?: string; _entry_coins: number }
        Returns: Json
      }
      start_pet_scratch: {
        Args: { _client_seed?: string; _entry_coins: number }
        Returns: Json
      }
      start_pet_surprise_egg: { Args: { _entry_coins: number }; Returns: Json }
      start_pet_towers: {
        Args: {
          _client_seed?: string
          _difficulty: string
          _entry_coins: number
        }
        Returns: Json
      }
      start_pet_wheel: {
        Args: {
          _client_seed?: string
          _difficulty: string
          _entry_coins: number
        }
        Returns: Json
      }
      stage_legacy_dating_memberships: {
        Args: { _batch_size?: number; _legacy_cutover_at: string }
        Returns: number
      }
      sync_level_achievements: {
        Args: { _level: number; _user_id: string }
        Returns: undefined
      }
      touch_my_activity: { Args: never; Returns: undefined }
      track_achievement: {
        Args: {
          _action?: string
          _category: string
          _inc?: number
          _user_id: string
        }
        Returns: undefined
      }
      unaccent_safe: { Args: { input: string }; Returns: string }
      unequip_decoration: {
        Args: { _type: Database["public"]["Enums"]["decoration_type"] }
        Returns: Json
      }
      unequip_name_gradient: { Args: never; Returns: Json }
      unequip_profile_background: { Args: never; Returns: undefined }
      unignore_anonymous_message: {
        Args: { _message_id: string }
        Returns: undefined
      }
      unlock_adult_pet_with_coins: { Args: { _cost?: number }; Returns: Json }
      unlock_pet_background: {
        Args: { _background_id: string }
        Returns: string
      }
      unmatch: { Args: { _match_id: string }; Returns: undefined }
      xp_for_level: { Args: { _level: number }; Returns: number }
    }
    Enums: {
      anonymous_hint_category:
        | "idade"
        | "regiao"
        | "personalidade"
        | "fe"
        | "compatibilidade"
      anonymous_message_status:
        | "pending"
        | "hint_requested"
        | "hint_sent"
        | "replied"
        | "reveal_requested"
        | "revealed"
        | "ignored"
        | "reported"
        | "expired"
      app_role: "admin" | "user" | "super_admin" | "apresentador" | "moderador"
      couple_status: "aceitaram_conversar" | "namorando" | "casamento_marcado"
      daily_post_kind: "news" | "devotional"
      decoration_type: "frame" | "aura" | "sticker"
      devotional_reaction: "heart" | "prayed" | "edify"
      gift_category:
        | "romantic"
        | "spiritual"
        | "caring"
        | "friendship"
        | "fun"
        | "legendary"
      gift_rarity: "common" | "rare" | "epic" | "legendary" | "exclusive"
      gift_tx_status: "held" | "redeemed"
      grab_prize_kind:
        | "care_item"
        | "pet_background"
        | "decoration"
        | "name_gradient"
        | "coins"
        | "xp"
      location_scope: "regiao" | "brasil" | "mundo" | "personalizado"
      marital_status: "solteiro" | "divorciado" | "viuvo"
      pet_care_kind: "feed" | "play" | "hygiene" | "sleep" | "affection"
      pet_rarity: "common" | "rare" | "epic" | "legendary"
      photo_moderation_scope: "avatar" | "extra"
      photo_moderation_status: "pending" | "approved" | "rejected"
      prayer_category:
        | "health"
        | "family"
        | "relationship"
        | "financial"
        | "spiritual"
        | "other"
      prayer_moderation_status: "visible" | "hidden" | "removed"
      profile_status: "pending" | "approved" | "rejected" | "banned"
      report_status: "open" | "reviewed" | "dismissed"
      sex_type: "masculino" | "feminino"
      support_category:
        | "account"
        | "payments"
        | "profile"
        | "matches"
        | "community"
        | "technical"
        | "security"
        | "other"
      support_priority: "low" | "medium" | "high" | "urgent"
      support_status:
        | "open"
        | "in_review"
        | "awaiting_user"
        | "resolved"
        | "closed"
      verification_status: "pending" | "approved" | "rejected" | "more_info"
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
      anonymous_hint_category: [
        "idade",
        "regiao",
        "personalidade",
        "fe",
        "compatibilidade",
      ],
      anonymous_message_status: [
        "pending",
        "hint_requested",
        "hint_sent",
        "replied",
        "reveal_requested",
        "revealed",
        "ignored",
        "reported",
        "expired",
      ],
      app_role: ["admin", "user", "super_admin", "apresentador", "moderador"],
      couple_status: ["aceitaram_conversar", "namorando", "casamento_marcado"],
      daily_post_kind: ["news", "devotional"],
      decoration_type: ["frame", "aura", "sticker"],
      devotional_reaction: ["heart", "prayed", "edify"],
      gift_category: [
        "romantic",
        "spiritual",
        "caring",
        "friendship",
        "fun",
        "legendary",
      ],
      gift_rarity: ["common", "rare", "epic", "legendary", "exclusive"],
      gift_tx_status: ["held", "redeemed"],
      grab_prize_kind: [
        "care_item",
        "pet_background",
        "decoration",
        "name_gradient",
        "coins",
        "xp",
      ],
      location_scope: ["regiao", "brasil", "mundo", "personalizado"],
      marital_status: ["solteiro", "divorciado", "viuvo"],
      pet_care_kind: ["feed", "play", "hygiene", "sleep", "affection"],
      pet_rarity: ["common", "rare", "epic", "legendary"],
      photo_moderation_scope: ["avatar", "extra"],
      photo_moderation_status: ["pending", "approved", "rejected"],
      prayer_category: [
        "health",
        "family",
        "relationship",
        "financial",
        "spiritual",
        "other",
      ],
      prayer_moderation_status: ["visible", "hidden", "removed"],
      profile_status: ["pending", "approved", "rejected", "banned"],
      report_status: ["open", "reviewed", "dismissed"],
      sex_type: ["masculino", "feminino"],
      support_category: [
        "account",
        "payments",
        "profile",
        "matches",
        "community",
        "technical",
        "security",
        "other",
      ],
      support_priority: ["low", "medium", "high", "urgent"],
      support_status: [
        "open",
        "in_review",
        "awaiting_user",
        "resolved",
        "closed",
      ],
      verification_status: ["pending", "approved", "rejected", "more_info"],
    },
  },
} as const
