'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { validateSignupData } from '@/lib/validators'

interface FormData {
  email: string
  password: string
  username: string
}

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    username: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if Supabase is configured
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!isConfigured) {
      setError('Supabase is not configured. Please set up your database connection first.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isLogin) {
        // Handle login with Supabase client
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) {
          console.error('Login error:', error)
          // Handle specific auth errors
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.')
          } else if (error.message.includes('Too many requests')) {
            setError('Too many login attempts. Please wait a few minutes and try again.')
          } else {
            setError(error.message)
          }
          return
        }

        if (data.user && data.session) {
          console.log('Login successful for user:', data.user.email)
          setMessage('Login successful! Welcome back!')
          // Clear form
          setFormData({ email: '', password: '', username: '' })
          // The auth state change will be handled by the parent component
        } else {
          setError('Login failed. Please try again.')
        }
      } else {
        // Handle signup validation
        const validation = validateSignupData(formData.email, formData.password, formData.username)
        if (!validation.isValid) {
          setError(validation.errors.join(', '))
          return
        }

        // For signup, we'll use the API endpoint to handle username checking and profile creation
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Signup failed')
          return
        }

        setMessage('Account created! Please check your email to verify your account.')
        setFormData({ email: '', password: '', username: '' })
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              SocialConnect
            </h1>
            <p className="text-sm text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                className={`flex-1 py-2 px-4 text-center text-sm font-medium rounded-md transition-all ${
                  isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                  setMessage('')
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 text-center text-sm font-medium rounded-md transition-all ${
                  !isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                  setMessage('')
                }}
              >
                Sign Up
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isLogin ? "Enter password" : "Create password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                required
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            {message && (
              <div className="text-green-700 text-sm bg-green-50 border border-green-200 p-3 rounded-lg">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <span>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Secured by Supabase Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
