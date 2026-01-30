/**
 * Admin-only seed script to create demo users
 * Run with: npx tsx scripts/seed-users.ts
 * 
 * REQUIRES: SUPABASE_SERVICE_ROLE_KEY environment variable
 * This key should NEVER be exposed to the browser
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedUsers() {
  console.log('Creating demo users...')

  // Create avocat user
  const { data: avocatAuth, error: avocatError } = await supabase.auth.admin.createUser({
    email: 'avocat@fiscalia.com',
    password: 'avocat',
    email_confirm: true // Auto-confirm email
  })

  if (avocatError) {
    console.error('Error creating avocat user:', avocatError.message)
    return
  }

  console.log('Created avocat auth user:', avocatAuth.user.id)

  // Create client user
  const { data: clientAuth, error: clientError } = await supabase.auth.admin.createUser({
    email: 'client@fiscalia.com',
    password: 'client',
    email_confirm: true
  })

  if (clientError) {
    console.error('Error creating client user:', clientError.message)
    return
  }

  console.log('Created client auth user:', clientAuth.user.id)

  // Insert avocat profile first (since client needs to reference it)
  const { error: avocatProfileError } = await supabase
    .from('profiles')
    .insert({
      id: avocatAuth.user.id,
      role: 'avocat',
      full_name: 'Me Jean Dupont',
      is_active: true
    })

  if (avocatProfileError) {
    console.error('Error creating avocat profile:', avocatProfileError.message)
    return
  }

  console.log('Created avocat profile')

  // Insert client profile with lawyer_id pointing to avocat
  const { error: clientProfileError } = await supabase
    .from('profiles')
    .insert({
      id: clientAuth.user.id,
      role: 'client',
      full_name: 'Marie Martin',
      lawyer_id: avocatAuth.user.id,
      is_active: true
    })

  if (clientProfileError) {
    console.error('Error creating client profile:', clientProfileError.message)
    return
  }

  console.log('Created client profile')

  console.log('\n=== Demo Users Created ===')
  console.log('Avocat:')
  console.log('  Email: avocat@fiscalia.com')
  console.log('  Password: avocat')
  console.log('  ID:', avocatAuth.user.id)
  console.log('\nClient:')
  console.log('  Email: client@fiscalia.com')
  console.log('  Password: client')
  console.log('  ID:', clientAuth.user.id)
}

seedUsers()
