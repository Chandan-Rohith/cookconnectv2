'use client'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import RecipeCard from '@/components/RecipeCard'
import { createClient } from '@/lib/supabase/client'
import { RecipeWithDetails } from '@/types/database'
import { Heart } from 'lucide-react'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<RecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchFavorites()
  }, [user]) // Remove fetchFavorites from dependencies to avoid infinite loop

  const fetchFavorites = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('recipe_likes')
        .select(`
          recipe:recipes(
            *,
            author:profiles(*)
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Transform the data to match RecipeWithDetails format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedFavorites = data?.map((item: { recipe: any }) => ({
        ...item.recipe,
        is_liked: true,
        like_count: 0,
        fork_count: 0,
        ingredients: [],
        author: item.recipe.author || null
      })) || []

      setFavorites(transformedFavorites as RecipeWithDetails[])
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = () => {
    // Refresh favorites when a recipe is unliked
    fetchFavorites()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600">Please sign in to view your favorite recipes.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorite Recipes</h1>
          <p className="text-gray-600">Recipes you&apos;ve liked and want to save for later</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading your favorites...</div>
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onLike={handleLike}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Favorites Yet</h2>
            <p className="text-gray-600 mb-4">
              Start exploring recipes and click the heart icon to save your favorites!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}