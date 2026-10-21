---
title: Configuration
description: Every STRAUM_* environment variable the Straum server reads, its default, and the limits fixed in the current build.
sidebar:
  order: 1
---

All configuration comes from `STRAUM_*` environment variables. There is
no config file.

## Rules

- An unknown `STRAUM_*` variable is a startup error. A typo never falls
  back to a default.
- A malformed or out-of-range value is a startup error.
- Units are in the name: `_BYTES`, `_MS`. Switches are `0` or `1`.
- The effective configuration is logged once at `info`, each value with
  its source: `env` or `default`.

Defaults are starting values. None is measured on Linux yet.

## Variables

| Variable | Default | Notes |
|---|---|---|
| `STRAUM_EXPERIMENTAL_CLUSTER` | unset | Must be `1`: you acknowledge the server is experimental. Anything else is refused. |
| `STRAUM_CLUSTER_NODE_ID` | required | This node's id, 0–255. |
| `STRAUM_CLUSTER_PEERS` | required | Every voter, this node included: `id=address,…` as socket addresses. Odd, at least three, no id twice. |
| `STRAUM_CLUSTER_LISTEN` | this node's address in the peers | Where its links to other nodes listen. |
| `STRAUM_CLUSTER_MQTT_LISTEN` | `127.0.0.1:1883` | Where MQTT clients connect. |
| `STRAUM_CLUSTER_METRICS_LISTEN` | off | Plain-HTTP Prometheus text. At most 4 scrapes at once, each read and write bounded by 2 s. A diagnostic interface, not a monitoring system. |
| `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK` | `0` | `1` lets every listener and peer use addresses beyond loopback, unauthenticated and unencrypted. Without it such an address is refused at startup. |
| `STRAUM_CLUSTER_DATA_DIR` | required | The log, snapshots, and a file pinning the directory to its cluster's configuration. |
| `STRAUM_CLUSTER_HEARTBEAT_MS` | `50` | 1–10 000. A placeholder, not a recommendation. |
| `STRAUM_CLUSTER_TAKEOVER_TICKS` | `3` | Heartbeats of silence before a takeover, 1–1 000. A placeholder. |
| `STRAUM_CLUSTER_RETAIN_BYTES` | `67108864` | How much log is kept behind a slow replica (64 MiB). |
| `STRAUM_READ_BYTES` | `65536` | One catch-up or fetch read. At most 4 MiB. |
| `STRAUM_LOG_LEVEL` | `info` | |
| `STRAUM_WORKER_THREADS` | `auto` | The number of CPUs. |

`STRAUM_AUTH_*` and `STRAUM_TLS_*` are refused: authentication and TLS
are not wired in yet.

## Fixed limits

Not settings in the current build. Every node of a cluster must agree on
the voters, the heartbeat, the records past the commit point, the
replication window, the batch, the link frame and the per-session and
retained limits: they go into the configuration digest each link checks,
and a link from a node that differs is refused.

| Limit | Value |
|---|---|
| MQTT packet size | 256 KiB |
| Link frame | 8 MiB |
| Topic length, levels | 1 024 bytes, 32 levels |
| Client id | 256 bytes |
| Filters per SUBSCRIBE | 64 |
| User properties per packet | 32 |
| Records past the commit point | 64 |
| Batch | 16 records |
| Replication window | 256 |
| Snapshot | every 4 096 applied records |
| Log segment | 64 MiB |
| Proposal queue at the sequencer | 1 024, shared as 341 per node with three voters |
| Subscriptions per session, total | 1 024, 1 000 000 |
| Retained messages | 10 000, 64 MiB of payload |
| Unacknowledged QoS 1 deliveries per session | 256 |
| Backlog per session | 16 384 messages, 8 MiB |
| Queued payload, all sessions | 1 GiB |

## Signals

| Signal | Effect |
|---|---|
| `SIGUSR1` | Hand this node's slot over to the next owner (a planned handoff). |
| `SIGTERM`, Ctrl-C | Stop, exit code 0. |

A node that stops by itself (its log fails, a committed record does not
apply, a panic) logs why and exits non-zero, so a supervisor restarts it.

## Stable names

Clients outside the cluster may rely on the variable names above, the
[stable metrics](../../reference/metrics/), and the MQTT reason codes listed
in [MQTT support](../../reference/mqtt-support/#reason-codes). The
authoritative lists are in the broker's
[docs/configuration.md](https://github.com/straum-io/straum/blob/main/docs/configuration.md), each pinned by a test there.
These pages copy them at revision `4febc1c`.
