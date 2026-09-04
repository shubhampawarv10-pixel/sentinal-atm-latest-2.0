/*
# Auto-create profile on user signup

## Purpose
When a new user signs up via Supabase Auth, this trigger automatically
creates a row in the `profiles` table with the default role 'analyst'.

## Changes
- Creates `handle_new_user()` function that inserts a profile row
- Creates a trigger on `auth.users` that fires AFTER INSERT
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Officer')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
