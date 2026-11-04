# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Document ID Hardening**: Every single-document target operation (`get`, `create`, `update`, `delete`) on `/syllabus_data/{lessonId}` validates `isValidId(lessonId)` (`lessonId is string && lessonId.size() <= 128 && lessonId.matches('^[a-zA-Z0-9_\\-]+$')`).
3. **Explicit Public Curriculum Visibility on Reads**: Reading (`get` or `list`) from `/syllabus_data/{lessonId}` is allowed only when `resource.data.visibility == 'public'`.
4. **Verified Identity & Ownership on Writes**: Creating or updating a document in `/syllabus_data/{lessonId}` requires an authenticated user with a verified email (`request.auth != null && request.auth.token.email_verified == true`), and `incoming().authorId == request.auth.uid`.
5. **Strict Schema & Volumetric Blueprint (`isValidSyllabusLessonPlan`)**: Both `create` and `update` operations must pass `isValidSyllabusLessonPlan(incoming())`, enforcing exact key allowlists (`hasAll` and `hasOnly`), exact enum memberships (`board`, `section`, `planType`, `visibility`), regex checks on `authorId`, and strict string length bounds on every field.
6. **Temporal & Ownership Immutability**:
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().authorId == existing().authorId && incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`, plus `affectedKeys().hasOnly(...)` restricting mutations to content fields and `updatedAt`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection**: Creating a `/syllabus_data/doc1` payload containing an undeclared field `isAdminApproved: true`. (Rejected by `data.keys().hasOnly(...)`).
2. **Identity Spoofing on Create**: Creating `/syllabus_data/doc1` where `authorId` is set to another user's UID (`"other_user_123"`). (Rejected by `incoming().authorId == request.auth.uid`).
3. **Unverified Email Write**: Attempting to create `/syllabus_data/doc1` with a token where `email_verified == false`. (Rejected by `isVerifiedUser()`).
4. **ID Poisoning Attack**: Attempting `create` or `get` on `/syllabus_data/invalid$id!with*special*chars`. (Rejected by `isValidId(lessonId)`).
5. **Denial-of-Wallet String Overflow**: Sending a 10,000-character string in `procedure` (max 5,000). (Rejected by `data.procedure.size() <= 5000`).
6. **Enum Bypass Attack**: Setting `board: "Unknown Board"` or `planType: "Monthly"`. (Rejected by `data.board in ['Sindh STBB', 'Punjab PTB']`).
7. **Timestamp Forgery on Create**: Supplying a past or future client timestamp for `createdAt` or `updatedAt`. (Rejected by `incoming().createdAt == request.time`).
8. **Ownership Hijack on Update**: Updating an existing document to change `authorId` to another user. (Rejected by `existing().authorId == request.auth.uid && incoming().authorId == existing().authorId`).
9. **Immortal Field Mutation (`createdAt`)**: Modifying `createdAt` during an update operation. (Rejected by `incoming().createdAt == existing().createdAt` and `affectedKeys().hasOnly(...)`).
10. **Value Poisoning on Update**: Updating `slos` with a number `12345` or empty string `""` using a partial update. (Rejected because `isValidSyllabusLessonPlan(incoming())` wraps the entire `allow update` rule).
11. **Private Document Read Leak**: Attempting `get` or `list` on a document whose `visibility` is not `'public'`. (Rejected by `resource.data.visibility == 'public'`).
12. **Unauthorized Delete by Non-Owner**: Attempting to `delete` a document owned by another teacher. (Rejected by `existing().authorId == request.auth.uid`).
