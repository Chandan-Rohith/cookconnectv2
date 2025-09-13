'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChefHat } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/signin?error=' + encodeURIComponent(error.message))
          return
        }

        if (data.session?.user) {
          // Check if user profile exists, create if not
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                username: data.session.user.email?.split('@')[0] || 'user',
                full_name: data.session.user.user_metadata?.full_name || '',
                avatar_url: data.session.user.user_metadata?.avatar_url || null,
              })

            if (insertError) {
              console.error('Error creating profile:', insertError)
            }
          }

          router.push('/')
          router.refresh()
        } else {
          router.push('/auth/signin')
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        router.push('/auth/signin?error=' + encodeURIComponent('An unexpected error occurred'))
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <ChefHat className="h-12 w-12 text-orange-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  )
}
