# Changelog

## v0.4.x
- Added: Quick Edit tab (selection-based), Apply-only normalization, Reservations tab, modern light UX (HtmlDialog)
- Fixed: Canonical code (PREFIX-N) resolves PL-1 vs PL-01, Kinds JSON fallback/migration, Hidden & Samples sync, reduced startup lag
- Behavior: Only number overrides are allowed; prefix is locked by Type (Kinds)
 - Swap: Full metadata swap with guards (locked/hidden disallowed) and detailed logging
 - Normalize: More robust gap-fill with name-conflict handling; allocator considers all names to avoid collisions
 - Scheduler: Enter-to-apply shortcut; Apply buttons use check icon
 - Logs: UI Logs panel and file-based logging (`msched.log` with rotation)
