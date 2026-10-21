// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// GitHub Pages at the account root (ECO-D-13, amended). Sitemap and canonical URLs use it.
const site = 'https://straum-io.github.io';


export default defineConfig({
	site,
	integrations: [
		starlight({
			title: 'Straum',
			description: 'Straum is a clustered MQTT broker in Rust that acknowledges a publish only after a majority of its nodes has committed it.',
			logo: { src: './src/assets/mark.svg', alt: 'Straum' },
			favicon: '/favicon.svg',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/straum-io/straum' }],
			editLink: { baseUrl: 'https://github.com/straum-io/straum-io.github.io/edit/main/' },
			customCss: ['./src/styles/tokens.css', './src/styles/starlight.css'],
			head: [
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
				{ tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800&family=JetBrains+Mono:wght@400;600&display=swap' } },
			],
			sidebar: [
				{ label: 'Start here', items: [{ autogenerate: { directory: 'start' } }] },
				{ label: 'Concepts', items: [{ autogenerate: { directory: 'concepts' } }] },
				{ label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] },
				{ label: 'Ecosystem', items: [{ autogenerate: { directory: 'ecosystem' } }] },
				{ label: 'Project', items: [{ autogenerate: { directory: 'project' } }] },
			],
		}),
	],
});
