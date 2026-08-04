# Prototype 01 file mapping

This mapping is the traceability contract between the immutable Sites export and the application integration. `Copied verbatim` means the source bytes are retained before the narrowly documented import or data-binding adaptations.

| Source file                    | Integrated file                                    | Copied verbatim      | Changes required                                                  | Reason                                                          | Real data source         | Parity status        |
| ------------------------------ | -------------------------------------------------- | -------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------ | -------------------- |
| `app/page.tsx`                 | `src/prototype-01/screens/page.tsx`                | Yes, with formatting | Relative imports, lint-directive removal, and type compatibility  | Retain the executable canonical source in the host module graph | Deterministic harness    | Source parity proved |
| `app/globals.css`              | `src/prototype-01/styles/globals.css`              | Yes, with formatting | Loaded only by the lazy Prototype 01 runtime                      | Prevent leakage into the production fallback                    | None                     | Source parity proved |
| `app/community-experience.css` | `src/prototype-01/styles/community-experience.css` | Yes                  | Import path only                                                  | Keep canonical Community composition                            | Community adapter        | Pending integration  |
| `app/explore-experience.css`   | `src/prototype-01/styles/explore-experience.css`   | Yes                  | Import path only                                                  | Keep canonical Explore composition                              | Explore registry adapter | Pending integration  |
| `app/messages-experience.css`  | `src/prototype-01/styles/messages-experience.css`  | Yes                  | Import path only                                                  | Keep canonical inbox and split view                             | Conversations adapter    | Pending integration  |
| `app/profile-experience.css`   | `src/prototype-01/styles/profile-experience.css`   | Yes                  | Import path only                                                  | Keep canonical Profile composition                              | Profile adapter          | Pending integration  |
| `app/*Experience.tsx`          | `src/prototype-01/components/*Experience.tsx`      | Yes, with formatting | Relative imports, host lint compatibility, and type-only fixes    | Reuse original visual components instead of recreating them     | Route-owned adapters     | Source parity proved |
| `app/layout.tsx`               | Not mounted in the application                     | No                   | Poppins/font and metadata contracts mapped into the existing root | The real application already owns SSR and routing               | Existing root route      | Contract mapped      |
| `public/*`                     | `src/prototype-01/assets/*`                        | Yes                  | Bundler import paths only                                         | Ship the exact canonical assets with the application            | None                     | Source parity proved |
| `package.json`                 | No runtime copy                                    | No                   | Dependency compatibility audit only                               | The application already contains the required runtime libraries | Existing lockfile        | Compatible           |

## Mapping rules

- No screenshot-derived component is permitted.
- Original names are retained whenever the host module graph allows it.
- Data fixtures may exist only in the deterministic parity harness.
- Runtime screens receive real data through `src/prototype-01/adapters/`.
- Any visual source file that requires more than import, type, callback, or data binding changes must be recorded here before the change is accepted.

## Primary real-data bindings

| Canonical composition | Integrated screen                               | Adapter / owner                                      | Status |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------- | ------ |
| Home                  | `src/prototype-01/screens/InicioScreen.tsx`     | `NativeInicioViewModel` and route-owned callbacks    | Bound  |
| Community             | `src/prototype-01/screens/ComunidadeScreen.tsx` | canonical tabs plus established route links          | Bound  |
| Explore               | `src/prototype-01/screens/ExplorarScreen.tsx`   | `nativeExploreRegistry`                              | Bound  |
| Inbox                 | `src/prototype-01/screens/ConversasScreen.tsx`  | `NativeConversationsViewModel`                       | Bound  |
| Profile               | `src/prototype-01/screens/PerfilScreen.tsx`     | existing profile route state, upload and save owners | Bound  |
