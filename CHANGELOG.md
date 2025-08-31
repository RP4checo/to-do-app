## Refactor: Structure, Types, and Docs (no behavior change)

- Added centralized types in `src/types` (Todo, enhance payload/response, credentials errors).
- Added constants in `src/lib/constants.ts` (table name, channel, routes, UI strings).
- Updated imports across app to use shared types/constants; no runtime changes.
- Hardened `src/lib/enhance.ts` typings and added TSDoc.
- Minor tidy in `src/lib/supabase.ts` with doc and validation message.
- Kept all Supabase queries, routes, and UI exactly the same.
- Documentation: expanded `README.md` and added this CHANGELOG.

