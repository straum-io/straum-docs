---
title: straum-cli
description: straum-cli publishes, subscribes and shows every Straum node's state from one Go binary, with exit codes that tell committed from unknown.
sidebar:
  order: 1
---

[straum-cli](https://github.com/straum-io/straum-cli) is a terminal
client for Straum: publish, subscribe and see what each node reports,
from one binary. It is experimental, like the broker.

Any MQTT client can publish to Straum, but none tells you what a PUBACK
from Straum means or what state each node is in. straum-cli knows the
broker's contract: `pub` with QoS 1, the default, succeeds only on a
PUBACK, and `status` reads
only the metrics the broker declares stable.

## Install

```sh
go install github.com/straum-io/straum-cli@latest   # Go 1.26 or newer
```

From a checkout, `make build` writes `bin/straum-cli`, and `make cross`
builds Linux, macOS and Windows on amd64 and arm64. No release is
published yet.

## Commands

```sh
straum-cli status --node 127.0.0.1:9100,127.0.0.1:9101,127.0.0.1:9102
straum-cli pub --broker 127.0.0.1:1883 -t sensors/a -m 21.5          # QoS 1
straum-cli pub --broker 127.0.0.1:1883 -t sensors/a -m 21.5 -r       # retained
echo hello | straum-cli pub --broker 127.0.0.1:1883 -t greet --stdin
straum-cli sub --broker 127.0.0.1:1883 -t 'sensors/+' -t 'logs/#' -v
straum-cli sub --broker 127.0.0.1:1883 -t sensors/a -c 1 --wait 5s -o json
```

- **`status`** asks every node's metrics endpoint once, concurrently,
  and shows commit, applied and log positions, lag and outbox per node.
  A node that does not answer is `unknown`. The CLI never calls a
  cluster healthy.
- **`pub` and `sub`** speak MQTT 5: QoS 0 and 1, retained messages,
  wildcards, `--no-local`, `--retain-as-published`,
  `--retain-handling`. Sessions are always clean.
- **`-o json`** writes a versioned document; diagnostics go to stderr.

`STRAUM_CLI_BROKER` and `STRAUM_CLI_NODES` save you the flags. There is
no default cluster: with neither flag nor variable, the command fails.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Done: every node observed, the message published, or `sub` finished |
| 1 | Usage or configuration error |
| 2 | `status`: some nodes unknown. `sub`: `--wait` passed before `--count` messages arrived |
| 3 | `status`: every node unknown |
| 4 | `pub`/`sub`: refused by the node, or the connection failed before anything took effect |
| 5 | `pub`: sent, outcome unknown. The message may or may not be committed; publishing again can deliver it twice |

## Go package

`github.com/straum-io/straum-cli/metrics` gives other Go programs the
same status read:

```go
c := metrics.Client{Timeout: 2 * time.Second}
r, err := c.Collect(ctx, []string{"127.0.0.1:9100", "127.0.0.1:9101"})
if err != nil { /* a bad address or a negative timeout; nothing was sent */ }
for _, n := range r.Nodes {
	if n.State == metrics.Unknown {
		continue
	}
	fmt.Println(n.Address, n.Metrics["straum_commit"])
}
```

Before 1.0 the package's API may change in a minor version.

## More

The full command reference, the JSON schema and the release process are
in the [straum-cli docs](https://github.com/straum-io/straum-cli/tree/main/docs).
