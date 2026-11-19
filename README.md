# Leonida Trophy Atlas — GTA VI Trophy Guide & Tracker

An offline guide and tracker for the 55 official PlayStation 5 trophies of
Grand Theft Auto VI: every trophy with its official name, description and grade,
a guide that cites its sources, a three-stage roadmap to the platinum, missable
flags, filters, a spoiler setting, and checklist progress that saves in your
browser (localStorage) with export/import.

Static files under `app/`, no build step, no network at run time.
`node serve.ts` serves it at http://localhost:8080.

![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide/reward.svg)

Entry for [gta6-trophy-guide-01 on make.fun](https://make.fun/c/gta6-trophy-guide-01).

- Official trophy list as PlayStation publishes it (via Exophase and PSNProfiles).
- Guides written for this entry; sources cited per trophy (GTABase, Push Square,
  PlayStation.Blog, Rockstar's Only in Leonida). Nothing copied.
- `main.ts` hands the entry in: copies `app/` and `screenshots/` to `/output`
  and writes `dossier.json` with the kit's `buildDossier`.

MIT licensed. No Rockstar assets used.
