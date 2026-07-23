# Community Platform V2

This directory is the incremental boundary for the Vai Dar Namoro community
platform reconstruction.

- `app/`: application shell contracts, router context, build identity and
  authentication navigation.
- `design-system/`: concrete visual and accessibility acceptance constraints.
- `domains/`: explicit product-domain ownership and dependency rules.
- `platform/`: feature flags, Supabase adapters, observability and shared
  runtime capabilities.
- `legacy/`: compatibility contracts and preservation invariants.

The existing routes and modules remain the active implementation. V2 features
must stay disabled by default and enter through small, reversible slices. A V2
domain may read legacy data only through a documented adapter; it must not
silently change ownership, delete data or bypass RLS.
