-- Clear all standalone benefits; benefits are now auto-managed per species/variant via the catalog form.
-- The benefit_id foreign keys on pet_species and pet_variants use ON DELETE SET NULL.
DELETE FROM public.pet_benefits;