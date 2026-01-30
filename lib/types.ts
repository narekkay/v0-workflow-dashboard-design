export interface Client {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
  custom_fields?: Array<{ name: string; value: string }>
  children?: Array<{ first_name: string; last_name: string; date_of_birth: string }>
  archived?: boolean
  is_complex?: boolean
  convention_signed?: boolean
}

export interface TaxProfile {
  id: string
  client_id: string
  revenue_type: string
  revenue_amount?: number
  tax_year: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  user_id: string
  name: string
  type: string
  url: string
  size?: number
  uploaded_at: string
}
