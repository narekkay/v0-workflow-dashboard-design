import { redirect } from "next/navigation"

export default function LandingPage() {
  redirect("/dashboard")
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span className="text-lg font-semibold text-black">Fiscalia</span>
          </div>
          <Link href="/login">
            <Button className="bg-black hover:bg-zinc-800 text-white h-10 px-6 font-medium">
              Se connecter
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-zinc-950 text-white py-32">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Gestion fiscale simplifiée pour les avocats
          </h1>
          <p className="text-xl text-zinc-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Fiscalia centralise la gestion de vos clients, leurs déclarations fiscales et leurs documents. Une plateforme sécurisée pour optimiser votre pratique.
          </p>
          <Link href="/login">
            <Button className="bg-white hover:bg-zinc-100 text-black h-12 px-8 text-base font-semibold">
              Accéder à la plateforme
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-black">
            Fonctionnalités principales
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">
                Gestion des clients
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Centralisez les informations de vos clients et suivez leurs dossiers fiscaux en temps réel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">
                Documents sécurisés
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Échangez des documents de manière sécurisée avec vos clients via un espace dédié.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">
                Déclarations 2042
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Générez automatiquement les formulaires fiscaux à partir des revenus de vos clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-24">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-zinc-300 mb-8">
            Connectez-vous à votre espace avocat pour accéder à toutes les fonctionnalités de la plateforme.
          </p>
          <Link href="/login">
            <Button className="bg-white hover:bg-zinc-100 text-black h-12 px-8 text-base font-semibold">
              Se connecter
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <p className="text-sm text-zinc-600">
            Fiscalia - Plateforme de gestion fiscale pour avocats
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-zinc-600 hover:text-black underline">
              Support technique
            </a>
            <span className="text-zinc-300">—</span>
            <a href="#" className="text-sm text-zinc-600 hover:text-black underline">
              Mentions légales
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
