# viscosity_mdt

**A tablet MDT for FiveM** — a clean, violet-glass tablet NUI opened with `/mdt`. It
surfaces character info, DMV records, and settings today, with police/PD modules built
on the same shell. Runs on [viscosity_core](https://github.com/AndyBodnar/viscosity_core).

---

## Features

- **Tablet shell** — animated open/close, sidebar navigation, Viscosity violet theme.
- **Character** — identity and record lookup pulled from the core.
- **DMV** — license/registration records.
- **Settings** — per-user tablet preferences.
- **Extensible** — apps are panels in one shell, so adding PD/EMS/records modules is
  drop-in.

---

## Requirements

- [viscosity_core](https://github.com/AndyBodnar/viscosity_core)

## Installation

1. Drop `viscosity_mdt` into `resources`.
2. Ensure it **after** the core:
   ```cfg
   ensure viscosity_core
   ensure viscosity_mdt
   ```
3. Open in-game with `/mdt`.

---

© Viscosity. Built and maintained by Viscosity Gaming Studio.

## License

Copyright (c) 2026 **AndyBodnar (Viscosity)**. All rights reserved. See [LICENSE](LICENSE).

Run it on your own server and modify it however you like. Do **not** resell it, repackage it, re-upload it as your own, or strip the credits. Public use must credit AndyBodnar (Viscosity). This is my work — I'm sharing it, not giving it away.
