-- Recipe Sharing Platform Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- User profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Badge system fields
  recipe_count INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  badge_tier TEXT DEFAULT 'bronze' CHECK (badge_tier IN ('bronze', 'silver', 'gold'))
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allergies table
CREATE TABLE allergies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes table
CREATE TABLE recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes
  servings INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  youtube_url TEXT,
  is_public BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_dairy_free BOOLEAN DEFAULT false,
  is_nut_free BOOLEAN DEFAULT false,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id),
  original_recipe_id UUID REFERENCES recipes(id), -- for forked recipes
  fork_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ingredients table
CREATE TABLE recipe_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  unit TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe allergies table (many-to-many)
CREATE TABLE recipe_allergies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  allergy_id UUID REFERENCES allergies(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(recipe_id, allergy_id)
);

-- Recipe likes table
CREATE TABLE recipe_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Recipe comments table
CREATE TABLE recipe_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES recipe_comments(id), -- for replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User follows table
CREATE TABLE user_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Recipe ratings table
CREATE TABLE recipe_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Recipe collections table (user-created collections)
CREATE TABLE recipe_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection recipes table (many-to-many)
CREATE TABLE collection_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES recipe_collections(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, recipe_id)
);

-- User allergies table (user's dietary restrictions)
CREATE TABLE user_allergies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  allergy_id UUID REFERENCES allergies(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, allergy_id)
);

-- Indexes for better performance
CREATE INDEX idx_recipes_author_id ON recipes(author_id);
CREATE INDEX idx_recipes_category_id ON recipes(category_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_like_count ON recipes(like_count DESC);
CREATE INDEX idx_recipes_is_public ON recipes(is_public);
CREATE INDEX idx_recipes_is_vegetarian ON recipes(is_vegetarian);
CREATE INDEX idx_recipes_is_vegan ON recipes(is_vegan);
CREATE INDEX idx_recipes_is_gluten_free ON recipes(is_gluten_free);
CREATE INDEX idx_recipes_is_dairy_free ON recipes(is_dairy_free);
CREATE INDEX idx_recipes_is_nut_free ON recipes(is_nut_free);
CREATE INDEX idx_recipes_original_recipe_id ON recipes(original_recipe_id);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_likes_recipe_id ON recipe_likes(recipe_id);
CREATE INDEX idx_recipe_likes_user_id ON recipe_likes(user_id);
CREATE INDEX idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);
CREATE INDEX idx_recipe_comments_user_id ON recipe_comments(user_id);
CREATE INDEX idx_recipe_comments_parent_comment_id ON recipe_comments(parent_comment_id);
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user_id ON recipe_ratings(user_id);

-- Full-text search indexes
CREATE INDEX idx_recipes_title_search ON recipes USING gin(to_tsvector('english', title));
CREATE INDEX idx_recipes_description_search ON recipes USING gin(to_tsvector('english', description));
CREATE INDEX idx_recipes_instructions_search ON recipes USING gin(to_tsvector('english', instructions));

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipe_comments_updated_at BEFORE UPDATE ON recipe_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipe_ratings_updated_at BEFORE UPDATE ON recipe_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipe_collections_updated_at BEFORE UPDATE ON recipe_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update recipe counts and badge tiers
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update recipe count
    UPDATE profiles 
    SET recipe_count = (
        SELECT COUNT(*) 
        FROM recipes 
        WHERE author_id = COALESCE(NEW.author_id, OLD.author_id)
    )
    WHERE id = COALESCE(NEW.author_id, OLD.author_id);
    
    -- Update total likes
    UPDATE profiles 
    SET total_likes = (
        SELECT COALESCE(SUM(like_count), 0)
        FROM recipes 
        WHERE author_id = COALESCE(NEW.author_id, OLD.author_id)
    )
    WHERE id = COALESCE(NEW.author_id, OLD.author_id);
    
    -- Update badge tier based on recipe count and total likes
    UPDATE profiles 
    SET badge_tier = CASE 
        WHEN recipe_count >= 50 AND total_likes >= 1000 THEN 'gold'
        WHEN recipe_count >= 20 AND total_likes >= 500 THEN 'silver'
        ELSE 'bronze'
    END
    WHERE id = COALESCE(NEW.author_id, OLD.author_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers for updating user stats
CREATE TRIGGER update_user_stats_on_recipe_insert 
    AFTER INSERT ON recipes FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_user_stats_on_recipe_update 
    AFTER UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_user_stats_on_recipe_delete 
    AFTER DELETE ON recipes FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_recipe_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE recipes SET like_count = like_count + 1 WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE recipes SET like_count = like_count - 1 WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipe_like_count_trigger
    AFTER INSERT OR DELETE ON recipe_likes FOR EACH ROW EXECUTE FUNCTION update_recipe_like_count();

-- Function to update fork counts
CREATE OR REPLACE FUNCTION update_fork_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.original_recipe_id IS NOT NULL THEN
        UPDATE recipes SET fork_count = fork_count + 1 WHERE id = NEW.original_recipe_id;
    ELSIF TG_OP = 'DELETE' AND OLD.original_recipe_id IS NOT NULL THEN
        UPDATE recipes SET fork_count = fork_count - 1 WHERE id = OLD.original_recipe_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fork_count_trigger
    AFTER INSERT OR DELETE ON recipes FOR EACH ROW EXECUTE FUNCTION update_fork_count();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_allergies ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Public recipes are viewable by everyone" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own recipes" ON recipes FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Users can insert their own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own recipes" ON recipes FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own recipes" ON recipes FOR DELETE USING (auth.uid() = author_id);

-- Recipe ingredients policies
CREATE POLICY "Recipe ingredients are viewable with recipes" ON recipe_ingredients FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_ingredients.recipe_id AND (is_public = true OR author_id = auth.uid()))
);
CREATE POLICY "Users can manage ingredients for their own recipes" ON recipe_ingredients FOR ALL USING (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_ingredients.recipe_id AND author_id = auth.uid())
);

