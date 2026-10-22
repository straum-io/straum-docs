---
title: Guarantees
description: What a Straum PUBACK means, how memory stays bounded, and how each failure is handled.
sidebar:
  order: 2
---

## What a PUBACK means

A QoS 1 PUBACK from Straum means the message is in the committed log: a
majority of nodes holds it durably. With three nodes, any one can die
and every acknowledged message survives.

A QoS 0 publish is written to the connection and nothing confirms it.
QoS 2 is not supported yet.

If the connection breaks before the PUBACK arrives, the outcome is
unknown: the message may or may not be committed, and publishing it
again can deliver it twice. That is ordinary at-least-once behavior;
[straum-cli](../../ecosystem/straum-cli/) reports this case with its own exit
code.

## Memory stays bounded

Every queue and buffer has a limit and a stated behavior when it is
full, so a slow client cannot grow the broker without bound. Some of
them:

| Bound | Default | When full |
|---|---|---|
| MQTT packet | 256 KiB | Refused |
| Unacknowledged QoS 1 deliveries per session | 256 | Further deliveries wait in the backlog |
| Backlog per session | 16 384 messages, 8 MiB | QoS 0 dropped; QoS 1 closes the session as a slow consumer |
| Queued payload, all sessions | 1 GiB | Backlog, then a slow-consumer close |
| Subscriptions per session | 1 024 | SUBACK failure (Quota exceeded) |
| Retained messages | 10 000, 64 MiB | Delivered, not kept |
| Own proposals awaiting commit, per node | 341 with three nodes | The node stops reading its MQTT clients |

The full list is in [Configuration](../../reference/configuration/#fixed-limits).

## Configuration fails at startup

An unknown `STRAUM_*` variable, a malformed value or a value out of range
stops the server before it opens anything. Nothing falls back to a
default silently. The effective configuration is logged once, each
value with its source.

Every node of a cluster must agree on the voters, the timing, the
replication window and batch, and the per-session and retained limits.
They go into a configuration digest each link checks, so a node
configured differently is refused. A data directory is pinned to
its cluster's digest, so a node started over another cluster's data is
refused too.

## Failure behavior

| Event | What happens |
|---|---|
| A replica dies | The sequencer keeps committing with the remaining majority. |
| The sequencer dies | After `STRAUM_CLUSTER_TAKEOVER_TICKS` heartbeats of silence, the next node in the schedule takes the slot over. |
| A majority is lost | Nothing commits, so nothing is acknowledged. |
| A node's log fails, or a committed record does not apply | The node logs why and exits non-zero, so a supervisor restarts it. |
| A replica falls far behind | The log keeps up to `STRAUM_CLUSTER_RETAIN_BYTES` for it. A replica further behind cannot catch up yet: that needs a state copy, which is not built. |
| `SIGTERM` or Ctrl-C | The node stops with exit code 0. |

## What the metrics tell you

Each value is one node's view at the moment it was read, not the
cluster's and not a health verdict. See [Metrics](../../reference/metrics/).
