-- ============================================
-- INSTRUÇÕES PARA CRIAR O USUÁRIO ADMIN
-- ============================================

-- PASSO 1: Criar o usuário no Supabase Dashboard
-- Acesse: https://supabase.com/dashboard/project/pucffqitvaibhwmehhix/auth/users
-- Clique em "Add User" → "Create new user"
-- Preencha:
--   Email: admin@agendapro.com
--   Password: password
--   Auto Confirm User: ✅ (IMPORTANTE: marque esta opção)
-- Clique em "Create user"

-- PASSO 2: Execute o SQL abaixo no SQL Editor do Supabase
-- Acesse: https://supabase.com/dashboard/project/pucffqitvaibhwmehhix/sql/new

-- Atualizar o perfil do admin para ter role 'admin'
UPDATE public.profiles 
SET 
    role = 'admin', 
    full_name = 'Administrador'
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@agendapro.com'
);

-- Verificar se o usuário foi criado corretamente
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.role,
    p.full_name,
    p.business_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@agendapro.com';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Você deve ver uma linha com:
-- - email: admin@agendapro.com
-- - email_confirmed_at: (data/hora atual)
-- - role: admin
-- - full_name: Administrador
-- - business_id: null

-- ============================================
-- APÓS EXECUTAR:
-- ============================================
-- 1. Acesse: http://localhost:3001/#/admin/login
-- 2. Use as credenciais:
--    Email: admin@agendapro.com
--    Senha: password
-- 3. Você será redirecionado para /admin (Platform Dashboard)
