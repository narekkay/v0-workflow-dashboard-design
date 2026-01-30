import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span className="text-xl font-bold tracking-tight">Fiscalia</span>
          </div>
          <Link href="/login">
            <Button className="bg-black hover:bg-black/90 text-white rounded-md">Se connecter</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative py-32 md:py-40 overflow-hidden bg-[#1a1a1a]">
          {/* Grille visible */}
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />

          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 text-white">
                Gestion fiscale simplifiée pour les avocats
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                Fiscalia centralise la gestion de vos clients, leurs déclarations fiscales et leurs documents. Une plateforme sécurisée pour optimiser votre pratique.
              </p>
              <Link href="/login">
                <Button size="lg" className="h-11 px-7 text-base bg-white hover:bg-gray-100 text-black rounded-md">
                  Accéder à la plateforme
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités principales</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Gestion des clients</h3>
                <p className="text-muted-foreground">
                  Centralisez les informations de vos clients et suivez leurs dossiers fiscaux en temps réel.
                </p>
              </div>
              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Documents sécurisés</h3>
                <p className="text-muted-foreground">
                  Échangez des documents de manière sécurisée avec vos clients via un espace dédié.
                </p>
              </div>
              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Déclarations 2042</h3>
                <p className="text-muted-foreground">
                  Générez automatiquement les formulaires fiscaux à partir des revenus de vos clients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Connectez-vous à votre espace avocat pour accéder à toutes les fonctionnalités de la plateforme.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-12 px-8">
                Se connecter
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Fiscalia - Plateforme de gestion fiscale pour avocats</p>
        </div>
      </footer>
    </div>
  )
}
