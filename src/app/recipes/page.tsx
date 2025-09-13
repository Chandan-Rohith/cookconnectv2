'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import RecipeCard from '@/components/RecipeCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  ChefHat,
  Star,
  Clock,
  Users
} from 'lucide-react'
import { RecipeWithDetails } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false
  })
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchRecipes()
    fetchCategories()
  }, [searchQuery, selectedCategory, selectedDifficulty, dietaryFilters, sortBy])

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          author:profiles(*),
          category:categories(*),
          ingredients:recipe_ingredients(*),
          allergies:recipe_allergies(allergy:allergies(*))
        `)
        .eq('is_public', true)

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      // Apply difficulty filter
      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty)
      }

      // Apply dietary filters
      if (dietaryFilters.vegetarian) {
        query = query.eq('is_vegetarian', true)
      }
      if (dietaryFilters.vegan) {
        query = query.eq('is_vegan', true)
      }
      if (dietaryFilters.glutenFree) {
        query = query.eq('is_gluten_free', true)
      }
      if (dietaryFilters.dairyFree) {
        query = query.eq('is_dairy_free', true)
      }
      if (dietaryFilters.nutFree) {
        query = query.eq('is_nut_free', true)
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'popular':
          query = query.order('like_count', { ascending: false })
          break
        case 'rating':
          // Note: This would need a more complex query with ratings table
          query = query.order('like_count', { ascending: false })
          break
      }

      const { data, error } = await query.limit(50)

      if (error) {
        console.error('Error fetching recipes:', error)
      } else {
        setRecipes(data || [])
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleDietaryFilterChange = (filter: keyof typeof dietaryFilters) => {
    setDietaryFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedDifficulty('')
    setDietaryFilters({
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      nutFree: false
    })
    setSortBy('newest')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Recipes</h1>
          <p className="text-gray-600">Find amazing recipes shared by our community</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search recipes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="lg:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="lg:w-32">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="lg:w-32">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Dietary Filters */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">Dietary:</span>
                  {[
                    { key: 'vegetarian', label: 'Vegetarian' },
                    { key: 'vegan', label: 'Vegan' },
                    { key: 'glutenFree', label: 'Gluten Free' },
                    { key: 'dairyFree', label: 'Dairy Free' },
                    { key: 'nutFree', label: 'Nut Free' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleDietaryFilterChange(key as keyof typeof dietaryFilters)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        dietaryFilters[key as keyof typeof dietaryFilters]
                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all recipes.
            </p>
            <Button onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
