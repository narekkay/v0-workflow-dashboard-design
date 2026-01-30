-- Link all existing clients to avocat@fiscalia.com
-- This script finds the avocat user and assigns all client profiles to them

DO $$
DECLARE
  avocat_user_id UUID;
BEGIN
  -- Find the avocat@fiscalia.com user ID
  SELECT id INTO avocat_user_id
  FROM auth.users
  WHERE email = 'avocat@fiscalia.com'
  LIMIT 1;

  -- Check if avocat exists
  IF avocat_user_id IS NULL THEN
    RAISE EXCEPTION 'User avocat@fiscalia.com not found in auth.users';
  END IF;

  -- Update all client profiles to have this avocat as their lawyer
  UPDATE public.profiles
  SET lawyer_id = avocat_user_id
  WHERE role = 'client' 
    AND (lawyer_id IS NULL OR lawyer_id != avocat_user_id);

  -- Log the result
  RAISE NOTICE 'Successfully linked % client(s) to avocat@fiscalia.com (ID: %)', 
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'client' AND lawyer_id = avocat_user_id),
    avocat_user_id;
END $$;
