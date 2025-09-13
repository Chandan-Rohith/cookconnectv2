'use client'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import RecipeCard from '@/components/RecipeCard'
import CollectionRecipeCard from '@/components/CollectionRecipeCard'
import { createClient } from '@/lib/supabase/client'
import { RecipeWithDetails } from '@/types/database'
import { BookOpen, Plus, Utensils, UtensilsCrossed, Trash2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Collection = {
  id: string
  name: string
  description: string | null
  is_public: boolean
  user_id: string
  created_at: string
  recipe_count?: number
}

export default function CollectionsPage() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [forkedRecipes, setForkedRecipes] = useState<RecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'collections' | 'forked'>('collections')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollection, setNewCollection] = useState({ name: '', description: '', is_public: true })
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionRecipes, setCollectionRecipes] = useState<RecipeWithDetails[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        await fetchCollections()
        await fetchForkedRecipes()
      }
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchCollections = async () => {
    try {
      // Get collections with recipe count
      const { data, error } = await supabase
        .from('recipe_collections')
        .select(`
          *,
          collection_recipes(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const collectionsWithCount = data?.map(collection => ({
        ...collection,
        recipe_count: collection.collection_recipes?.[0]?.count || 0
      })) || []
      
      setCollections(collectionsWithCount)
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  const fetchForkedRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          author:profiles(*),
          ingredients:recipe_ingredients(*),
          original_recipe:recipes!original_recipe_id(title, author:profiles(username))
        `)
        .eq('author_id', user?.id)
        .not('original_recipe_id', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setForkedRecipes(data || [])
    } catch (error) {
      console.error('Error fetching forked recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCollectionRecipes = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_recipes')
        .select(`
          recipe:recipes(
            *,
            author:profiles(*),
            ingredients:recipe_ingredients(*)
          )
        `)
        .eq('collection_id', collectionId)

      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recipes = data?.map((item: any) => item.recipe).filter(Boolean) || []
      setCollectionRecipes(recipes)
    } catch (error) {
      console.error('Error fetching collection recipes:', error)
    }
  }

  const createCollection = async () => {
    if (!newCollection.name.trim()) return

    try {
      const { error } = await supabase
        .from('recipe_collections')
        .insert([
          {
            name: newCollection.name,
            description: newCollection.description || null,
            is_public: newCollection.is_public,
            user_id: user?.id
          }
        ])

      if (error) throw error
      
      setShowCreateModal(false)
      setNewCollection({ name: '', description: '', is_public: true })
      fetchCollections()
    } catch (error) {
      console.error('Error creating collection:', error)
    }
  }

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return

    try {
      const { error } = await supabase
        .from('recipe_collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error
      fetchCollections()
      if (selectedCollection?.id === collectionId) {
        setSelectedCollection(null)
        setCollectionRecipes([])
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600">Please sign in to view your recipe collections and forked recipes.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Collections & Forks</h1>
          <p className="text-gray-600">Organize your recipes and view your forked creations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-8 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'collections'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Collections ({collections.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('forked')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'forked'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Forked Recipes ({forkedRecipes.length})
            </div>
          </button>
        </div>

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div>
            {/* Create Collection Button */}
            <div className="mb-6">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Collection
              </Button>
            </div>

            {/* Collections Grid */}
            {collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <div key={collection.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{collection.name}</h3>
                        {collection.description && (
                          <p className="text-gray-600 text-sm mb-3">{collection.description}</p>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Utensils className="h-4 w-4 mr-1" />
                          {collection.recipe_count || 0} recipes
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCollection(collection)
                            fetchCollectionRecipes(collection.id)
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCollection(collection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      collection.is_public 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {collection.is_public ? 'Public' : 'Private'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Collections Yet</h2>
                <p className="text-gray-600 mb-4">
                  Create collections to organize your recipes by theme, occasion, or any way you like!
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  variant="outline" 
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Collection
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Forked Recipes Tab */}
        {activeTab === 'forked' && (
          <div>
            {forkedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {forkedRecipes.map((recipe) => (
                  <div key={recipe.id} className="relative">
                    <RecipeCard recipe={recipe} />
                    {recipe.original_recipe_id && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Forked Recipe
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Forked Recipes</h2>
                <p className="text-gray-600">
                  When you fork recipes from other users, they&apos;ll appear here for easy access.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collection Details Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCollection.name}</h2>
                  {selectedCollection.description && (
                    <p className="text-gray-600 mt-1">{selectedCollection.description}</p>
                  )}
                </div>
                <Button variant="outline" onClick={() => setSelectedCollection(null)}>
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              {collectionRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* CollectionRecipeCard includes edit functionality that creates personal copies */}
                  {/* Original recipes remain unchanged when edited through collections */}
                  {collectionRecipes.map((recipe) => (
                    <CollectionRecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      collectionId={selectedCollection.id}
                      onRemove={() => fetchCollectionRecipes(selectedCollection.id)}
                      onEdit={() => fetchCollectionRecipes(selectedCollection.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No recipes in this collection yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Collection</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Name *
                  </label>
                  <Input
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Holiday Recipes, Quick Meals"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={newCollection.description}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your collection..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={newCollection.is_public}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700">
                    Make this collection public
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createCollection}
                  disabled={!newCollection.name.trim()}
                  className="flex-1"
                >
                  Create Collection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}