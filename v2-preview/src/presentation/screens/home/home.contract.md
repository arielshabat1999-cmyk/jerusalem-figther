# Home migration contract

The existing AppShell remains Home owner during incremental migration. New components must preserve existing `data-action` navigation contracts and authoritative state sources. Components are migrated one at a time; no duplicate permanent Home implementation is allowed.
