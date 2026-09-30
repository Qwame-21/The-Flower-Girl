-- Add category column to gallery_items table
-- This column allows categorizing uploaded gallery photos

alter table public.gallery_items add column if not exists category text;
