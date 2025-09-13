'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RecipeWithDetails } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { Clock, Users, Heart, UtensilsCrossed, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { generateRecipeSlug } from '@/lib/utils'

interface CollectionRecipeCardProps {
  recipe: RecipeWithDetails
  collectionId: string
  onRemove: () => void
  onEdit: () => void
}

export default function CollectionRecipeCard({ 
  recipe, 
  collectionId, 
  onRemove, 
  onEdit 
}: CollectionRecipeCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [isLiked, setIsLiked] = useState(recipe.is_liked || false)
  const [editingRecipe, setEditingRecipe] = useState({
    title: recipe.title,
    description: recipe.description || '',
    instructions: recipe.instructions,
    prep_time: recipe.prep_time || 0,
    cook_time: recipe.cook_time || 0,
    servings: recipe.servings || 4,
    difficulty: recipe.difficulty || 'medium' as 'easy' | 'medium' | 'hard',
    ingredients: recipe.ingredients?.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit || ''
    })) || []
  })

  const handleLike = async () => {
    if (!user) return

    try {
      if (isLiked) {
        await supabase
          .from('recipe_likes')
          .delete()
          .eq('recipe_id', recipe.id)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('recipe_likes')
          .insert({ recipe_id: recipe.id, user_id: user.id })
      }
      setIsLiked(!isLiked)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleFork = async () => {
    if (!user) return

    try {
      const newRecipe = {
        title: `${recipe.title} (Forked)`,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        is_public: false, // Make forked recipes private by default
        author_id: user.id,
        original_recipe_id: recipe.id
      }

      const { data: newRecipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert([newRecipe])
        .select()
        .single()

      if (recipeError) throw recipeError

      // Copy ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const ingredients = recipe.ingredients.map(ing => ({
          recipe_id: newRecipeData.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          order_index: ing.order_index || 0
        }))

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredients)

        if (ingredientsError) throw ingredientsError
      }

      alert('Recipe forked successfully!')
    } catch (error) {
      console.error('Error forking recipe:', error)
      alert('Error forking recipe')
    }
  }

  const handleSaveEdit = async () => {
    if (!user) return

    try {
      // Create a new recipe based on the edited version
      // This preserves the original recipe and creates a personal copy
      const newRecipe = {
        title: editingRecipe.title,
        description: editingRecipe.description,
        instructions: editingRecipe.instructions,
        prep_time: editingRecipe.prep_time,
        cook_time: editingRecipe.cook_time,
        servings: editingRecipe.servings,
        difficulty: editingRecipe.difficulty,
        is_public: false, // Make edited recipes private by default
        author_id: user.id,
        original_recipe_id: recipe.id // Track the original recipe for reference
      }

      const { data: newRecipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert([newRecipe])
        .select()
        .single()

      if (recipeError) throw recipeError

      // Add ingredients
      if (editingRecipe.ingredients.length > 0) {
        const ingredients = editingRecipe.ingredients.map((ing, index) => ({
          recipe_id: newRecipeData.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          order_index: index
        }))

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredients)

        if (ingredientsError) throw ingredientsError
      }

      // Remove original from collection and add the new one
      await supabase
        .from('collection_recipes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('recipe_id', recipe.id)

      await supabase
        .from('collection_recipes')
        .insert({
          collection_id: collectionId,
          recipe_id: newRecipeData.id
        })

      setShowEditModal(false)
      onEdit() // Refresh the collection view
      alert(`Recipe edited and saved as your personal copy! New recipe ID: ${newRecipeData.id}`)
    } catch (error) {
      console.error('Error saving edited recipe:', error)
      alert('Error saving edited recipe')
    }
  }

  const handleRemoveFromCollection = async () => {
    if (!confirm('Remove this recipe from the collection?')) return

    try {
      await supabase
        .from('collection_recipes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('recipe_id', recipe.id)

      onRemove()
      alert('Recipe removed from collection')
    } catch (error) {
      console.error('Error removing from collection:', error)
      alert('Error removing recipe from collection')
    }
  }

  const addIngredient = () => {
    setEditingRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '' }]
    }))
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    setEditingRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }))
  }

  const removeIngredient = (index: number) => {
    setEditingRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        {/* Recipe Image */}
        <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
          {recipe.image_url ? (
            <Image 
              src={recipe.image_url} 
              alt={recipe.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Recipe Info */}
        <div className="p-4">
          <h3 
            className="font-semibold text-lg text-gray-900 mb-2 cursor-pointer hover:text-orange-600 transition-colors"
            onClick={() => {
              const slug = generateRecipeSlug(recipe.title, recipe.id)
              console.log('Navigating to recipe:', { title: recipe.title, id: recipe.id, slug })
              router.push(`/recipes/${slug}`)
            }}
          >
            {recipe.title}
          </h3>
          
          {/* Show if this is an edited copy */}
          {recipe.original_recipe_id && recipe.author_id === user?.id && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mb-2 inline-block">
              Your Edited Copy
            </div>
          )}
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {recipe.description}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {recipe.cook_time}m
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {recipe.servings}
              </div>
            </div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {recipe.difficulty}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleFork}
              className="flex items-center gap-1"
            >
              <UtensilsCrossed className="h-4 w-4" />
            </Button>

            {/* Only show edit button if this is not already the user's edited copy */}
            {!(recipe.original_recipe_id && recipe.author_id === user?.id) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1"
                title="Edit and save as your personal copy"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFromCollection}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            By {recipe.author?.username || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Edit Recipe Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Edit Recipe</h2>
              <p className="text-gray-600 text-sm mt-1">
                This will create your personal copy. The original recipe won&apos;t be changed.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title
                </label>
                <Input
                  value={editingRecipe.title}
                  onChange={(e) => setEditingRecipe(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Recipe title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={editingRecipe.description}
                  onChange={(e) => setEditingRecipe(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Recipe description"
                  rows={3}
                />
              </div>

              {/* Time and Servings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prep Time (min)
                  </label>
                  <Input
                    type="number"
                    value={editingRecipe.prep_time}
                    onChange={(e) => setEditingRecipe(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cook Time (min)
                  </label>
                  <Input
                    type="number"
                    value={editingRecipe.cook_time}
                    onChange={(e) => setEditingRecipe(prev => ({ ...prev, cook_time: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servings
                  </label>
                  <Input
                    type="number"
                    value={editingRecipe.servings}
                    onChange={(e) => setEditingRecipe(prev => ({ ...prev, servings: parseInt(e.target.value) || 4 }))}
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={editingRecipe.difficulty}
                  onChange={(e) => setEditingRecipe(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                <div className="space-y-2">
                  {editingRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Amount"
                        value={ingredient.amount}
                        onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                        className="w-24"
                      />
                      <Input
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        className="w-24"
                      />
                      <Input
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addIngredient}>
                    Add Ingredient
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <Textarea
                  value={editingRecipe.instructions}
                  onChange={(e) => setEditingRecipe(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Step-by-step instructions"
                  rows={6}
                />
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t">
              <Button 
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={!editingRecipe.title.trim()}
                className="flex-1"
              >
                Save as My Copy
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}