import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

export default async function CategoriesPage() {
  const supabase = createClient()
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return <div>Error loading categories: {error.message}</div>
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((cat: Database['public']['Tables']['categories']['Row']) => (
          <li key={cat.id} className="border rounded p-4 flex items-center gap-2">
            <span>{cat.icon}</span>
            <a href={`/categories/${cat.name.toLowerCase()}`} className="font-semibold hover:underline">
              {cat.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
