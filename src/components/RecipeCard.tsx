'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'; 
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { Heart, Clock, Users, Star, UtensilsCrossed, Eye, ChefHat } from 'lucide-react'

import { RecipeWithDetails } from '@/types/database'
import { formatDuration, formatRelativeTime, getDifficultyColor, generateRecipeSlug } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface RecipeCardProps {
  recipe: RecipeWithDetails
  showAuthor?: boolean
  onLike?: () => void
}

export default function RecipeCard({ recipe, showAuthor = true, onLike }: RecipeCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(recipe.is_liked || false)
  const [likeCount, setLikeCount] = useState(recipe.like_count)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      // Redirect to sign in
      window.location.href = '/auth/signin'
      return
    }

    setLoading(true)
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('recipe_likes')
          .delete()
          .eq('recipe_id', recipe.id)
          .eq('user_id', user.id)

        if (!error) {
          setIsLiked(false)
          setLikeCount(prev => prev - 1)
        }
      } else {
        // Like
        const { error } = await supabase
          .from('recipe_likes')
          .insert({
            recipe_id: recipe.id,
            user_id: user.id
          })

        if (!error) {
          setIsLiked(true)
          setLikeCount(prev => prev + 1)
        }
      }
      
      onLike?.()
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCollection = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      // Redirect to sign in
      window.location.href = '/auth/signin'
      return
    }

    setLoading(true)
    
    try {
      // First, try to find or create a "Saved Recipes" collection
      const { data: collections, error: fetchError } = await supabase
        .from('recipe_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Saved Recipes')
        .single()

      let savedCollection = collections

      if (fetchError && fetchError.code === 'PGRST116') {
        // Collection doesn't exist, create it
        const { data: newCollection, error: createError } = await supabase
          .from('recipe_collections')
          .insert({
            name: 'Saved Recipes',
            description: 'Automatically saved recipes',
            user_id: user.id,
            is_public: false
          })
          .select('id')
          .single()

        if (createError) throw createError
        savedCollection = newCollection
      } else if (fetchError) {
        throw fetchError
      }

      if (!savedCollection?.id) throw new Error('Failed to get collection ID')

      // Now add the recipe to the collection
      const { error: addError } = await supabase
        .from('collection_recipes')
        .insert({
          collection_id: savedCollection.id,
          recipe_id: recipe.id
        })

      if (addError) {
        if (addError.code === '23505') { // Unique constraint violation
          alert('Recipe is already saved!')
          return
        }
        throw addError
      }

      alert('Recipe saved to collection!')
      
    } catch (error) {
      console.error('Error adding to collection:', error)
      alert('Failed to save recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRecipeImage = () => {
    if (recipe.image_url) {
      return recipe.image_url
    }
    
    return '/placeholder-recipe.svg'
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <Link href={`/recipes/${generateRecipeSlug(recipe.title, recipe.id)}`} onClick={() => console.log('Clicking recipe card:', recipe.title, 'ID:', recipe.id, 'Generated slug:', generateRecipeSlug(recipe.title, recipe.id))}>
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={getRecipeImage()}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {recipe.difficulty && (
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(recipe.difficulty)}`}>
                {recipe.difficulty}
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {recipe.is_vegetarian && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">
                Veg
              </span>
            )}
            {recipe.is_vegan && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">
                Vegan
              </span>
            )}
          </div>
        </div>
      </Link>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link href={`/recipes/${generateRecipeSlug(recipe.title, recipe.id)}`}>
              <h3 className="font-semibold text-lg leading-tight group-hover:text-orange-500 transition-colors line-clamp-2">
                {recipe.title}
              </h3>
            </Link>
            {recipe.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>
        </div>

        {showAuthor && recipe.author && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <ChefHat className="h-3 w-3 text-gray-600" />
            </div>
            <Link 
              href={`/profile/${recipe.author.username}`}
              className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
            >
              {recipe.author.full_name || recipe.author.username}
            </Link>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-4">
            {recipe.prep_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(recipe.prep_time + (recipe.cook_time || 0))}</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{recipe.servings}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{recipe.view_count}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={handleAddToCollection}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors disabled:opacity-50"
              title="Add recipe to collection"
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span>Collection</span>
            </button>

            {recipe.average_rating && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{recipe.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400">
            {formatRelativeTime(recipe.created_at)}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
