import { useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function LoginImproved() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
      </div>
      
      {/* Floating Elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 left-20 w-20 h-20 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur-xl opacity-30"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '2s' }}
        className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-20"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '4s' }}
        className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-25"
      />

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md p-8"
      >
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <span className="text-2xl font-bold text-white">$</span>
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-purple-200 mt-2">Sign in to your expense tracker</p>
          </motion.div>

          <motion.form onSubmit={handleLogin} variants={itemVariants} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your email"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                />
              ) : (
                'Sign In'
              )}
            </motion.button>
          </motion.form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-purple-200 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-pink-300 hover:text-pink-200 font-semibold transition-colors">
                Sign up
              </Link>
            </p>
            <Link href="/forgot-password" className="text-purple-300 hover:text-purple-200 text-sm transition-colors mt-2 inline-block">
              Forgot your password?
            </Link>
          </motion.div>
        </div>

        {/* Bottom Text */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-8 text-purple-300 text-sm"
        >
          Secure • Fast • Beautiful
        </motion.div>
      </motion.div>
    </div>
  )
}
