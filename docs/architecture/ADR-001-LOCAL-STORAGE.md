
# ADR 001: LocalStorage for Persistence

## Status
Accepted

## Context
We need a way to persist data (Employees, Attendance, Payroll) for the MVP/Demo version of PunchClock without incurring backend cloud costs or latency.

## Decision
We will use the browser's `localStorage` via a custom `useStickyState` hook.

## Consequences
### Positive
*   **Zero Latency**: Instant reads/writes.
*   **Zero Cost**: No database hosting required.
*   **Offline by Default**: Works perfectly without internet.

### Negative
*   **No Sync**: Data is trapped on the specific device/browser.
*   **Security**: Data is accessible if the device is compromised (though encrypted at rest by OS).
*   **Capacity**: Limited to ~5MB.

## Mitigation
*   Future roadmap includes migration to Supabase (PostgreSQL) for v3.0 to enable cloud sync.
