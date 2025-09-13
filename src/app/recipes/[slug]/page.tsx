"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { RecipeWithDetails } from "@/types/database"
import { 
  Clock, Users, ArrowLeft 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
// import { toast } from "sonner" // Removed - not needed for now

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

  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

  // ✅ Safe slug extraction
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug ?? ""

  // ✅ Wrap fetchRecipe in useCallback (fixes missing dependency warning)
  const fetchRecipe = useCallback(async () => {
    if (!slug) return
    try {
      const recipeId = slug.split("-").pop()
      if (!recipeId) {
        router.push("/recipes")
        return
      }

      // ✅ Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // ✅ Fetch recipe details
      const { data, error } = await supabase
        .from("recipes")
        .select("*, profiles(username, full_name)")
        .eq("id", recipeId)
        .single()

      if (error) throw error
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
        .eq("recipe_id", recipeId)
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
  }, [slug, supabase, router])

  useEffect(() => {
    if (slug) {
      fetchRecipe()
    }
  }, [slug, fetchRecipe])

  // Early return after all hooks
  if (!slug) {
    router.push("/recipes")
    return null
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !recipe || !user) return

    try {
      const { error } = await supabase
        .from("recipe_comments")
        .insert([
          {
            content: newComment,
            recipe_id: recipe.id,
            user_id: user.id,
          },
        ])

      if (error) throw error

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

      {/* Description */}
      <p className="text-gray-700">{recipe.description}</p>

      {/* Ingredients */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
        <ul className="list-disc pl-5 space-y-1">
          {recipe.ingredients?.map((ingredient: Ingredient, idx: number) => (
            <li key={idx}>
              {ingredient.amount} {ingredient.unit} {ingredient.name}
            </li>
          ))}
        </ul>
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
        <form onSubmit={handleCommentSubmit} className="space-y-2 mb-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button type="submit">Post Comment</Button>
        </form>

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
    </div>
  )
}
