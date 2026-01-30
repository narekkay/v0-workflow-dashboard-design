-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "avocat_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "client_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

-- Simple policy: users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Simple policy: users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Simple policy: users can insert their own profile (for auth trigger)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: For avocat to read all profiles, we'll use service role queries in the backend
-- or implement a different approach that doesn't cause recursion
