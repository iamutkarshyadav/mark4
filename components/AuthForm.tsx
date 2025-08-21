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
            setError('❌ Invalid email or password. Please check your credentials and try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setError('❌ Please check your email and click the confirmation link before signing in.')
          } else if (error.message.includes('Too many requests')) {
            setError('❌ Too many login attempts. Please wait a few minutes and try again.')
          } else {
            setError(`❌ ${error.message}`)
          }
          return
        }

        if (data.user && data.session) {
          console.log('Login successful for user:', data.user.email)
          setMessage('✅ Login successful! Welcome back!')
          // Clear form
          setFormData({ email: '', password: '', username: '' })
          // The auth state change will be handled by the parent component
        } else {
          setError('❌ Login failed. Please try again.')
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

        setMessage('✅ Account created! Please check your email to verify your account.')
        setFormData({ email: '', password: '', username: '' })
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('❌ Network error. Please check your connection and try again.')
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">SC</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SocialConnect
          </h1>
          <p className="text-gray-600 text-sm">Connect, Share, Engage</p>
        </div>

        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 text-center text-sm font-medium rounded-md transition-all ${
                isLogin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setIsLogin(true)
                setError('')
                setMessage('')
              }}
            >
              🔑 Login
            </button>
            <button
              className={`flex-1 py-2 px-4 text-center text-sm font-medium rounded-md transition-all ${
                !isLogin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setIsLogin(false)
                setError('')
                setMessage('')
              }}
            >
              👤 Sign Up
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isLogin ? "Enter your password" : "Create a strong password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            )}
          </div>

          {error && (
            <div className="text-red-800 text-sm bg-red-50 border border-red-200 p-4 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-800 text-sm bg-green-50 border border-green-200 p-4 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <span>
                {isLogin ? '🚀 Sign In' : '✨ Create Account'}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secured by Supabase Authentication
          </p>
          <p className="text-xs text-gray-400 mt-1">
            All API endpoints are fully integrated and functional
          </p>
        </div>
      </div>
    </div>
  )
}
