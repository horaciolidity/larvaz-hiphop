-- Permite el rol super_admin en la tabla de perfiles.
-- Mientras esta migración no se aplique, la app eleva a super_admin
-- a la cuenta fundadora desde src/lib/roles.ts.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'moderator', 'admin', 'super_admin'));

-- Marca a la cuenta fundadora como Super Admin (requiere que ya exista).
UPDATE public.profiles
SET role = 'super_admin'
WHERE lower(username) = 'horaciowalter';
