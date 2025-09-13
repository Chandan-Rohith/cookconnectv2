import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Database } from '@/types/database'

interface CategoryPageProps {
  params: { name: string }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = await createClient()
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('name', params.name)
    .single()

  if (error || !category) {
    notFound()
  }

  // Fetch recipes for this category
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>{category.icon}</span>
        {category.name}
      </h1>
      <h2 className="text-lg font-semibold mb-2">Recipes</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes?.map((recipe: Database['public']['Tables']['recipes']['Row']) => {
          const recipeSlug = `${recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${recipe.id.slice(-8)}`
          return (
            <li key={recipe.id} className="border rounded p-4">
              <a href={`/recipes/${recipeSlug}`} className="font-semibold hover:underline">
                {recipe.title}
              </a>
            </li>
          )
  })}
        {recipesError && <div>Error loading recipes: {recipesError.message}</div>}
        {recipes?.length === 0 && <div>No recipes found in this category.</div>}
      </ul>
    </main>
  )
}
