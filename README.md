# straum-io.github.io

The Straum website is being rebuilt from scratch, together with Straum
itself. Until then it serves one page, `src/pages/index.astro`, saying so.
The rest of the repository is the build and deploy setup the new site will
use:

- `.github/`: the build and GitHub Pages deploy (`site.yml`), the paused
  drift check against straum (`core-drift.yml`), the PR body check
  (`pr-contract.yml`), the Issue and PR templates.
- `package.json`, `package-lock.json`, `astro.config.mjs`: Astro.
  Starlight stays installed but is not configured while the site is one
  page.

While there is no `src/`, CI skips the build and deploys nothing.

The previous content is kept under the tag
[`archive/main-2026-10-23`](https://github.com/straum-io/straum-io.github.io/tree/archive/main-2026-10-23).

Apache License 2.0.
