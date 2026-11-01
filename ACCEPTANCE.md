# Acceptance checks — v1.0.0-rc.2

Steve is the acceptance tester. Use a test Neon branch and Vercel preview before production.
Do not mark a requirement accepted solely from the mocked tests.

| Test | Steps and expected result | Requirements |
|---|---|---|
| A01 | Run migration with existing rows. Count and original fields stay intact; new columns/table exist. Repeat migration successfully. | FR-004, TR-002 |
| A02 | Enter and Save name. Reload/browser restart restores it. Second device has separate name. Verify Neon queue_profiles, no localStorage. Clear cookie and verify fresh name entry. | FR-002 |
| A03 | Search title; select intended movie/year/type from candidates. Before selection no row is inserted. | FR-003,010,011,012,013 |
| A04 | Confirm cast, US subscription services, IMDb, RT, added-by and timestamp against provider output. Missing values read Not available. | FR-014–020 |
| A05 | Add six distinct titles. Only five newest initially; Show More reveals six; Show Less returns to five. | FR-005,006 |
| A06 | Add same selection twice and simultaneously on two devices. Exactly one row persists; duplicate attempt shows message. | FR-007 |
| A07 | With more than five entries, search for an older title. It appears despite initially being hidden. Search is case-insensitive; clearing restores newest five; no-match message is clear. | FR-021 |
| A08 | Cancel Remove: row remains. Confirm Remove: row disappears for everyone; deleting missing ID returns 404. | FR-008 |
| A09 | Open on iPhone, iPad, desktop. Inputs/cards/buttons remain usable. Safari Add to Home Screen launches correct app/icon online. | TR-005,006 |
| A10 | Blank/long name/title, invalid JSON/ID/type: validation or search, no invalid rows; database/API outages show readable errors. | TR-008 |
| A11 | Disable OMDb in preview: add still works with unavailable ratings. Disable TMDB: no false success or insertion. | FR-020, TR-008 |
| A12 | Close/reopen app; queue persists. Review source and browser bundle for no embedded credentials. | FR-004, TR-007 |
| A13 | Check files' release headers, requirements IDs, GitHub commit and Vercel preview/build; verify production after accepted merge. | TR-001,003,004,009–011 |

| A14 | Reload and revisit later: entries remain in creation order. No watched controls exist. Only confirmed Remove deletes a row. | FR-008,022; FR-009 withdrawn |

| A15 | Make /api/profile reject, return 500, malformed JSON, or time out. Name entry and queue controls remain enabled. Enter name and retry Save name after recovery. Delay profile success while typing: manual name is preserved. | Profile outage regression |
