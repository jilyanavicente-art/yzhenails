# Yzhe Nails – Online Booking Website

A Next.js + Supabase appointment booking website for Yzhe Nails.

## Included
- Public booking page with December 2026 calendar
- Five daily time slots: 9 AM, 11 AM, 1 PM, 3 PM, 5 PM
- Instant booking confirmation
- Atomic database booking function to prevent double booking
- Admin login and dashboard
- Admin can close/reopen individual slots, close a whole date, mark a date fully booked, reopen a date, and cancel bookings
- December 14 and 15 start as FULL
- December 25 and 26 start as CLOSED
- All other December dates start OPEN
- Public calendar only shows first names, never phone numbers

## 1. Requirements
Install Node.js (LTS), then open this folder in VS Code.

## 2. Install packages
```bash
npm install
```

## 3. Create Supabase project
1. Go to https://supabase.com and create a project.
2. Open **SQL Editor**.
3. Copy and run all of `supabase/schema.sql`.
4. In Supabase **Project Settings → API**, copy Project URL and anon/public key.
5. Copy `.env.example` to `.env.local` and paste the values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 4. Create admin account
1. In Supabase, open **Authentication → Users**.
2. Add a user with the admin email and a strong password.
3. Copy that user's UUID.
4. In SQL Editor, run:
```sql
insert into public.booking_admins (user_id)
values ('PASTE-ADMIN-USER-UUID-HERE');
```
Only users listed in `booking_admins` can manage schedules. Do not share the admin password.

## 5. Run locally
```bash
npm run dev
```
Open http://localhost:3000.
Admin page: http://localhost:3000/admin

## 6. Publish online
1. Create a GitHub repository named `yzhe-nails-booking`.
2. Upload/push this project. Do not upload `.env.local`.
3. In Vercel, import the GitHub repository.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Vercel Project Settings → Environment Variables.
5. Deploy. Your public booking link will be the Vercel domain (you can add a custom domain later).

## Important
- GitHub stores the source code; Vercel hosts the public website; Supabase stores the live bookings.
- The SQL seed marks Dec 14 and 15 as FULL without inventing customer names or reservations.
- Admin's **Open all slots** action clears existing bookings for that date. Use it carefully.
- For production, add a privacy notice and confirm the salon's customer-data retention policy.
