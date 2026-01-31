"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("avocat@fiscalia.com")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login - in production, this would call your auth API
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 text-white items-center justify-center p-16">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <h1 className="text-5xl font-bold">Fiscalia</h1>
          </div>
          <p className="text-xl text-zinc-300 leading-relaxed">
            Plateforme de gestion fiscale pour avocats et leurs clients
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">Espace Avocat</h2>
              <p className="text-zinc-600">
                Connectez-vous pour accéder à votre tableau de bord
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-black">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="avocat@fiscalia.com"
                  className="h-12 bg-white border-zinc-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-black">
                    Mot de passe
                  </Label>
                  <a href="#" className="text-sm text-zinc-600 hover:text-black">
                    Mot de passe oublié ?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="h-12 bg-white border-zinc-300"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-black hover:bg-zinc-800 text-white text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
              <p className="text-sm text-zinc-500">
                Accès réservé aux avocats du cabinet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
