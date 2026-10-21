#!/bin/sh
# Compares straum's docs/configuration.md and README status lines at main
# with the revision scripts/contracts.mjs pins, and opens, updates or closes
# the one core-drift Issue. Needs gh (GH_TOKEN) and node.
set -eu
pin=$(sed -n "s/^const PIN = '\([0-9a-f]*\)';/\1/p" scripts/contracts.mjs)
main=$(gh api repos/straum-io/straum/commits/main --jq .sha)
raw=https://raw.githubusercontent.com/straum-io/straum
tmp=$(mktemp -d)
for rev in "$pin" "$main"; do
	mkdir -p "$tmp/$rev"
	curl -fsSL "$raw/$rev/docs/configuration.md" -o "$tmp/$rev/configuration.md"
	curl -fsSL "$raw/$rev/README.md" | grep '^>' > "$tmp/$rev/status" || true
done
moved=""
cmp -s "$tmp/$pin/configuration.md" "$tmp/$main/configuration.md" || moved="$moved docs/configuration.md"
cmp -s "$tmp/$pin/status" "$tmp/$main/status" || moved="$moved README-status"
open=$(gh issue list --label core-drift --state open --json number --jq '.[0].number // empty')

if [ -z "$moved" ]; then
	echo "in step with straum ${main%"${main#???????}"}"
	[ -n "$open" ] && gh issue close "$open" -c "The pin is in step with straum main (${main%"${main#???????}"})."
	exit 0
fi

check=$(STRAUM_CONFIGURATION="$tmp/$main/configuration.md" node scripts/contracts.mjs 2>&1 || true)
pages=$(git diff --stat -- src/content/docs || true)
body=$(cat <<MD
straum \`main\` has moved past the revision the site pins.

- Pinned: \`${pin%"${pin#???????}"}\`, main: \`${main%"${main#???????}"}\`
- Changed:$(for f in $moved; do printf ' `%s`' "$f"; done)
- Diff: https://github.com/straum-io/straum/compare/$pin...$main

Contract check against main:

\`\`\`text
$check
${pages:-generated pages unchanged}
\`\`\`

To catch up: move \`PIN\` in \`scripts/contracts.mjs\` to main, run \`npm run check\`, and reread every page the diff touches, the security and limitations text included, not only the names the check lists.
MD
)
if [ -n "$open" ]; then
	gh issue edit "$open" --body "$body" >/dev/null
	echo "updated #$open"
else
	gh label create core-drift --color B60205 --description "The site is behind straum main" --force >/dev/null
	gh issue create --label core-drift --title "The site is behind straum main" --body "$body"
fi
