# Supabase boundary

V2 modules must not create a second Supabase project or import the admin client
into browser code.

Adapters introduced here must:

- use the generated database types;
- identify whether evidence comes from code, types, migration history or the
  published project;
- preserve RLS as an enforcement boundary;
- keep `service_role` in server-only modules;
- expose domain-specific queries and commands instead of a generic repository;
- support compatibility reads before any data-model cutover.

No adapter is implemented until its published tables, policies and invariants
have been reconciled.
