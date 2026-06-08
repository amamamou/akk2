/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/app/context/AuthContext"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentView, setCurrentView] = useState<"login" | "register" | "forgot">("login")
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
    if (error) clearError()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })
    } catch (err) {
      console.error("Login error:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentView === "login") {
      await handleLogin(e)
    } else if (currentView === "register") {
      alert("Registration via frontend coming soon. Please contact support.")
    } else if (currentView === "forgot") {
      alert("Password reset coming soon. Please contact support.")
    }
  }

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left premium purple panel */}
      <div className="hidden lg:flex lg:w-1/2 items-stretch bg-gradient-to-br from-[#8b58ff] via-[#A473FF] to-[#5e3cff] text-white rounded-tr-[80px] rounded-br-[80px] overflow-hidden">
        <div className="m-16 flex flex-col justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 p-1 bg-white rounded-2xl flex items-center justify-center">
              <Image src="/akousticarts.webp" alt="Akoustic Arts" width={40} height={40} className="rounded-md object-contain" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Akoustic Arts</h1>
          </div>

          <div>
            <h2 className="text-5xl font-bold leading-tight mb-8 tracking-tight">Sound. Curated.</h2>
            <p className="text-white/85 text-base leading-relaxed max-w-lg font-normal">Manage audio assets, playlists, and live players for your locations with intuitive controls and real-time insights.</p>
          </div>

          <div className="text-white/60 text-xs tracking-wide">© 2026 Akoustic Arts. All rights reserved.</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-xl font-semibold text-[#1a1a1a]">Akoustic Arts</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2 tracking-tight">
              {currentView === "login" ? "Welcome Back" : currentView === "register" ? "Create Account" : "Reset Password"}
            </h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              {currentView === "login" && "Enter your email and password to access your account."}
              {currentView === "register" && "Create a new account to get started with Akoustic Arts."}
              {currentView === "forgot" && "Enter your email address and we'll send you a reset link."}
            </p>
          </div>

          <div className="space-y-5">
            {currentView === "register" && (
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-sm font-medium text-[#1a1a1a]">Full Name</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="input-base"
                />
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#1a1a1a]">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="user@company.com" 
                value={formData.email} 
                onChange={handleInputChange} 
                className="input-base"
              />
            </div>

            {currentView !== "forgot" && (
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-medium text-[#1a1a1a]">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    className="input-base pr-10"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-[#666666]" /> : <Eye className="h-4 w-4 text-[#666666]" />}
                  </Button>
                </div>
              </div>
            )}

            {currentView === "register" && (
              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1a1a1a]">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm password" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange} 
                    className="input-base pr-10"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-[#666666]" /> : <Eye className="h-4 w-4 text-[#666666]" />}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {currentView === "login" && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border border-[#e5e5e5] cursor-pointer" />
                  <Label htmlFor="remember" className="text-sm text-[#666666] cursor-pointer font-normal">Remember me</Label>
                </div>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm font-medium hover:text-opacity-80 text-[#A473FF]" 
                  onClick={() => setCurrentView("forgot")}
                >
                  Forgot password?
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-11 mt-7 text-sm font-semibold text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {currentView === "login" && "Signing in..."}
                {currentView === "register" && "Creating account..."}
                {currentView === "forgot" && "Sending..."}
              </>
            ) : (
              <>
                {currentView === "login" && "Sign in"}
                {currentView === "register" && "Create account"}
                {currentView === "forgot" && "Send reset link"}
              </>
            )}
          </Button>

          {currentView !== "forgot" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><Separator className="w-full bg-[#e5e5e5]" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-[#666666] font-medium tracking-wide">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11 border border-[#e5e5e5] hover:bg-[#f9f9fa] rounded-lg bg-white text-[#1a1a1a] font-medium text-sm transition-all duration-200" disabled>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </Button>
                <Button variant="outline" className="h-11 border border-[#e5e5e5] hover:bg-[#f9f9fa] rounded-lg bg-white text-[#1a1a1a] font-medium text-sm transition-all duration-200" disabled>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.96 3.64-.82 1.57.06 2.75.63 3.54 1.51-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  Apple
                </Button>
              </div>
            </>
          )}

          {currentView === "login" && (
            <div className="mt-7 text-center text-sm text-[#666666]">
              Don&apos;t have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-sm font-semibold hover:text-opacity-80 text-[#A473FF]"
                onClick={() => setCurrentView("register")}
              >
                Create one
              </Button>
            </div>
          )}

          {(currentView === "register" || currentView === "forgot") && (
            <div className="mt-7 text-center">
              <Button
                variant="link"
                className="p-0 h-auto text-sm font-semibold hover:text-opacity-80 text-[#A473FF]"
                onClick={() => setCurrentView("login")}
              >
                Back to sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

