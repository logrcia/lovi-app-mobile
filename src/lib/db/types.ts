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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      albums: {
        Row: {
          cover_memory_id: string | null
          created_at: string
          description: string | null
          id: string
          pet_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_memory_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pet_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_memory_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pet_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_cover_memory_id_fkey"
            columns: ["cover_memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          id: string
          location: string | null
          notes: string | null
          pet_id: string
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          pet_id: string
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          pet_id?: string
          starts_at?: string
          title?: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          album_id: string | null
          created_at: string
          description: string | null
          happened_at: string
          id: string
          media_duration_seconds: number | null
          media_path: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          pet_id: string
          title: string
          updated_at: string
        }
        Insert: {
          album_id?: string | null
          created_at?: string
          description?: string | null
          happened_at?: string
          id?: string
          media_duration_seconds?: number | null
          media_path?: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          pet_id: string
          title: string
          updated_at?: string
        }
        Update: {
          album_id?: string | null
          created_at?: string
          description?: string | null
          happened_at?: string
          id?: string
          media_duration_seconds?: number | null
          media_path?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          pet_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_follows: {
        Row: {
          created_at: string
          follower_id: string
          pet_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          pet_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_follows_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          avatar_path: string | null
          bio: string
          birthday: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          species: Database["public"]["Enums"]["pet_species"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string
          birthday?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          species: Database["public"]["Enums"]["pet_species"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string
          birthday?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          species?: Database["public"]["Enums"]["pet_species"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string
          created_at: string
          handle: string
          id: string
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string
          created_at?: string
          handle: string
          id: string
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string
          created_at?: string
          handle?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      vaccines: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          name: string
          next_due_at: string | null
          notes: string | null
          pet_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          name: string
          next_due_at?: string | null
          notes?: string | null
          pet_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          name?: string
          next_due_at?: string | null
          notes?: string | null
          pet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_pet_owner: { Args: { target_pet_id: string }; Returns: boolean }
      path_pet_id: { Args: { object_name: string }; Returns: string }
    }
    Enums: {
      appointment_type: "vet" | "grooming" | "vaccination"
      media_type: "image" | "video" | "audio" | "text"
      pet_species: "dog" | "cat" | "rabbit" | "bird" | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_type: ["vet", "grooming", "vaccination"],
      media_type: ["image", "video", "audio", "text"],
      pet_species: ["dog", "cat", "rabbit", "bird", "other"],
    },
  },
} as const
