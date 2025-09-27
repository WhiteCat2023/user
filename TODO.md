# TODO: Refine AuthProvider for Bottom Tab Navigation Fix

## Steps to Complete:

1. **Update initial state in AuthProvider:**
   - Change `user` initial state from `{}` to `null`.
   - Ensure `userDoc` resets to `{}` when no user.

2. **Fix onAuthStateChanged useEffect:**
   - Add strict check: if (currentUser) { getUserDoc(currentUser.uid, setUserDoc); } else { setUserDoc({}); }

3. **Refactor redirect useEffect:**
   - Import `useRef` from 'react'.
   - Create a ref flag: `const hasRedirected = useRef(false);`
   - Remove `pathname` from dependencies (only `[session]`).
   - Update logic: If session changes to true and !hasRedirected.current and currentPath is auth page, router.replace("/(tabs)"); hasRedirected.current = true;
   - For !session, reset flag and redirect to "/" if not on auth page.
   - Refine pathCollection to exact matches: const authPaths = ["/", "/signup", "/forgot-password", "/reset-password"];

4. **Update login and register functions:**
   - After successful signIn/signUp, add `router.replace("/(tabs)");` to manually navigate.

5. **Update logout function:**
   - After success, add `setUserDoc({}); setRole(null);`

6. **Testing and Cleanup:**
   - Run lint check.
   - Test navigation: Login, switch tabs, logout, app restart for persistence.
   - Mark all steps complete and remove TODO.md if successful.

Progress: None completed yet.
