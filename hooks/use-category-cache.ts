'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

let cachedCategories: Map<number, string> | null = null
let isLoadingCategories = false

export function useCategoryCache() {
  const [categories, setCategories] = useState<Map<number, string> | null>(cachedCategories)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (cachedCategories) {
      setCategories(cachedCategories)
      return
    }

    if (isLoadingCategories) return

    isLoadingCategories = true
    setIsLoading(true)

    const loadCategories = async () => {
      try {
        const supabase = createBrowserClient()
        const { data } = await supabase.from('categories_revenus').select('id, nom')
        
        if (data) {
          const catMap = new Map(data.map((cat: any) => [cat.id, cat.nom]))
          cachedCategories = catMap
          setCategories(catMap)
        }
      } finally {
        isLoadingCategories = false
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  return { categories, isLoading }
}
