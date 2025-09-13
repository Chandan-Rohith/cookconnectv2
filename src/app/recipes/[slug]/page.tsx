'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Heart, 
  Clock, 
  Users, 
  Star, 
  Fork, 
  Eye,
  ChefHat,
  Play,
  MessageCircle,
  Share2,
  Copy,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react'
import { RecipeWithDetails } from '@/types/database'
import { formatDuration, formatRelativeTime, getDifficultyColor, extractYouTubeVideoId, generateYouTubeThumbnail } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showForkModal, setShowForkModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (params.slug) {
      fetchRecipe()
    }
  }, [params.slug])

  const fetchRecipe = async () => {
    try {
      // Extract recipe ID from slug
      const slug = params.slug as string
      const recipeId = slug.split('-').pop()
      
      if (!recipeId) {
        router.push('/recipes')
        return
      }

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          author:profiles(*),
          category:categories(*),
          ingredients:recipe_ingredients(*),
          allergies:recipe_allergies(allergy:allergies(*))
        `)
        .eq('id', recipeId)
        .eq('is_public', true)
        .single()

      if (error) {
        console.error('Error fetching recipe:', error)
        router.push('/recipes')
        return
      }

      setRecipe(data)
      setLikeCount(data.like_count)
      
      // Check if user has liked this recipe
      if (user) {
        const { data: likeData } = await supabase
          .from('recipe_likes')
          .select('id')
          .eq('recipe_id', data.id)
          .eq('user_id', user.id)
          .single()
        
        setIsLiked(!!likeData)
      }

      // Increment view count
      await supabase
        .from('recipes')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id)

      // Fetch comments
      fetchComments(data.id)
    } catch (error) {
      console.error('Error fetching recipe:', error)
      router.push('/recipes')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (recipeId: string) => {
    try {
      const { data, error } = await supabase
        .from('recipe_comments')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('recipe_id', recipeId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching comments:', error)
      } else {
        setComments(data || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    if (!recipe) return

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
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !recipe || !newComment.trim()) return

    setSubmittingComment(true)

    try {
      const { error } = await supabase
        .from('recipe_comments')
        .insert({
          recipe_id: recipe.id,
          user_id: user.id,
          content: newComment.trim()
        })

      if (error) {
        console.error('Error adding comment:', error)
      } else {
        setNewComment('')
        fetchComments(recipe.id)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleFork = () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    setShowForkModal(true)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title,
          text: recipe?.description,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      // You could show a toast notification here
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-64 bg-gray-200 rounded mb-6" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe not found</h1>
            <Button onClick={() => router.push('/recipes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getRecipeImage = () => {
    if (recipe.image_url) {
      return recipe.image_url
    }
    
    if (recipe.youtube_url) {
      const videoId = extractYouTubeVideoId(recipe.youtube_url)
      if (videoId) {
        return generateYouTubeThumbnail(videoId)
      }
    }
    
    return '/placeholder-recipe.svg'
  }

  const isOwner = user?.id === recipe.author_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Recipe Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-lg text-gray-600 mb-4">
                  {recipe.description}
                </p>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Author and Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <ChefHat className="h-4 w-4 text-gray-600" />
              </div>
              <Link 
                href={`/profile/${recipe.author.username}`}
                className="hover:text-orange-500 transition-colors"
              >
                {recipe.author.full_name || recipe.author.username}
              </Link>
            </div>
            <span>•</span>
            <span>{formatRelativeTime(recipe.created_at)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{recipe.view_count} views</span>
            </div>
          </div>

          {/* Recipe Image */}
          <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
            <Image
              src={getRecipeImage()}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
            {recipe.youtube_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-4">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={handleLike}
              variant={isLiked ? "default" : "outline"}
              className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </Button>
            
            <Button variant="outline" onClick={handleFork}>
              <Fork className="h-4 w-4 mr-2" />
              Fork Recipe
            </Button>
            
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recipe Info */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recipe.prep_time && (
                    <div className="text-center">
                      <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Prep Time</div>
                      <div className="font-semibold">{formatDuration(recipe.prep_time)}</div>
                    </div>
                  )}
                  {recipe.cook_time && (
                    <div className="text-center">
                      <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Cook Time</div>
                      <div className="font-semibold">{formatDuration(recipe.cook_time)}</div>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="text-center">
                      <Users className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Servings</div>
                      <div className="font-semibold">{recipe.servings}</div>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <div className="text-center">
                      <Star className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Difficulty</div>
                      <div className="font-semibold capitalize">{recipe.difficulty}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        {ingredient.amount} {ingredient.unit && `${ingredient.unit} `}
                        {ingredient.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {recipe.instructions.split('\n').map((step, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Comments ({comments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <form onSubmit={handleComment} className="mb-6">
                    <div className="flex gap-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                      />
                      <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md text-center">
                    <p className="text-gray-600 mb-2">Sign in to leave a comment</p>
                    <Button onClick={() => router.push('/auth/signin')}>
                      Sign In
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <ChefHat className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link 
                              href={`/profile/${comment.author.username}`}
                              className="font-medium text-gray-900 hover:text-orange-500"
                            >
                              {comment.author.full_name || comment.author.username}
                            </Link>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category and Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Category & Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {recipe.category && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Category:</span>
                    <div className="mt-1">
                      <span className="inline-block bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full">
                        {recipe.category.icon} {recipe.category.name}
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Dietary:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {recipe.is_vegetarian && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Vegetarian
                      </span>
                    )}
                    {recipe.is_vegan && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Vegan
                      </span>
                    )}
                    {recipe.is_gluten_free && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Gluten Free
                      </span>
                    )}
                    {recipe.is_dairy_free && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Dairy Free
                      </span>
                    )}
                    {recipe.is_nut_free && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Nut Free
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* YouTube Video */}
            {recipe.youtube_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Video Tutorial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeVideoId(recipe.youtube_url)}`}
                      title={recipe.title}
                      className="w-full h-full rounded-md"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fork Info */}
            {recipe.original_recipe_id && (
              <Card>
                <CardHeader>
                  <CardTitle>Forked Recipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    This recipe was forked from another recipe. 
                    <Button variant="link" className="p-0 h-auto text-orange-500">
                      View original
                    </Button>
                  </p>
                </CardContent>
              </Card>
            )}

            {recipe.fork_count > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Forks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    This recipe has been forked {recipe.fork_count} times.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
