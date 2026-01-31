"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useState } from "react"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: string
}

const integrations: Integration[] = [
  { id: "gmail", name: "Gmail", description: "Synchronisez vos emails et envois de documents", category: "Communication", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gmail_logo-dHcM2RBOUlXfyjOs08BddmGBDwnjtX.png" },
  { id: "bofip", name: "Bofip", description: "Base officielle des impôts", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bofip_logo-OsG80Bfx2SSh4rOlNSF4JBsMWgrr0b.png" },
  { id: "legifrance", name: "LegiFrance", description: "Service public de diffusion du droit", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/legifrance_logo-CKsQXh4Gg3uXoaDl5mxWBSbyWVk8Xf.png" },
  { id: "pappers", name: "Pappers", description: "Données légales et financières des entreprises", category: "Recherche", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Pappers-logo-blue-mRwqKGqrPBTnRvyGlCeqv9EU7y31ES.png" },
  { id: "navis", name: "Navis", description: "Plateforme de veille fiscale", category: "Veille", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capture-decran-2023-10-26-a-16.29.26-lBYNJosgmMUr4czpn6rE9NCsRT6KA0.png" },
  { id: "wisetax", name: "Wisetax", description: "Solution de gestion fiscale", category: "Gestion", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-wisetax-b9mBRHRm5WaMBHxGivAX0d9svbowq9.svg" },
  { id: "revue-fiduciaire", name: "Revue Fiduciaire", description: "Documentation fiscale et sociale", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/revue_fiduciaire_png-w37fpimTeiHlxsPWFv03emz5VbJfbt.jpeg" },
  { id: "doctrine", name: "Doctrine", description: "Base de données juridique", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/doctrine_png-A8RlT0XKwckZqFGohIRKgau9ZxCIk8.png" },
  { id: "lexbase", name: "Lexbase", description: "Plateforme juridique et fiscale", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lexbase-QPy7H1bt8dktwujt9Kasmx8vdDg679.png" },
  { id: "lexisnexis", name: "Lexisnexis", description: "Solutions juridiques professionnelles", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lexisnaxis-bZI3bK616gmlAe5D8CPCOKo2O1tO7I.png" },
  { id: "lamyline", name: "Lamyline", description: "Documentation juridique Lamy", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lamyline-DlPwFTHyojNxWt1FYS7lS2vbF6cF7L.png" },
  { id: "legifiscale", name: "LegiFiscale", description: "Documentation et veille fiscale", category: "Documentation", icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/legifiscal-AkGgTX8PLSiPQ56iV63Wp8rHD1aQ9k.png" },
]

export function IntegrationsView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
  
  const categories = ["Tous", "Documentation", "Communication", "Recherche", "Veille", "Gestion"]
  
  const filteredApps = selectedCategory === "Tous" 
    ? integrations 
    : integrations.filter(app => app.category === selectedCategory)

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Intégrations</h1>
          <p className="text-muted-foreground">
            Connectez vos outils juridiques et fiscaux préférés
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {app.icon.startsWith("http") ? (
                  <img 
                    src={app.icon} 
                    alt={`${app.name} logo`}
                    className="w-7 h-7 object-contain"
                  />
                ) : (
                  <span className="text-lg">{app.icon}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                  {app.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {app.description}
                </p>
              </div>

              {/* Connect Button */}
              <Button
                onClick={() => {
                  console.log("[v0] Connecting to:", app.name)
                }}
                size="sm"
                variant="outline"
                className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700"
              >
                Connecter
              </Button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune intégration trouvée dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  )
}
