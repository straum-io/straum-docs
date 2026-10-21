---
title: Architecture
description: How a Straum cluster orders every MQTT publish in one replicated log, commits it on a majority, and hands the sequencer role over.
sidebar:
  order: 1
---

A Straum cluster is one mechanism, not a set of nodes that happen to talk
to each other. Everything a client can observe follows from one
replicated log.

This page is a reader's summary built from the
[broker's README](https://github.com/straum-io/straum#readme), its
[configuration reference](https://github.com/straum-io/straum/blob/main/docs/configuration.md)
and its code. When they disagree, the code wins.

## Principles

- **One log decides.** A PUBACK, a delivery, a retained message, a change
  of sequencer: each is the result of applying a committed record. No
  node changes shared state any other way.
- **Nodes are deterministic.** A node is a function of the committed log
  and its input events. Two nodes with the same log prefix hold the same
  state.
- **Predictable over fast.** Who takes over next is known in advance,
  handing the sequencer role over is routine, and each failure has one
  defined reaction.
- **Clocks don't decide.** Timeouts only start a transition; the log and
  the majority decide how it ends.
- **Proof before claims.** Correctness is shown by deterministic
  simulation, performance only by measurements on Linux.

## Roles: gateway and sequencer

Every node is a **gateway**: it accepts MQTT connections, keeps their
sessions and delivers to its own subscribers. In each slot exactly one
node is also the **sequencer**: it orders records into the log and
replicates them to the others.

```text
client ──PUBLISH──▶ gateway (any node)
                        │ forward
                        ▼
                    sequencer ──append──▶ log on node 0
                        │       ──replicate──▶ log on node 1
                        │       ──replicate──▶ log on node 2
                        ▼
              majority durable = committed
                        │
client ◀──PUBACK─── gateway applies the committed record
```

A client can connect to any node. Its gateway forwards the publish to the
current sequencer and sends the PUBACK when it sees the record committed.
Subscribers on every node get the message when their node applies that
record.

## Slots, records and fencing

Ownership of the log is divided into slots, and the owner of each slot
comes from a schedule every node knows. Each record carries
`(slot, lsn, prev_hash)`: a log position that only grows, and a hash
chained over each batch. A replica accepts records only from the owner
of the current slot and only when the chain matches, so two sequencers
cannot both extend the log.

## Commit

A record is committed once a majority of nodes holds it durably: two of
three, three of five. Commit is a prefix: everything before a committed
position is committed too. PUBACK and delivery happen only after commit,
so nothing a client saw is ever rolled back.

## Changing the sequencer

- **Planned handoff.** The sequencer writes a `SlotEnd` record, which
  commits like any other. The next owner sees it committed, writes
  `SlotStart` and continues. No election round. An operator asks for
  this with `SIGUSR1`.
- **Takeover.** When the sequencer goes silent for
  `STRAUM_CLUSTER_TAKEOVER_TICKS` heartbeats, the next node in the
  schedule asks a majority to promise not to accept older slots, collects
  their log tails, catches up from the longest and starts the next slot.
  If that node is down too, the one after it does the same.

Under the hood this is a variant of Viewstamped Replication and
Multi-Paxos with a deterministic owner per slot, plus the leader-schedule
idea from Solana. It is not a new consensus algorithm, and consensus only
comes in when an owner fails.

## Crates

The broker is a Cargo workspace. The protocol logic is sans-IO: it never
reads a socket or a clock, which is what lets the simulation drive it.

| Crate | Role |
|---|---|
| `codec` | MQTT 3.1.1 and 5 over one packet model, with properties and reason codes |
| `journal` | The log record format: `(slot, lsn, prev_hash)`, properties, batch header |
| `cluster` | Sans-IO sequencer and replica: slot owner, star replication, majority commit |
| `gateway` | Sans-IO MQTT gateway: packets in, proposals to the log, committed effects out |
| `apply` | State derived only from committed records |
| `storage` | Segmented write-ahead log with group commit |
| `transport` | TCP and TLS listeners, node certificates, connection lifecycle |
| `node` | The runtime driver: links, sequencer or replica, log on disk, apply |
| `sim` | Deterministic simulation of the whole cluster path |
| `server` | The `straum-server` binary and its configuration |
| `auth` | Password file and topic rules, checked at CONNECT, SUBSCRIBE and PUBLISH |
| `domain` | Shared types and pure logic |

## Testing

Three-node clusters run under a simulated network and disk, with the
safety invariants checked after every step: a committed record is never
lost or moved, at most one sequencer per slot commits, committed prefixes
match on every node, and PUBACK and delivery never precede commit. Real
three-node tests run next to them on loopback.
