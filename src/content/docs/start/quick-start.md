---
title: Quick start
description: Build Straum from source and run a three-node MQTT cluster on one machine.
sidebar:
  order: 2
---

You need Rust 1.85 or newer and a checkout of
[straum-io/straum](https://github.com/straum-io/straum).

## Build

```sh
git clone https://github.com/straum-io/straum.git
cd straum
cargo build --release -p server --bin straum-server
```

## Start three nodes

There is no single-node mode. Three nodes on loopback:

```sh
export STRAUM_EXPERIMENTAL_CLUSTER=1
export STRAUM_CLUSTER_PEERS=0=127.0.0.1:7000,1=127.0.0.1:7001,2=127.0.0.1:7002
for i in 0 1 2; do
  STRAUM_CLUSTER_NODE_ID=$i \
  STRAUM_CLUSTER_DATA_DIR=/tmp/straum/n$i \
  STRAUM_CLUSTER_MQTT_LISTEN=127.0.0.1:188$((3 + i)) \
  STRAUM_CLUSTER_METRICS_LISTEN=127.0.0.1:910$i \
  target/release/straum-server &
done
```

`STRAUM_EXPERIMENTAL_CLUSTER=1` is required: without it the server
refuses to start. Each node serves MQTT on `1883`, `1884` and `1885`,
and metrics on `9100`, `9101` and `9102`.

## Publish and subscribe

Wait until every node serves clients: `straum-cli status` (below) shows
`SERVING 1` for each. Until then a node refuses CONNECT with
`ServerUnavailable`.

Any MQTT client works. With [straum-cli](../../ecosystem/straum-cli/),
subscribe on one node and publish to another:

```sh
straum-cli sub --broker 127.0.0.1:1884 -t 'sensors/+' -v &
straum-cli pub --broker 127.0.0.1:1883 -t sensors/a -m 21.5
# sensors/a 21.5
```

`pub` exits 0 only on a PUBACK, which the cluster sends after a majority
has committed the message.

## Look at the cluster

```sh
straum-cli status --node 127.0.0.1:9100,127.0.0.1:9101,127.0.0.1:9102
```

One row per node: its slot, whether it leads, commit and applied
positions, lag and outbox. A node that does not answer shows as
`unknown`.

## Try a failure

Kill the node that leads (`LEADING 1` in `status`) and publish again to
another node. A surviving node takes the sequencer role over and the
publish is acknowledged by the two that remain. A publish caught in the
takeover can end with exit code 5, "sent, outcome unknown": it may or
may not be committed. To hand the role over
on purpose instead, send `SIGUSR1` to the leading node's process.

## When something goes wrong

| Symptom | Cause |
|---|---|
| The server exits at startup naming a variable | An unknown `STRAUM_*` variable or a value out of range. Nothing falls back to a default. |
| The server refuses a non-loopback address | Every listener and peer stays on loopback unless `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1`. |
| A node refuses a peer's link | The nodes disagree on peers, timing or limits: these go into a configuration digest each link checks. |
| A node refuses its data directory | The directory belongs to another cluster's configuration. Use a fresh one. |
| A CONNECT is refused | Persistent sessions, wills and session expiry are not supported yet. Connect with a clean session. |

Next: [install with Docker, Debian packages or Kubernetes](../../start/install/).
