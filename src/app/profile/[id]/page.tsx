'use client'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import RecipeCard from '@/components/RecipeCard'
import { createClient } from '@/lib/supabase/client'
import { RecipeWithDetails } from '@/types/database'
import { User, ChefHat, Heart, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ProfileData = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [userRecipes, setUserRecipes] = useState<RecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recipes' | 'liked'>('recipes')
  const supabase = createClient()

  const profileId = Array.isArray(params.id) ? params.id[0] : params.id

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserRecipes = async () => {
    try {
      if (activeTab === 'recipes') {
        const { data, error } = await supabase
          .from('recipes')
          .select(`
            *,
            author:profiles(*),
            ingredients:recipe_ingredients(*)
          `)
          .eq('author_id', profileId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setUserRecipes(data || [])
      } else if (activeTab === 'liked') {
        const { data, error } = await supabase
          .from('recipe_likes')
          .select(`
            recipe:recipes(
              *,
              author:profiles(*),
              ingredients:recipe_ingredients(*)
            )
          `)
          .eq('user_id', profileId)

        if (error) throw error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const likedRecipes = data?.map((item: any) => item.recipe).filter(Boolean) || []
        setUserRecipes(likedRecipes)
      }
    } catch (error) {
      console.error('Error fetching user recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profileId) {
      const loadData = async () => {
        await fetchProfile()
        await fetchUserRecipes()
      }
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, activeTab])

  const isOwnProfile = user?.id === profileId

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
            <p className="text-gray-600">The user profile you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username || 'Profile'}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.full_name || profile.username || 'Anonymous User'}
                  </h1>
                  {profile.username && (
                    <p className="text-gray-600">@{profile.username}</p>
                  )}
                </div>
                
                {isOwnProfile && (
                  <Button variant="outline">Edit Profile</Button>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-gray-700 mt-4">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <ChefHat className="h-4 w-4" />
                  {userRecipes.length} {userRecipes.length === 1 ? 'Recipe' : 'Recipes'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-8 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'recipes'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recipes
            </div>
          </button>
          
          {(isOwnProfile || userRecipes.length > 0) && (
            <button
              onClick={() => setActiveTab('liked')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'liked'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Liked Recipes
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        {userRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {activeTab === 'recipes' ? (
              <>
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {isOwnProfile ? 'No Recipes Yet' : 'No Public Recipes'}
                </h2>
                <p className="text-gray-600">
                  {isOwnProfile 
                    ? 'Start sharing your culinary creations with the community!'
                    : 'This user hasn&apos;t shared any public recipes yet.'
                  }
                </p>
              </>
            ) : (
              <>
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Liked Recipes</h2>
                <p className="text-gray-600">
                  {isOwnProfile 
                    ? 'Start exploring and liking recipes!'
                    : 'This user hasn&apos;t liked any recipes yet.'
                  }
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}