// Keeps the contract pages in step with straum docs/configuration.md at a
// pinned revision (ECO-D-14): generates the reason-code block and the
// revision lines, and fails when a stable setting or metric is missing from
// the site or the site names a metric the broker does not declare stable.
// STRAUM_CONFIGURATION=<path> reads a local file instead of fetching.
import { readFileSync, writeFileSync } from 'node:fs';

const PIN = '50224fe29a3eef81e659365a56dd7962c9d3979a';
const DOCS = new URL('../src/content/docs/reference/', import.meta.url);
const page = (name) => new URL(name, DOCS);

const source = process.env.STRAUM_CONFIGURATION
	? readFileSync(process.env.STRAUM_CONFIGURATION, 'utf8')
	: await fetch(`https://raw.githubusercontent.com/straum-io/straum/${PIN}/docs/configuration.md`).then((r) => {
			if (!r.ok) throw new Error(`fetching straum docs/configuration.md at ${PIN}: HTTP ${r.status}`);
			return r.text();
		});

function block(name) {
	const m = source.match(new RegExp(`<!-- ${name}:begin -->\\s*\`\`\`text\\n([\\s\\S]*?)\`\`\`\\s*<!-- ${name}:end -->`));
	if (!m) throw new Error(`straum docs/configuration.md has no ${name} block`);
	return m[1].split('\n').map((l) => l.trim()).filter(Boolean);
}

const errors = [];
const named = (text) => new Set([...text.matchAll(/`([A-Za-z_][A-Za-z0-9_]*)`/g)].map((m) => m[1]));

function update(file, edit) {
	const before = readFileSync(page(file), 'utf8');
	const after = edit(before).replace(/revision `[0-9a-f]{7}`/g, `revision \`${PIN.slice(0, 7)}\``);
	if (after !== before) writeFileSync(page(file), after);
	return after;
}

function requireNames(file, text, names, what) {
	const onPage = named(text);
	for (const n of names) if (!onPage.has(n)) errors.push(`${file}: stable ${what} \`${n}\` is not documented`);
}

const settings = update('configuration.md', (t) => t);
requireNames('configuration.md', settings, block('stable-settings'), 'setting');

const metrics = update('metrics.md', (t) => t);
const stableMetrics = block('stable-metrics');
requireNames('metrics.md', metrics, stableMetrics, 'metric');
for (const n of named(metrics)) {
	if (n.startsWith('straum_') && !stableMetrics.includes(n)) errors.push(`metrics.md: \`${n}\` is not a stable metric`);
}

update('mqtt-support.md', (t) => {
	const marker = /(<!-- stable-reasons:begin -->\n)[\s\S]*?(<!-- stable-reasons:end -->)/;
	if (!marker.test(t)) errors.push('mqtt-support.md: no stable-reasons markers');
	return t.replace(marker, (_, open, close) => `${open}\`\`\`text\n${block('stable-reasons').join('\n')}\n\`\`\`\n${close}`);
});

if (errors.length) {
	console.error(errors.join('\n'));
	process.exit(1);
}
console.log(`contracts: in step with straum ${PIN.slice(0, 7)}`);
