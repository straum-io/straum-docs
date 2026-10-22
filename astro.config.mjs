// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages at the account root (ECO-D-13, amended). Sitemap and canonical URLs use it.
// While the site is rebuilt it is one page (src/pages/index.astro); the
// Starlight setup is under the tag archive/main-2026-10-23.
export default defineConfig({
	site: 'https://straum-io.github.io',
});
