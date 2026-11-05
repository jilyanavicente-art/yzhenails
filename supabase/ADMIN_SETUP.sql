-- Run only after creating the admin account in Supabase Authentication.
-- Replace the UUID below with the admin user's actual auth.users UUID.
insert into public.booking_admins (user_id)
values ('PASTE-ADMIN-USER-UUID-HERE');
