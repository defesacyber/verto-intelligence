-- Fix: add missing foreign key on alert_history.user_id → auth.users
-- Previously this column had no referential integrity constraint.

ALTER TABLE public.alert_history
  ADD CONSTRAINT alert_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
