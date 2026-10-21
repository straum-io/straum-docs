# straum-docs

The website for [Straum](https://github.com/straum-io/straum): the landing
page and the documentation for the broker,
[straum-cli](https://github.com/straum-io/straum-cli) and
[straum-console](https://github.com/straum-io/straum-console).

Live at https://straum-io.github.io/straum-docs/. Built with
[Astro](https://astro.build) and [Starlight](https://starlight.astro.build):
static HTML, a sitemap and a local search index.

## Run it

You need Node 22.22 or newer.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run check     # build, then check every internal link
```

`npm run build` first runs `scripts/contracts.mjs`. It reads straum
`docs/configuration.md` at the revision pinned in the script, rewrites the
reason-code block in `reference/mqtt-support.md`, and fails if a stable
setting or metric is missing from the reference pages. To follow a new
straum revision, change `PIN` and run the build. Offline, point
`STRAUM_CONFIGURATION` at a local copy of that file.

A push to `main` deploys to GitHub Pages (`.github/workflows/site.yml`).

## Where things are

| Path | What |
|---|---|
| `src/pages/index.astro` | The landing page |
| `src/content/docs/` | The docs, one Markdown file per page; the folder sets the sidebar group |
| `src/styles/tokens.css` | Brand colors and fonts, shared by the landing page and the docs |
| `src/styles/starlight.css` | The tokens mapped onto Starlight's theme |
| `scripts/` | The contract check and the link check |
| `public/` | Favicon, `robots.txt`, `llms.txt` |
| `astro.config.mjs` | Site URL and base path, sidebar, head tags |

## Writing rules

- Every feature, setting and number comes from the broker, CLI or console
  repository at the revision you document. Link to the source when the
  page would otherwise go stale.
- Links between docs pages are relative (`../../start/quick-start/`), so
  they work under the base path.
- Straum is experimental: say so wherever a reader could assume otherwise.
- No performance claim without a published Linux measurement.

Apache License 2.0.
