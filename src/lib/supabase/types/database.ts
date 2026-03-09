/**
 * Supabase Database type definitions.
 * These types match the migration schema for profiles and pr_baselines tables.
 * In production, these would be generated via `supabase gen types typescript`.
 */

export interface Profile {
  id: string; // UUID, references auth.users(id)
  display_name: string;
  avatar_url: string | null;
  preferred_unit: 'kg' | 'lbs';
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface PRBaseline {
  id: string; // UUID
  user_id: string; // UUID, references auth.users(id)
  exercise_name: string; // 'bench_press' | 'squat' | 'deadlift'
  weight: number; // NUMERIC(6,2)
  unit: 'kg' | 'lbs';
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      pr_baselines: {
        Row: PRBaseline;
        Insert: Omit<PRBaseline, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PRBaseline, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
