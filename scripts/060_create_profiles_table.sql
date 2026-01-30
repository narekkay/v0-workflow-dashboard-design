-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('avocat', 'client')),
  full_name TEXT,
  phone TEXT,
  lawyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraints for role/lawyer_id relationship
ALTER TABLE public.profiles
ADD CONSTRAINT client_must_have_lawyer 
CHECK (
  (role = 'client' AND lawyer_id IS NOT NULL) OR 
  (role = 'avocat' AND lawyer_id IS NULL)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: avocat can read all profiles, client can read only their own
CREATE POLICY "avocat_read_all_profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'avocat'
    )
  );

CREATE POLICY "client_read_own_profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- UPDATE: any authenticated user can update only their own row
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT: only service role can insert (no policy for authenticated users)
-- This means profiles must be created via admin/service role

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
