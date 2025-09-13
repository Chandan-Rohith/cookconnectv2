'use client'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CollectionsPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600">Please sign in to view your recipe collections.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Collections</h1>
            <p className="text-gray-600">Organize your favorite recipes into collections</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Collection
          </Button>
        </div>

        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Collections Yet</h2>
          <p className="text-gray-600 mb-4">
            Create collections to organize your recipes by theme, occasion, or any way you like!
          </p>
          <Button variant="outline" className="flex items-center gap-2 mx-auto">
            <Plus className="h-4 w-4" />
            Create Your First Collection
          </Button>
        </div>
      </div>
    </div>
  )
}