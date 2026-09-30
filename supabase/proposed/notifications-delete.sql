-- Policy to allow staff to delete their own notifications
-- This is needed if the default RLS policy blocks deletion

-- First, check existing policies
-- This policy allows authenticated staff to delete admin_notifications rows

create policy "staff can delete admin_notifications"
on public.admin_notifications
for delete
to authenticated
using (public.is_staff())
with check (public.is_staff());
