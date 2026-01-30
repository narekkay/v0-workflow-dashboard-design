-- Create demo users for Fiscalia
-- This script creates an avocat (lawyer) and a client user with test credentials

-- Insert avocat user
-- Note: In production, this should be done through Supabase Auth UI or Admin API
-- The password will be hashed automatically by Supabase Auth
DO $$
DECLARE
  avocat_user_id uuid;
  client_user_id uuid;
BEGIN
  -- Create avocat user (if not exists)
  -- Note: This requires admin privileges and uses Supabase's auth.users table
  -- In practice, you should use Supabase Dashboard or Admin API to create users
  
  -- For now, we'll just create the profiles entries
  -- Users must be created manually in Supabase Auth Dashboard with:
  -- Email: avocat@fiscalia.com, Password: avocat123!
  -- Email: client@fiscalia.com, Password: client123!
  
  -- Check if avocat profile exists, if not create placeholder
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'avocat@fiscalia.com') THEN
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'avocat@fiscalia.com',
      'Jean',
      'Delmas',
      'avocat',
      now(),
      now()
    );
    RAISE NOTICE 'Created avocat profile placeholder. Please create auth user in Supabase Dashboard.';
  END IF;

  -- Check if client profile exists, if not create placeholder
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'client@fiscalia.com') THEN
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'client@fiscalia.com',
      'Marie',
      'Martin',
      'client',
      now(),
      now()
    );
    RAISE NOTICE 'Created client profile placeholder. Please create auth user in Supabase Dashboard.';
  END IF;

END $$;

-- Display instructions
DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'IMPORTANT: You must create the auth users manually in Supabase:';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '2. Click "Add user" and create:';
  RAISE NOTICE '   - Email: avocat@fiscalia.com';
  RAISE NOTICE '   - Password: avocat123!';
  RAISE NOTICE '   - Auto Confirm User: YES';
  RAISE NOTICE '3. Click "Add user" again and create:';
  RAISE NOTICE '   - Email: client@fiscalia.com';
  RAISE NOTICE '   - Password: client123!';
  RAISE NOTICE '   - Auto Confirm User: YES';
  RAISE NOTICE '4. After creating users, update profiles table with auth user IDs';
  RAISE NOTICE '=================================================================';
END $$;
