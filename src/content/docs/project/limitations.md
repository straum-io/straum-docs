---
title: Limitations
description: What Straum does not do yet, so you know what to expect from an experimental broker.
sidebar:
  order: 1
---

Straum is young and experimental: ready to try, test and build against,
not yet for production. Today it has majority commit, failover
and handoff, MQTT 3.1.1 and 5 with QoS 0 and 1, retained messages, TLS
and access control. This page lists what is not there yet, so you know
what to expect.

## Security

TLS for clients and between nodes, credentials and topic rules work.
They are off by default ([Configuration](../../reference/configuration/)).
What they do not cover:

- **No client certificate authentication.** Clients authenticate with a
  user name and password; the server does not ask for a client
  certificate.
- **Metrics are plain HTTP** without credentials, on loopback unless
  `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1`.
- **Loopback by default.** An address beyond loopback needs TLS (for
  MQTT: client TLS, a password file and anonymous clients refused; for
  links: node TLS) or
  `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1`, which is a statement about
  your network, not a security mechanism. Use it only on a private,
  trusted network.
- **No certificate revocation** for node TLS. Removing a node means
  giving the others files of a new CA, or new certificates from a CA that
  never signed the removed node, then `SIGHUP`.
- **An expired peer certificate keeps its link** until the next `SIGHUP`
  checks it again.
- **Handshake floods on the link port** can keep links from forming. That
  costs availability, not safety; shield the port with a firewall.
- **No enhanced authentication** (MQTT 5 AUTH).
- **No independent security review** of the TLS and credential code yet.

## Protocol

- QoS 2 is not supported yet.
- Persistent sessions, wills and session expiry are not supported yet;
  connect with a clean session.
- Message expiry is accepted and forwarded but not enforced.
- One live session per client id is enforced per node, not across the
  cluster.
- Shared subscriptions and subscription identifiers are not supported yet.
- No WebSocket transport.

## Cluster

- **At least three nodes.** A cluster starts at three (they can share
  one machine), and the voter count is odd.
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

- **Timing defaults are starting values.** Heartbeat, takeover ticks and
  log retention have not been tuned on Linux yet.
- **No performance figures yet.** See [Benchmarks](../../project/benchmarks/).
- **No administrative API.** A planned handoff is a `SIGUSR1` on the
  node's own host. [straum-console](../../ecosystem/straum-console/) is
  read-only.

If one of these blocks you, tell us in an
[Issue](https://github.com/straum-io/straum/issues): it helps decide what
comes next. For production today, Mosquitto, EMQX, VerneMQ and HiveMQ are
mature options.
