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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          created_at: string
          detected_patterns: Json
          experience_id: string
          id: string
          self_doubt_detected: boolean
        }
        Insert: {
          created_at?: string
          detected_patterns?: Json
          experience_id: string
          id?: string
          self_doubt_detected?: boolean
        }
        Update: {
          created_at?: string
          detected_patterns?: Json
          experience_id?: string
          id?: string
          self_doubt_detected?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "analyses_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          created_at: string
          feeling: string
          id: string
          journal_user_id: string
          note: string | null
        }
        Insert: {
          created_at?: string
          feeling: string
          id?: string
          journal_user_id: string
          note?: string | null
        }
        Update: {
          created_at?: string
          feeling?: string
          id?: string
          journal_user_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_journal_user_id_fkey"
            columns: ["journal_user_id"]
            isOneToOne: false
            referencedRelation: "journal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          context_feeling: string | null
          context_where: string | null
          contributed: boolean
          created_at: string
          description: string
          id: string
          journal_user_id: string | null
          self_doubt: string | null
        }
        Insert: {
          context_feeling?: string | null
          context_where?: string | null
          contributed?: boolean
          created_at?: string
          description: string
          id?: string
          journal_user_id?: string | null
          self_doubt?: string | null
        }
        Update: {
          context_feeling?: string | null
          context_where?: string | null
          contributed?: boolean
          created_at?: string
          description?: string
          id?: string
          journal_user_id?: string | null
          self_doubt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_journal_user_id_fkey"
            columns: ["journal_user_id"]
            isOneToOne: false
            referencedRelation: "journal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_users: {
        Row: {
          created_at: string
          id: string
          passphrase_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          passphrase_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          passphrase_hash?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          safety_note: string | null
          scripts: Json
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          safety_note?: string | null
          scripts: Json
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          safety_note?: string | null
          scripts?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scripts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_summaries: {
        Row: {
          created_at: string
          experience_id: string
          expires_at: string
          id: string
          summary_data: Json
        }
        Insert: {
          created_at?: string
          experience_id: string
          expires_at?: string
          id?: string
          summary_data: Json
        }
        Update: {
          created_at?: string
          experience_id?: string
          expires_at?: string
          id?: string
          summary_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "shared_summaries_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string
          experience_id: string
          featured: boolean
          id: string
          primary_pattern: string
          reported: boolean
          resonates: number
          story: string
          title: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          featured?: boolean
          id?: string
          primary_pattern: string
          reported?: boolean
          resonates?: number
          story: string
          title: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          featured?: boolean
          id?: string
          primary_pattern?: string
          reported?: boolean
          resonates?: number
          story?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          resonated: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          resonated: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          resonated?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_resonates: { Args: { story_id: string }; Returns: undefined }
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
