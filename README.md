# Material Scheduler (SketchUp Extension)

Material Scheduler is a SketchUp extension that helps you manage and normalize material metadata at scale with a modern HTML UI. It provides quick editing, code allocation, type/kind management, and CSV export.

## Features
- Quick edit material properties (name, brand, type, notes)
- Apply-only normalization flow to avoid destructive changes
- Code allocation with simple rules engine
- Kind/Type management backed by `types.json`
- CSV export of selected columns
- Lightweight event bus and logging for traceability

## Requirements
- SketchUp 2021 or newer (tested on Windows)
- No external gems required; runs in SketchUp’s embedded Ruby

## Installation
1. Close SketchUp.
2. Copy this folder `material_scheduler` to your SketchUp Plugins directory. Typical locations:
   - Windows: `C:\\Users\\<USER>\\AppData\\Roaming\\SketchUp\\SketchUp 20XX\\SketchUp\\Plugins`
   - macOS: `~/Library/Application Support/SketchUp 20XX/SketchUp/Plugins`
3. Ensure there is a loader file at the Plugins root named `material_scheduler.rb` with the following content:

   ```ruby
   require 'sketchup.rb'
   require 'extensions.rb'

   module MSched
     VERSION = '0.4.0' unless defined?(MSched::VERSION)
   end

   ext = SketchupExtension.new('Material Scheduler', 'material_scheduler/init')
   ext.version     = MSched::VERSION
   ext.creator     = 'Material Scheduler'
   ext.description = 'Material Scheduler v0.4.x – Quick Edit, apply-only normalization, reservations, modern UI.'
   Sketchup.register_extension(ext, true)
   ```

   If you already have this file from a previous install, you can keep it. The loader simply points SketchUp to `material_scheduler/init` inside this folder.

4. Start SketchUp, then open the extension from: `Extensions → Material Scheduler`.

## Usage
- Open the dialog via `Extensions → Material Scheduler`.
- Select a material in your model to view and edit its metadata.
- Use Quick Apply for fast updates and apply-only normalization.
- Manage types/kinds; saved to `types.json` (backups like `types_YYYYMMDD-*.bak.json` are created).
- Export current data to CSV from the UI.

## Project Structure
- `init.rb` — extension bootstrap (requires core and features, starts services)
- `core/` — dialog bridge (RPC), logging, event bus, metadata store, sync, undo
- `features/` — kinds store, reservations, rules engine, code allocator, CSV exporter
- `ui/` — HTML/JS/CSS for the dialog
- `types.json` — type/kind definitions saved by the UI

## Packaging to RBZ (optional)
To distribute as an `.rbz`, zip the following at the top level:
- `material_scheduler.rb` (loader file)
- `material_scheduler/` (this folder’s contents)

Then rename the zip to `material_scheduler.rbz` and install via `SketchUp → Window → Extension Manager → Install Extension...`.

## License
This project is licensed under the MIT License. See `LICENSE` for details.

## Credits
Built by/for `@nyo95`. Feedback and contributions are welcome.
