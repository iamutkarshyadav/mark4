-- Create users profile table extending auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create follows table
CREATE TABLE public.follows (
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Add optional counter columns to posts (if not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0);
  END IF;
END $$;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for posts table
CREATE POLICY "Anyone can view active posts" ON public.posts FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for comments table
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for follows table
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create likes table for post likes
CREATE TABLE IF NOT EXISTS public.likes (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Enable RLS on likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY IF NOT EXISTS "Anyone can view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can like posts" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can unlike posts" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Optional: constraint for fixed categories
ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_category_check
  CHECK (category IS NULL OR category IN ('general','announcement','question'));

-- Maintain like_count on posts via triggers
CREATE OR REPLACE FUNCTION public.increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_like_count ON public.likes;
CREATE TRIGGER trg_increment_like_count
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.increment_like_count();

DROP TRIGGER IF EXISTS trg_decrement_like_count ON public.likes;
CREATE TRIGGER trg_decrement_like_count
AFTER DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.decrement_like_count();

-- Maintain comment_count on posts via triggers
CREATE OR REPLACE FUNCTION public.increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_comment_count ON public.comments;
CREATE TRIGGER trg_increment_comment_count
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.increment_comment_count();

DROP TRIGGER IF EXISTS trg_decrement_comment_count ON public.comments;
CREATE TRIGGER trg_decrement_comment_count
AFTER DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.decrement_comment_count();