-- Recipe likes policies
CREATE POLICY "Recipe likes are viewable by everyone" ON recipe_likes FOR SELECT USING (true);
CREATE POLICY "Users can like/unlike recipes" ON recipe_likes FOR ALL USING (auth.uid() = user_id);

-- Recipe comments policies
CREATE POLICY "Recipe comments are viewable by everyone" ON recipe_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment on recipes" ON recipe_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON recipe_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON recipe_comments FOR DELETE USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "User follows are viewable by everyone" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow others" ON user_follows FOR ALL USING (auth.uid() = follower_id);

-- Recipe ratings policies
CREATE POLICY "Recipe ratings are viewable by everyone" ON recipe_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate recipes" ON recipe_ratings FOR ALL USING (auth.uid() = user_id);

-- Recipe collections policies
CREATE POLICY "Public collections are viewable by everyone" ON recipe_collections FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own collections" ON recipe_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own collections" ON recipe_collections FOR ALL USING (auth.uid() = user_id);

-- Collection recipes policies
CREATE POLICY "Collection recipes are viewable with collections" ON collection_recipes FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipe_collections WHERE id = collection_recipes.collection_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can manage recipes in their own collections" ON collection_recipes FOR ALL USING (
    EXISTS (SELECT 1 FROM recipe_collections WHERE id = collection_recipes.collection_id AND user_id = auth.uid())
);

-- User allergies policies
CREATE POLICY "Users can view their own allergies" ON user_allergies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own allergies" ON user_allergies FOR ALL USING (auth.uid() = user_id);

-- Insert default data
INSERT INTO categories (name, description, icon) VALUES
('Breakfast', 'Morning meals and brunch recipes', '🥞'),
('Lunch', 'Midday meals and light dishes', '🥪'),
('Dinner', 'Evening meals and main courses', '🍽️'),
('Dessert', 'Sweet treats and desserts', '🍰'),
('Snacks', 'Quick bites and appetizers', '🍿'),
('Beverages', 'Drinks and beverages', '🥤'),
('Salads', 'Fresh and healthy salads', '🥗'),
('Soups', 'Warm and comforting soups', '🍲'),
('Pasta', 'Pasta dishes and noodles', '🍝'),
('Pizza', 'Pizza and flatbreads', '🍕');

INSERT INTO allergies (name, description) VALUES
('Gluten', 'Contains gluten or wheat products'),
('Dairy', 'Contains milk, cheese, or other dairy products'),
('Nuts', 'Contains tree nuts or peanuts'),
('Eggs', 'Contains eggs or egg products'),
('Soy', 'Contains soy or soy products'),
('Fish', 'Contains fish or fish products'),
('Shellfish', 'Contains shellfish or crustaceans'),
('Sesame', 'Contains sesame seeds or oil'),
('Sulfites', 'Contains sulfites or sulfur dioxide');
