-- Execute no SQL Editor APENAS depois de criar a usuária em Authentication > Users.
-- Troque o UUID abaixo pelo ID exato da usuária administradora.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = '00000000-0000-0000-0000-000000000000';

-- A usuária deve sair e entrar novamente após esta alteração para renovar o JWT.
