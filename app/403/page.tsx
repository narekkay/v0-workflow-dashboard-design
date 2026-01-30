import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">403</h1>
        <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
        <p className="text-muted-foreground mb-6">
          Vous n'avez pas les droits pour accéder à cette page.
        </p>
        <Link href="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  )
}
