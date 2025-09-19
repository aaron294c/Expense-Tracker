--- a/components/auth/AuthComponent.tsx
+++ b/components/auth/AuthComponent.tsx
@@ -1,6 +1,7 @@
 import { useState } from 'react'
 import { useRouter } from 'next/router'
 import { supabase } from '@/lib/supabase'
+import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
 
 interface AuthComponentProps {
   mode?: 'signin' | 'signup'
@@ -11,6 +12,8 @@
   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [loading, setLoading] = useState(false)
+  const [validationErrors, setValidationErrors] = useState<{email?: string; password?: string}>({})
+  const [success, setSuccess] = useState('')
   const router = useRouter()
 
   const isSignUp = mode === 'signup'
@@ -18,6 +21,32 @@
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
     setLoading(true)
+    setError('')
+    setSuccess('')
+    setValidationErrors({})
+
+    // Client-side validation
+    const errors: {email?: string; password?: string} = {}
+    
+    if (!email.trim()) {
+      errors.email = 'Email is required'
+    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
+      errors.email = 'Please enter a valid email address'
+    }
+    
+    if (!password) {
+      errors.password = 'Password is required'
+    } else if (isSignUp && password.length < 8) {
+      errors.password = 'Password must be at least 8 characters long'
+    } else if (isSignUp && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
+      errors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
+    }
+    
+    if (Object.keys(errors).length > 0) {
+      setValidationErrors(errors)
+      setLoading(false)
+      return
+    }
 
     try {
       if (isSignUp) {
@@ -26,6 +55,10 @@
           password,
         })
         
+        if (data.user && !error) {
+          setSuccess('Account created successfully! Please check your email to verify your account.')
+        }
+        
         if (error) throw error
       } else {
         const { error } = await supabase.auth.signInWithPassword({
@@ -36,9 +69,21 @@
         if (error) throw error
         router.push('/dashboard')
       }
-    } catch (error: any) {
-      setError(error.message || 'An error occurred')
+    } catch (error: any) {
+      // Provide more user-friendly error messages
+      let errorMessage = 'An unexpected error occurred. Please try again.'
+      
+      if (error.message?.includes('Invalid login credentials')) {
+        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
+      } else if (error.message?.includes('User already registered')) {
+        errorMessage = 'An account with this email already exists. Try signing in instead.'
+      } else if (error.message?.includes('Email not confirmed')) {
+        errorMessage = 'Please check your email and click the confirmation link to verify your account.'
+      } else if (error.message) {
+        errorMessage = error.message
+      }
+      
+      setError(errorMessage)
     } finally {
       setLoading(false)
     }
@@ -46,6 +91,7 @@
 
   return (
     <div className="max-w-md mx-auto">
+      <div className="mb-6">
       <h2 className="text-2xl font-bold text-center mb-6">
         {isSignUp ? 'Create Account' : 'Sign In'}
       </h2>
@@ -53,6 +99,15 @@
       {error && (
         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
           <div className="flex">
+            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
+            <p className="text-red-800 text-sm">{error}</p>
+          </div>
+        </div>
+      )}
+      
+      {success && (
+        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
+          <div className="flex">
+            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
             <p className="text-red-800 text-sm">{error}</p>
           </div>
         </div>
@@ -62,11 +117,19 @@
         <div className="mb-4">
           <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
             Email Address
+            <span className="text-red-500 ml-1">*</span>
           </label>
           <input
             type="email"
             id="email"
             value={email}
+            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
+              validationErrors.email 
+                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
+                : 'border-gray-300'
+            }`}
+            placeholder="Enter your email address"
+            autoComplete={isSignUp ? 'email' : 'username'}
             onChange={(e) => setEmail(e.target.value)}
             required
-            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
+            disabled={loading}
           />
+          {validationErrors.email && (
+            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
+          )}
         </div>
 
         <div className="mb-6">
           <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
             Password
+            <span className="text-red-500 ml-1">*</span>
           </label>
           <input
             type="password"
             id="password"
             value={password}
+            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
+              validationErrors.password 
+                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
+                : 'border-gray-300'
+            }`}
+            placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
+            autoComplete={isSignUp ? 'new-password' : 'current-password'}
             onChange={(e) => setPassword(e.target.value)}
             required
-            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
+            disabled={loading}
           />
+          {validationErrors.password && (
+            <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
+          )}
+          {isSignUp && !validationErrors.password && (
+            <p className="mt-1 text-xs text-gray-500">
+              Password must be at least 8 characters with uppercase, lowercase, and number
+            </p>
+          )}
         </div>
 
         <button
           type="submit"
-          disabled={loading}
-          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
+          disabled={loading || !email.trim() || !password}
+          className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium transition-colors ${
+            loading || !email.trim() || !password
+              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
+              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
+          }`}
         >
-          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
+          {loading ? (
+            <div className="flex items-center justify-center">
+              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
+              {isSignUp ? 'Creating Account...' : 'Signing In...'}
+            </div>
+          ) : (
+            isSignUp ? 'Create Account' : 'Sign In'
+          )}
         </button>
       </form>
+      
+      <div className="mt-6 text-center">
+        <p className="text-sm text-gray-600">
+          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
+          <button
+            type="button"
+            onClick={() => mode === 'signup' ? router.push('/auth/signin') : router.push('/auth/signup')}
+            className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
+          >
+            {isSignUp ? 'Sign In' : 'Sign Up'}
+          </button>
+        </p>
+      </div>
+      </div>
     </div>
   )
 }