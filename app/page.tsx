import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span className="text-xl font-bold tracking-tight">Fiscalia</span>
          </div>
          <Link href="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          {/* Background avec grille */}
          <div className="absolute inset-0 z-0">
            {/* Grille de fond */}
            <div 
              className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgb(15 23 42 / 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgb(15 23 42 / 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px'
              }}
            />
            {/* Vignette subtile */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-100/50 dark:to-slate-950/50" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Gestion fiscale simplifiée pour les avocats
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Fiscalia centralise la gestion de vos clients, leurs déclarations fiscales et leurs documents. 
                Une plateforme sécurisée pour optimiser votre pratique.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Accéder à la plateforme
                  </Button>
                </Link>
              </div>
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
