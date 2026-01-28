"use server"

import { put } from "@vercel/blob"

interface ConventionData {
  conventionType: "forfait" | "temps_passe"
  hasResultClause: boolean
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientAddress: string
}

function generateConventionHtml(data: ConventionData): string {
  const clientName = `${data.clientFirstName} ${data.clientLastName}`
  const isForfait = data.conventionType === "forfait"
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Convention d'honoraires - ${clientName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; font-size: 16pt; margin-bottom: 30px; }
        h2 { font-size: 13pt; margin-top: 20px; margin-bottom: 10px; }
        p { margin-bottom: 10px; text-align: justify; }
        .parties { margin-bottom: 30px; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; }
        .signature-line { border-top: 1px solid black; margin-top: 60px; padding-top: 5px; }
      </style>
    </head>
    <body>
      <h1>CONVENTION D'HONORAIRES<br/>${isForfait ? "AU FORFAIT" : "AU TEMPS PASSÉ"}</h1>
      
      <div class="parties">
        <h2>ENTRE LES SOUSSIGNÉS :</h2>
        <p><strong>Le Cabinet :</strong><br/>
        Cabinet Martin & Associés, représenté par Me Sophie Martin, Avocat inscrit au Barreau de Paris,<br/>
        Adresse : 25 Avenue Montaigne, 75008 Paris<br/>
        Email : contact@martin-avocats.fr</p>
        
        <p style="text-align: center; margin: 20px 0;">ET</p>
        
        <p><strong>Le Client :</strong><br/>
        ${clientName}, demeurant ${data.clientAddress || "à compléter"}<br/>
        Email : ${data.clientEmail}</p>
      </div>
      
      <h2>PRÉAMBULE</h2>
      <p>Le Client souhaite confier à l'Avocat une mission de conseil et assistance juridique.
      La présente convention a pour objet de définir les modalités de cette mission ainsi que les conditions de rémunération de l'Avocat.</p>
      
      <h2>ARTICLE 1 – MISSION</h2>
      <p><strong>Nature de la mission :</strong> Conseil et assistance juridique dans le cadre de la déclaration d'impôt sur le revenu.</p>
      <p><strong>Diligences incluses :</strong> Rendez-vous et échanges, Étude du dossier et des pièces, Rédaction d'actes, Négociation, Suivi client.</p>
      
      <h2>ARTICLE 2 – DÉTERMINATION DES HONORAIRES</h2>
      ${isForfait ? `
      <p>Les honoraires de l'Avocat sont fixés de manière forfaitaire à <strong>3 000 € HT</strong>, soit <strong>3 600 € TTC</strong> (TVA à 20%).</p>
      <p>Ce forfait couvre l'ensemble des diligences décrites à l'article précédent. Toute prestation complémentaire fera l'objet d'un avenant.</p>
      <p><strong>Modalités de paiement :</strong> en une seule fois.</p>
      ` : `
      <p>Les honoraires de l'Avocat sont calculés au temps passé selon les taux horaires suivants :</p>
      <ul>
        <li>Associé : 350 € HT / heure</li>
        <li>Collaborateur : 200 € HT / heure</li>
      </ul>
      <p>TVA applicable : 20%</p>
      <p><strong>Périodicité de facturation :</strong> mensuelle</p>
      `}
      
      ${data.hasResultClause ? `
      <h2>ARTICLE 3 – HONORAIRE COMPLÉMENTAIRE DE RÉSULTAT</h2>
      <p>En sus des honoraires ${isForfait ? "forfaitaires" : "au temps passé"} prévus ci-dessus, un honoraire complémentaire de résultat est convenu entre les parties.</p>
      <p>Cet honoraire sera calculé sur l'économie réalisée. L'honoraire de résultat sera égal à <strong>10%</strong> de l'économie réalisée.</p>
      ` : ""}
      
      <h2>ARTICLE ${data.hasResultClause ? "4" : "3"} – FRAIS, DÉBOURS ET DÉPENS</h2>
      <p>Les frais et débours engagés par l'Avocat sont refacturés au Client à l'identique. Les frais de déplacement sont refacturés selon le barème kilométrique fiscal en vigueur.</p>
      
      <h2>ARTICLE ${data.hasResultClause ? "5" : "4"} – RÈGLEMENT</h2>
      <p><strong>Échéance :</strong> À réception de la facture</p>
      <p><strong>Mode de règlement :</strong> Virement bancaire</p>
      
      <h2>ARTICLE ${data.hasResultClause ? "6" : "5"} – CONTESTATION</h2>
      <p>En cas de contestation des honoraires, le Client peut saisir le Bâtonnier de l'Ordre des Avocats de Paris.</p>
      
      <div class="signature">
        <div class="signature-box">
          <p><strong>Le Cabinet</strong></p>
          <p>Fait à Paris, le ${new Date().toLocaleDateString("fr-FR")}</p>
          <div class="signature-line">Signature</div>
        </div>
        <div class="signature-box">
          <p><strong>Le Client</strong></p>
          <p>${clientName}</p>
          <div class="signature-line">Signature précédée de la mention "Lu et approuvé"</div>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function generateConventionPdf(data: ConventionData): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const html = generateConventionHtml(data)
    const clientName = `${data.clientFirstName}_${data.clientLastName}`.replace(/\s+/g, "_")
    const fileName = `Convention_${data.conventionType}_${clientName}_${Date.now()}.html`
    
    // Create a Blob from the HTML content
    const htmlBlob = new Blob([html], { type: "text/html" })
    
    // Upload to Vercel Blob
    const blob = await put(fileName, htmlBlob, {
      access: "public",
      addRandomSuffix: true,
      contentType: "text/html",
    })

    console.log("[v0] Convention uploaded to Vercel Blob:", blob.url)

    return {
      success: true,
      url: blob.url,
    }
  } catch (error) {
    console.error("[v0] Convention generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur de génération",
    }
  }
}
