# Project Rules

- Before saying a UI change is done, test the changed user flow in the running app, not only with `npm run typecheck` and `npm run build`.
- For visual or interaction changes, verify the affected screen manually in the browser/Electron window and check the exact control that was changed.
- If a change touches selects, menus, drag-and-drop, file uploads, navigation, or table actions, test that interaction directly before reporting completion.
- If full manual verification is not possible, say that explicitly and do not present the change as fully checked.
