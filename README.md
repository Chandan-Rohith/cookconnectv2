# RecipeShare - Community Recipe Sharing Platform

A modern, full-stack recipe sharing platform built with Next.js, Supabase, and Tailwind CSS. Features include recipe forking (like Git), social interactions, smart filtering, and a badge system for contributors.

## 🚀 Features

- **Recipe Forking**: Copy and personalize recipes like Git repositories
- **Social Features**: Like, comment, follow users, and build your cooking network
- **Smart Filtering**: Filter by allergies, dietary preferences, ratings, and more
- **Badge System**: Earn Bronze, Silver, and Gold badges based on contributions
- **YouTube Integration**: Link cooking videos to your recipes
- **Real-time Updates**: Live notifications and updates using Supabase
- **Responsive Design**: Beautiful UI that works on all devices
- **SEO Optimized**: Fast loading and search engine friendly

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **UI Components**: Radix UI, Lucide React Icons
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with custom design system

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd recipe-sharing-platform
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy the database schema from `supabase-schema.sql` and run it in your Supabase SQL editor

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- **profiles**: User profiles with badge system
- **recipes**: Recipe data with forking capabilities
- **recipe_ingredients**: Recipe ingredients with ordering
- **recipe_likes**: User likes on recipes
- **recipe_comments**: Comments and replies
- **user_follows**: User following relationships
- **categories**: Recipe categories
- **allergies**: Allergy information
- **recipe_collections**: User-created recipe collections

## 🎨 Key Features Implementation

### Recipe Forking System
- Recipes can be forked (copied) from other users
- Original recipe is tracked via `original_recipe_id`
- Fork count is maintained and displayed
- Users can set recipes as public or private

### Badge System
- **Bronze**: 0-19 recipes or 0-499 total likes
- **Silver**: 20-49 recipes and 500-999 total likes  
- **Gold**: 50+ recipes and 1000+ total likes
- Automatic badge updates via database triggers

### Smart Filtering
- Filter by dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- Filter by allergies
- Filter by difficulty level
- Filter by category
- Sort by newest, popular, rating, etc.

### Social Features
- Like/unlike recipes
- Comment and reply system
- Follow/unfollow users
- Recipe collections
- User profiles with stats

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── recipes/           # Recipe pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Navigation.tsx    # Main navigation
│   └── RecipeCard.tsx    # Recipe card component
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
    └── database.ts       # Database types
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database and auth powered by [Supabase](https://supabase.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact us at support@recipeshare.com.
