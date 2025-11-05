# CATATAN_DEV

- Entry:
  - material_scheduler.rb registers the SketchUp extension and loads material_scheduler/init.rb.
  - material_scheduler/init.rb wires core + features, starts selection SyncService, and exposes DialogRPC.

- RPC bridge (core/dialog_rpc.rb):
  - get_full → sends entries, kinds map, reservations map
  - quick_apply → apply-only changes; number override allowed; slips over used/reserved; wrapped in Undo
  - 
ormalize_all → bulk normalize respecting locked/hidden and reservations
  - set_flags → set locked/sample/hidden flags; locked blocks other edits
  - delete_material → safe delete (denies when locked)
  - kinds_save → persists prefix→label to material_scheduler/types.json and mirrors to model attributes
  - eservations_save / eservations_import_json / eservations_export_json
  - export_csv → returns CSV; UI triggers download

- Events (core/event_bus.rb):
  - :data_changed → pushes full state to UI
  - :selected_material_info → updates Quick Edit form

- Selection Sync (core/sync_service.rb):
  - Debounced 250ms; scans selection for first entity with material; publishes summary

- Data (core/metadata_store.rb):
  - Attribute dictionary namespace: material_scheduler
  - Per-material key: mat_<persistent_id>; value is a Hash storing code, 	ype, rand, 
otes, flags
  - entries builds rows for all materials, joining kinds prefix→label

- Kinds (eatures/kinds_store.rb):
  - File: material_scheduler/types.json (map prefix→label)
  - Backward-compatible: accepts legacy array [{type,prefix}] and converts
  - Mirrors to model attribute kinds

- Reservations (eatures/code_allocator.rb + eatures/reservations_store.rb):
  - eserved_numbers(prefix) reads map[prefix] entries; accepts either PREFIX-N or numbers; allocator canonicalizes
  - 
ext_free_from skips used + reserved

- UI (HtmlDialog static assets under material_scheduler/ui):
  - Tabs: Quick Edit / Scheduler / Kinds / Reservations / Samples / Hidden
  - ui/js/app.js orchestrates RPC, status bar, tab renders

- Notes:
  - No auto-normalization while typing; all mutations go through Quick Apply or Normalize All
  - No external HTTP dependencies; vanilla Ruby & JS only
