---
title: Limitations
description: What Straum does not do yet. Straum is experimental and not production-ready.
sidebar:
  order: 1
---

Straum is experimental and **not production-ready**. This page lists what
it does not do, so you can decide before you rely on it.

## Security

- **TLS and credentials only when configured.** Client TLS, a password
  file, topic rules and node TLS are all off by default. See
  [Configuration](../../reference/configuration/).
- **Metrics are plain HTTP** without credentials, on loopback unless
  `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1`.
- **Loopback by default.** An address beyond loopback needs TLS (client
  TLS with a password file for MQTT, node TLS for links) or
  `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1`, which is a statement about
  your network, not a security mechanism. Use it only on a private,
  trusted network.
- **No certificate revocation** for node TLS. Removing a node means a new
  CA for the others.
- **No enhanced authentication** (MQTT 5 AUTH).

## Protocol

- QoS 2 is refused.
- Persistent sessions, wills and session expiry are refused.
- Message expiry is accepted and forwarded but not enforced.
- One live session per client id is enforced per node, not across the
  cluster.
- Shared subscriptions and subscription identifiers are refused.
- No WebSocket transport.

## Cluster

- **At least three nodes.** There is no single-node mode, and the voter
  count must be odd.
- **Static membership.** The peers are fixed at startup; there is no way
  to add or remove a node from a running cluster.
- **Peers are IP addresses.** Host names are not resolved.
- **Flow control on replica lag is off.**
- **A replica far behind cannot catch up.** One that falls more than
  `STRAUM_CLUSTER_RETAIN_BYTES` behind needs a state copy, which is not
  built.

## Upgrades

- **Nodes on different wire versions do not link.** A mixed cluster
  commits only while a majority shares one version, so upgrading a
  three-node cluster one node at a time stops commits while the second
  node restarts. There is no documented upgrade or rollback procedure
  yet. Keep this in mind before letting a package manager upgrade nodes.
- **On Kubernetes, Ready does not mean in the cluster.** The probe checks
  the MQTT port; a node out of step with the majority serves no client
  but still reads as Ready.

## Operations

- **Timing defaults are placeholders.** Heartbeat, takeover ticks and log
  retention have not been measured on Linux.
- **No performance figures yet.** See [Benchmarks](../../project/benchmarks/).
- **No administrative API.** A planned handoff is a `SIGUSR1` on the
  node's own host. [straum-console](../../ecosystem/straum-console/) is
  read-only.

If one of these blocks you, use Mosquitto, EMQX, VerneMQ or HiveMQ, and
watch the [issues](https://github.com/straum-io/straum/issues).
