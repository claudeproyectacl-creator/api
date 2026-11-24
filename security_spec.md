# FINDI Firestore Security Specification (Phase 0)

## Data Invariants
1. Every document under `/users/{userId}` belongs strictly to the authenticated user whose `request.auth.uid == userId`.
2. Unauthenticated requests are denied for every read and write operation.
3. No user can read, list, create, update, or delete another user's transactions, categories, goals, or settings.
4. Every document enforces strict `keys().hasAll(...)` and `keys().hasOnly(...)` schema checks on create, plus `affectedKeys().hasOnly(...)` and `isValid[Entity]()` on update.
5. `ownerId` / `uid` and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must match `request.time`.
6. Numeric amounts (`amount`, `targetAmount`, `savedAmount`, `monthlyLimit`) are strictly bounded (`> 0` where required, `<= 1_000_000`) and strings enforce strict `.size()` limits and regex patterns for IDs, dates, and colors.

## Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read of `/users/userA/transactions/tx1`.
2. Cross-user read: `userB` attempting `get` or `list` on `/users/userA/transactions`.
3. Cross-user write: `userB` attempting to create `/users/userA/transactions/tx1`.
4. Identity spoofing: `userA` creating a transaction under `/users/userA/transactions/tx1` with `ownerId: "userB"`.
5. Shadow field injection: `userA` creating a transaction with extra ghost field `isAdmin: true`.
6. Negative amount: `userA` creating a transaction with `amount: -50`.
7. Oversized note / DoS payload: `userA` creating a transaction with a 5000-character `note`.
8. Invalid date format: `userA` creating a transaction with `date: "2026/11/24"`.
9. Path ID poisoning: `userA` creating `/users/userA/transactions/bad$id` with invalid characters.
10. Timestamp spoofing: `userA` creating a document with a backdated `createdAt` not equal to `request.time`.
11. Immutable field tampering: `userA` updating a goal's `ownerId` or `createdAt`.
12. Invalid savings withdrawal: `userA` updating a goal to `savedAmount: -10`.
