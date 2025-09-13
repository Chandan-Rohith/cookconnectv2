export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          website: string | null
          location: string | null
          created_at: string
          updated_at: string
          recipe_count: number
          total_likes: number
          badge_tier: 'bronze' | 'silver' | 'gold'
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
          recipe_count?: number
          total_likes?: number
          badge_tier?: 'bronze' | 'silver' | 'gold'
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
          recipe_count?: number
          total_likes?: number
          badge_tier?: 'bronze' | 'silver' | 'gold'
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      allergies: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          description: string | null
          instructions: string
          prep_time: number | null
          cook_time: number | null
          servings: number | null
          difficulty: 'easy' | 'medium' | 'hard' | null
          image_url: string | null
          youtube_url: string | null
          is_public: boolean
          is_vegetarian: boolean
          is_vegan: boolean
          is_gluten_free: boolean
          is_dairy_free: boolean
          is_nut_free: boolean
          author_id: string
          category_id: string | null
          original_recipe_id: string | null
          fork_count: number
          like_count: number
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          instructions: string
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          image_url?: string | null
          youtube_url?: string | null
          is_public?: boolean
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_dairy_free?: boolean
          is_nut_free?: boolean
          author_id: string
          category_id?: string | null
          original_recipe_id?: string | null
          fork_count?: number
          like_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          instructions?: string
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          image_url?: string | null
          youtube_url?: string | null
          is_public?: boolean
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_dairy_free?: boolean
          is_nut_free?: boolean
          author_id?: string
          category_id?: string | null
          original_recipe_id?: string | null
          fork_count?: number
          like_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          name: string
          amount: string
          unit: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          name: string
          amount: string
          unit?: string | null
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          name?: string
          amount?: string
          unit?: string | null
          order_index?: number
          created_at?: string
        }
      }
      recipe_allergies: {
        Row: {
          id: string
          recipe_id: string
          allergy_id: string
        }
        Insert: {
          id?: string
          recipe_id: string
          allergy_id: string
        }
        Update: {
          id?: string
          recipe_id?: string
          allergy_id?: string
        }
      }
      recipe_likes: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          created_at?: string
        }
      }
      recipe_comments: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          content: string
          parent_comment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          content: string
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          content?: string
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      recipe_ratings: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      recipe_collections: {
        Row: {
          id: string
          name: string
          description: string | null
          is_public: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_public?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      collection_recipes: {
        Row: {
          id: string
          collection_id: string
          recipe_id: string
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          recipe_id: string
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          recipe_id?: string
          added_at?: string
        }
      }
      user_allergies: {
        Row: {
          id: string
          user_id: string
          allergy_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          allergy_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          allergy_id?: string
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

// Extended types with joins
export type RecipeWithDetails = Database['public']['Tables']['recipes']['Row'] & {
  author: Database['public']['Tables']['profiles']['Row']
  category: Database['public']['Tables']['categories']['Row'] | null
  ingredients: Database['public']['Tables']['recipe_ingredients']['Row'][]
  allergies: Database['public']['Tables']['allergies']['Row'][]
  is_liked?: boolean
  user_rating?: number
  average_rating?: number
  comment_count?: number
}

export type ProfileWithStats = Database['public']['Tables']['profiles']['Row'] & {
  follower_count?: number
  following_count?: number
  is_following?: boolean
}

export type CommentWithAuthor = Database['public']['Tables']['recipe_comments']['Row'] & {
  author: Database['public']['Tables']['profiles']['Row']
  replies?: CommentWithAuthor[]
}

export type CollectionWithRecipes = Database['public']['Tables']['recipe_collections']['Row'] & {
  recipes: RecipeWithDetails[]
  recipe_count: number
}
