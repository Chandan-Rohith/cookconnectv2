'use client'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Trash2, 
  ChefHat,
  Save
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateRecipeSlug } from '@/lib/utils'

interface Ingredient {
  id: string
  name: string
  amount: string
  unit: string
}

interface RecipeFormData {
  title: string
  description: string
  instructions: string
  prepTime: string
  cookTime: string
  servings: string
  difficulty: 'easy' | 'medium' | 'hard' | ''
  imageUrl: string
  isPublic: boolean
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isDairyFree: boolean
  isNutFree: boolean
}

export default function CreateRecipePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: '',
    imageUrl: '',
    isPublic: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isDairyFree: false,
    isNutFree: false
  })
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
  }, [user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      unit: ''
    }
    setIngredients(prev => [...prev, newIngredient])
  }

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ingredient => ingredient.id !== id))
  }

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(prev => prev.map(ingredient => 
      ingredient.id === id ? { ...ingredient, [field]: value } : ingredient
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    setLoading(true)

    try {
      // Create the recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          prep_time: formData.prepTime ? parseInt(formData.prepTime) : null,
          cook_time: formData.cookTime ? parseInt(formData.cookTime) : null,
          servings: formData.servings ? parseInt(formData.servings) : null,
          difficulty: formData.difficulty || null,
          image_url: formData.imageUrl || null,
          is_public: formData.isPublic,
          is_vegetarian: formData.isVegetarian,
          is_vegan: formData.isVegan,
          is_gluten_free: formData.isGlutenFree,
          is_dairy_free: formData.isDairyFree,
          is_nut_free: formData.isNutFree,
          author_id: user.id,
          category_id: null
        })
        .select()
        .single()

      if (recipeError) {
        console.error('Error creating recipe:', recipeError)
        return
      }

      // Add ingredients
      if (ingredients.length > 0) {
        const ingredientsToInsert = ingredients
          .filter(ingredient => ingredient.name.trim() && ingredient.amount.trim())
          .map((ingredient, index) => ({
            recipe_id: recipe.id,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit || null,
            order_index: index
          }))

        if (ingredientsToInsert.length > 0) {
          const { error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientsToInsert)

          if (ingredientsError) {
            console.error('Error adding ingredients:', ingredientsError)
          }
        }
      }

      // Redirect to the recipe page
      const recipeSlug = generateRecipeSlug(formData.title, recipe.id)
      router.push(`/recipes/${recipeSlug}`)
    } catch (error) {
      console.error('Error creating recipe:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Recipe</h1>
          <p className="text-gray-600">Share your delicious recipe with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Tell us about your recipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter recipe title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your recipe..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Prep Time (minutes)
                  </label>
                  <Input
                    id="prepTime"
                    name="prepTime"
                    type="number"
                    value={formData.prepTime}
                    onChange={handleInputChange}
                    placeholder="15"
                  />
                </div>
                <div>
                  <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Cook Time (minutes)
                  </label>
                  <Input
                    id="cookTime"
                    name="cookTime"
                    type="number"
                    value={formData.cookTime}
                    onChange={handleInputChange}
                    placeholder="30"
                  />
                </div>
                <div>
                  <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-1">
                    Servings
                  </label>
                  <Input
                    id="servings"
                    name="servings"
                    type="number"
                    value={formData.servings}
                    onChange={handleInputChange}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>
                List all the ingredients needed for your recipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <Input
                        value={ingredient.amount}
                        onChange={(e) => updateIngredient(ingredient.id, 'amount', e.target.value)}
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <Input
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                        placeholder="cups"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ingredient
                      </label>
                      <Input
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                        placeholder="flour"
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addIngredient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>
                Provide step-by-step cooking instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="1. Preheat oven to 350°F...
2. Mix ingredients in a bowl...
3. Bake for 30 minutes..."
                rows={8}
                required
              />
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Add an image to your recipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/recipe-image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dietary Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Information</CardTitle>
              <CardDescription>
                Help others find your recipe by marking dietary preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'isVegetarian', label: 'Vegetarian' },
                  { key: 'isVegan', label: 'Vegan' },
                  { key: 'isGlutenFree', label: 'Gluten Free' },
                  { key: 'isDairyFree', label: 'Dairy Free' },
                  { key: 'isNutFree', label: 'Nut Free' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name={key}
                      checked={formData[key as keyof RecipeFormData] as boolean}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your recipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">
                  Make this recipe public (visible to everyone)
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <ChefHat className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Recipe
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
