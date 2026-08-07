
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.profile_status AS ENUM ('pending', 'approved', 'rejected', 'banned');
CREATE TYPE public.sex_type AS ENUM ('masculino', 'feminino');
CREATE TYPE public.marital_status AS ENUM ('solteiro', 'divorciado');
CREATE TYPE public.location_scope AS ENUM ('regiao', 'brasil', 'mundo', 'personalizado');

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 110),
  height_cm INTEGER CHECK (height_cm >= 120 AND height_cm <= 230),
  sex sex_type NOT NULL,
  marital marital_status NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  church TEXT NOT NULL,
  years_baptized INTEGER NOT NULL CHECK (years_baptized >= 0 AND years_baptized <= 100),
  bio TEXT,
  status profile_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see approved profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (status = 'approved' OR auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Users can edit their profile fields, but cannot self-approve
CREATE POLICY "update own profile fields" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Prevent regular users from changing their own status (admin-only field)
CREATE OR REPLACE FUNCTION public.protect_profile_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_status_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_status();

-- ============ PREFERENCES ============
CREATE TABLE public.profile_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age_min INTEGER NOT NULL CHECK (age_min >= 18),
  age_max INTEGER NOT NULL CHECK (age_max <= 110),
  location_scope location_scope NOT NULL,
  custom_states TEXT[] DEFAULT '{}',
  desired_quality TEXT,
  accepts_children BOOLEAN NOT NULL DEFAULT true,
  looking_for_bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (age_max >= age_min)
);
ALTER TABLE public.profile_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own preferences read" ON public.profile_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own preferences insert" ON public.profile_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own preferences update" ON public.profile_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

CREATE POLICY "photos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "user upload own photo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user update own photo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user delete own photo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============ AUTO USER ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
