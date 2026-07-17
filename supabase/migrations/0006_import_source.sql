-- =============================================================
-- 0006_import_source.sql
-- Nuevo origen de movimiento: importación de extracto bancario.
-- =============================================================

alter type public.transaction_source add value if not exists 'import';
