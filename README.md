# SocialConnect

A full-stack social media application built with Next.js API Routes and Supabase.

## Features

- User authentication (signup, login, logout)
- Create, read, update, delete posts
- Comment system
- Follow/unfollow users
- Personalized feed
- Search users and posts
- Basic user profiles

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Copy your project URL and API keys
3. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Set up Database Schema

Run the SQL from `supabase-schema.sql` in your Supabase SQL editor to create the database tables and policies.

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Posts

- `POST /api/posts/create` - Create post
- `GET /api/posts/[id]` - Get single post
- `PUT /api/posts/update/[id]` - Update post
- `DELETE /api/posts/delete/[id]` - Delete post
- `GET /api/posts/feed` - Get personalized feed

### Comments

- `POST /api/comments/create` - Add comment
- `DELETE /api/comments/[id]` - Delete comment
- `GET /api/comments/post/[post_id]` - Get post comments

### Follows

- `POST /api/follows/follow` - Follow user
- `DELETE /api/follows/unfollow` - Unfollow user
- `GET /api/follows/followers/[id]` - Get user's followers
- `GET /api/follows/following/[id]` - Get who user follows

### Search

- `GET /api/search/users?query=...` - Search users
- `GET /api/search/posts?query=...` - Search posts

## Database Schema

The application uses the following main tables:

- **users** - User profiles (extends Supabase auth.users)
- **posts** - User posts with content, categories, and activity status
- **comments** - Comments on posts
- **follows** - Follow relationships between users

All tables include Row Level Security (RLS) policies for data protection.

## Security Features

- Row Level Security (RLS) on all tables
- JWT-based authentication via Supabase
- Input validation on all endpoints
- Authorization checks for data modification
- Protected API routes requiring authentication

## Architecture

The application follows a clean modular structure:

- `/app/api/` - API route handlers
- `/lib/` - Shared utilities (database, validation, policies)
- `/components/` - React components
- `supabase-schema.sql` - Database schema and security policies

## Development

The focus is on backend functionality and code structure. The UI is intentionally minimal to emphasize the API design and database architecture.
