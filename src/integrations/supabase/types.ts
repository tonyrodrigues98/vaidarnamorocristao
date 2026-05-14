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
      profile_photos: {
        Row: {
          ai_checked_at: string | null
          ai_confidence: number | null
          ai_verified: boolean
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
          contributor_highlight: boolean
          created_at: string
          deactivated_at: string | null
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          full_name: string
          height_cm: number | null
          id: string
          is_anonymized: boolean
          marital: Database["public"]["Enums"]["marital_status"]
          photo_url: string | null
          rejection_reason: string | null
          sex: Database["public"]["Enums"]["sex_type"]
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
          contributor_highlight?: boolean
          created_at?: string
          deactivated_at?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          full_name: string
          height_cm?: number | null
          id: string
          is_anonymized?: boolean
          marital: Database["public"]["Enums"]["marital_status"]
          photo_url?: string | null
          rejection_reason?: string | null
          sex: Database["public"]["Enums"]["sex_type"]
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
          contributor_highlight?: boolean
          created_at?: string
          deactivated_at?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          full_name?: string
          height_cm?: number | null
          id?: string
          is_anonymized?: boolean
          marital?: Database["public"]["Enums"]["marital_status"]
          photo_url?: string | null
          rejection_reason?: string | null
          sex?: Database["public"]["Enums"]["sex_type"]
          state?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          years_baptized?: number
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
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      admin_hard_delete_user: {
        Args: { _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_remove_badge: {
        Args: { _code: string; _user_id: string }
        Returns: undefined
      }
      admin_unban_user: { Args: { _user_id: string }; Returns: undefined }
      award_contributor_badge: {
        Args: { _amount?: number; _note?: string; _user_id: string }
        Returns: undefined
      }
      cancel_account_deletion: { Args: never; Returns: undefined }
      cleanup_photo_moderation_rejects: { Args: never; Returns: number }
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
      get_flagged_message_ids: { Args: never; Returns: string[] }
      get_hidden_staff_ids: { Args: never; Returns: string[] }
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
      get_my_terms_status: {
        Args: never
        Returns: {
          accepted: boolean
          accepted_at: string
          accepted_version: string
          current_version: string
        }[]
      }
      get_prayer_streak: {
        Args: { _user_id: string }
        Returns: {
          best_streak: number
          current_streak: number
          last_day: string
        }[]
      }
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      increment_article_views: { Args: { _slug: string }; Returns: undefined }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_support_staff: { Args: { _user_id: string }; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_message_read: { Args: { _message_id: string }; Returns: undefined }
      recompute_all_badges: { Args: never; Returns: undefined }
      recompute_user_badges: { Args: { _user_id: string }; Returns: undefined }
      request_account_deactivation: { Args: never; Returns: undefined }
      request_account_deletion: { Args: { _confirm: string }; Returns: string }
      request_account_reactivation: { Args: never; Returns: undefined }
      run_reactivation_reminders: { Args: never; Returns: number }
      touch_my_activity: { Args: never; Returns: undefined }
      unaccent_safe: { Args: { input: string }; Returns: string }
      unmatch: { Args: { _match_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin" | "apresentador" | "moderador"
      couple_status: "aceitaram_conversar" | "namorando" | "casamento_marcado"
      daily_post_kind: "news" | "devotional"
      devotional_reaction: "heart" | "prayed" | "edify"
      location_scope: "regiao" | "brasil" | "mundo" | "personalizado"
      marital_status: "solteiro" | "divorciado"
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
      app_role: ["admin", "user", "super_admin", "apresentador", "moderador"],
      couple_status: ["aceitaram_conversar", "namorando", "casamento_marcado"],
      daily_post_kind: ["news", "devotional"],
      devotional_reaction: ["heart", "prayed", "edify"],
      location_scope: ["regiao", "brasil", "mundo", "personalizado"],
      marital_status: ["solteiro", "divorciado"],
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
