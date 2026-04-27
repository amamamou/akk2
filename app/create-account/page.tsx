"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function CreateAccountPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentView, setCurrentView] = useState<"login" | "register" | "forgot">("register")

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left purple panel with logo */}
      <div className="hidden lg:flex lg:w-1/2 items-stretch bg-gradient-to-br from-[#8b58ff] via-[#A473FF] to-[#5e3cff] text-white rounded-tr-[72px] rounded-br-[72px] overflow-hidden">
        {/* content margin inside rounded panel */}
        <div className="m-12 flex flex-col justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 p-1 bg-white rounded-2xl flex items-center justify-center mr-3">
              <Image src="/akousticarts.webp" alt="Akoustic Arts" width={40} height={40} className="rounded-md object-contain" />
            </div>
            <h1 className="text-xl font-semibold">Akoustic Arts</h1>
          </div>

          <div>
            <h2 className="text-4xl mb-6 leading-tight font-extrabold">Sound. Curated.</h2>
            <p className="text-white/90 text-lg leading-relaxed max-w-lg">Sign in to manage audio assets, playlists and live players for your locations.</p>
          </div>

          <div className="text-white/70 text-sm">Copyright © 2025 Akoustic Arts.</div>
        </div>
      </div>

      {/* Right plain white panel with form (no inner card, no logo) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-lg font-semibold text-foreground">Akoustic Arts</h1>
          </div>

          <h2 className="text-2xl font-semibold text-foreground mb-1 text-center">
            {currentView === "login" ? "Welcome Back" : currentView === "register" ? "Create Account" : "Reset Password"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {currentView === "login" && "Enter your email and password to access your account."}
            {currentView === "register" && "Create a new account to get started with Akoustic Arts."}
            {currentView === "forgot" && "Enter your email address and we'll send you a reset link."}
          </p>

          <div className="space-y-4">
            {currentView === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" className="h-12 border border-gray-200 rounded-lg bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#A473FF]" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input id="email" type="email" placeholder="user@company.com" className="h-12 border border-gray-200 rounded-lg bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#A473FF]" />
            </div>

            {currentView !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password" className="h-12 pr-10 border border-gray-200 rounded-lg bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#A473FF]" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            )}

            {currentView === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" className="h-12 pr-10 border border-gray-200 rounded-lg bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#A473FF]" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            )}

            {currentView === "login" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="remember" className="rounded border-gray-300 cursor-pointer" />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember Me</Label>
                </div>
                <Button variant="link" className="p-0 h-auto text-sm hover:text-opacity-80" style={{ color: "#A473FF" }} onClick={() => setCurrentView("forgot") }>
                  Forgot Your Password?
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button className="w-full h-12 text-sm font-medium text-white hover:opacity-90 rounded-lg shadow-none" style={{ backgroundColor: "#A473FF" }}>
              {currentView === "login" && "Log In"}
              {currentView === "register" && "Create Account"}
              {currentView === "forgot" && "Send Reset Link"}
            </Button>

            {currentView !== "forgot" && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or {currentView === "login" ? "Login" : "Sign Up"} With</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg bg-white shadow-none">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </Button>
                  <Button variant="outline" className="h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg bg-white shadow-none">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.96 3.64-.82 1.57.06 2.75.63 3.54 1.51-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    Apple
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

