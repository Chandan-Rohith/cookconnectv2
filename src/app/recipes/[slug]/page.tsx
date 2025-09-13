"use client"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { RecipeWithDetails } from "@/types/database"
import { 
  Clock, Users, ArrowLeft, BookmarkPlus 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { parseRecipeSlug } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

// ✅ Define Comment type (instead of any)
type Comment = {
  id: string
  content: string
  created_at: string
  author: {
    username: string
    full_name?: string
  }
}

// ✅ Define ingredient type
type Ingredient = {
  id: string
  name: string
  amount: string
  unit: string | null
}

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth() // Use AuthContext instead of local state

  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState<Array<{id: string, name: string}>>([])
  const [showCollectionModal, setShowCollectionModal] = useState(false)

  // ✅ Safe slug extraction
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug ?? ""

  // ✅ Wrap fetchRecipe in useCallback (fixes missing dependency warning)
  const fetchRecipe = useCallback(async () => {
    if (!slug) return
    try {
      console.log('Fetching recipe with slug:', slug)
      const parsed = parseRecipeSlug(slug)
      console.log('Parsed slug result:', parsed)
      if (!parsed) {
        console.log('Failed to parse slug, redirecting to recipes page')
        router.push("/recipes")
        return
      }

      // ✅ Get current user (now using AuthContext)
      console.log('Current user from AuthContext:', user)

      console.log('Looking up recipe with ID:', parsed.id)
      // ✅ Fetch recipe details with ingredients
      const { data, error } = await supabase
        .from("recipes")
        .select(`
          *, 
          profiles(username, full_name),
          ingredients:recipe_ingredients(*)
        `)
        .eq("id", parsed.id)
        .single()

      if (error) throw error
      console.log('Recipe data received:', data)
      console.log('Ingredients:', data?.ingredients)
      setRecipe(data)

      // ✅ Fetch comments
      const { data: commentData } = await supabase
        .from("recipe_comments")
        .select(`
          id, 
          content, 
          created_at, 
          profiles!recipe_comments_user_id_fkey(username, full_name)
        `)
        .eq("recipe_id", parsed.id)
        .order("created_at", { ascending: false })

      // Transform the data to match our Comment type
      const transformedComments = commentData?.map((comment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: {
          username: comment.profiles?.[0]?.username || 'Unknown',
          full_name: comment.profiles?.[0]?.full_name
        }
      })) || []

      setComments(transformedComments)
    } catch (error) {
      console.error("Error fetching recipe:", error)
      router.push("/recipes")
    } finally {
      setLoading(false)
    }
  }, [slug, supabase, router, user])

  useEffect(() => {
    if (slug) {
      fetchRecipe()
    }
  }, [slug, fetchRecipe])

  const fetchUserCollections = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('recipe_collections')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  const addToCollection = async (collectionId: string) => {
    if (!recipe || !user) return

    try {
      const { error } = await supabase
        .from('collection_recipes')
        .insert({
          collection_id: collectionId,
          recipe_id: recipe.id
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('Recipe is already in this collection!')
          return
        }
        throw error
      }

      alert('Recipe added to collection successfully!')
      setShowCollectionModal(false)
    } catch (error) {
      console.error('Error adding to collection:', error)
      alert('Error adding recipe to collection')
    }
  }

  // Early return after all hooks
  if (!slug) {
    router.push("/recipes")
    return null
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Comment submit triggered')
    console.log('User:', user)
    console.log('Recipe:', recipe?.id)
    console.log('Comment content:', newComment.trim())
    
    if (!newComment.trim()) {
      console.log('No comment content')
      return
    }
    
    if (!recipe) {
      console.log('No recipe found')
      return
    }
    
    if (!user) {
      console.log('User not authenticated')
      alert('Please sign in to post comments')
      return
    }

    try {
      console.log('Attempting to insert comment...')
      const { data, error } = await supabase
        .from("recipe_comments")
        .insert([
          {
            content: newComment,
            recipe_id: recipe.id,
            user_id: user.id,
          },
        ])
        .select()

      console.log('Insert result:', { data, error })

      if (error) {
        console.error('Database error:', error)
        alert('Failed to post comment: ' + error.message)
        throw error
      }

      console.log('Comment posted successfully')
      // Create a new comment locally
      const newCommentData: Comment = {
        id: Date.now().toString(), // Temporary ID
        content: newComment,
        created_at: new Date().toISOString(),
        author: {
          username: user.email || 'Unknown',
          full_name: undefined
        }
      }

      setComments([newCommentData, ...comments])
      setNewComment("")
      // Refresh comments to get the real data
      fetchRecipe()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  if (loading) return <p className="text-center p-4">Loading recipe...</p>
  if (!recipe) return <p className="text-center p-4">Recipe not found.</p>

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => router.push("/recipes")}>
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Button>
      </div>

      {/* Recipe Title */}
      <h1 className="text-3xl font-bold">{recipe.title}</h1>
      <p className="text-gray-600">By {recipe.author?.username || "Unknown"}</p>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1"><Clock size={16}/> {recipe.cook_time} mins</div>
        <div className="flex items-center gap-1"><Users size={16}/> {recipe.servings} servings</div>
      </div>

      {/* Action Buttons */}
      {user && (
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              fetchUserCollections()
              setShowCollectionModal(true)
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BookmarkPlus className="h-4 w-4" />
            Add to Collection
          </Button>
        </div>
      )}

      {/* Description */}
      <p className="text-gray-700">{recipe.description}</p>

      {/* Ingredients */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {recipe.ingredients.map((ingredient: Ingredient, idx: number) => (
              <li key={ingredient.id || idx}>
                {ingredient.amount} {ingredient.unit} {ingredient.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No ingredients listed for this recipe.</p>
        )}
      </div>

      {/* Instructions */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-1">
          {recipe.instructions?.split('\n').filter(step => step.trim()).map((step: string, idx: number) => (
            <li key={idx}>{step.trim()}</li>
          ))}
        </ol>
      </div>

      {/* Comments Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Comments</h2>
        
        {user ? (
          <form onSubmit={handleCommentSubmit} className="space-y-2 mb-4">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button type="submit" disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </form>
        ) : (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600 mb-2">Please sign in to post comments</p>
            <Button 
              onClick={() => router.push('/auth/signin')}
              variant="outline"
            >
              Sign In
            </Button>
          </div>
        )}

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 border rounded-lg">
                <p className="text-sm text-gray-600">
                  {comment.author?.username || "Anonymous"} •{" "}
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
                <p>{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No comments yet. Be the first!</p>
        )}
      </div>

      {/* Add to Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add to Collection</h2>
              
              {collections.length > 0 ? (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => addToCollection(collection.id)}
                    >
                      <p className="font-medium">{collection.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">You don&apos;t have any collections yet.</p>
                  <Button 
                    onClick={() => {
                      setShowCollectionModal(false)
                      router.push('/collections')
                    }}
                    variant="outline"
                  >
                    Create Collection
                  </Button>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => setShowCollectionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
