---
title: What is Straum
description: Straum is a clustered MQTT broker that sends a PUBACK only after a majority of its nodes has committed the message.
sidebar:
  order: 1
---

Straum is a distributed MQTT broker. A Straum cluster
acknowledges a publish only after a majority of its nodes has committed
it to one replicated log.

:::note[Early and experimental]
Straum is ready to try and test, but not yet for production. TLS, credentials and topic rules work when you turn them on.
Still to come: flow control, published Linux measurements of failover and
performance, tuned timing defaults, and persistent sessions, wills and
session expiry. [Limitations](../../project/limitations/) has the full
list.
:::

## Why it exists

A PUBACK from a single-node broker means one machine has your message.
In Straum it means the message is in the log of a majority of the
cluster, so a three-node cluster keeps every acknowledged message when
one node dies.

## What it does today

| Area | Status |
|---|---|
| MQTT 3.1.1 and MQTT 5 over TCP | Yes |
| QoS 0 and QoS 1 | Yes |
| QoS 2 | Not yet |
| Retained messages | Yes |
| MQTT 5 subscription options (no local, retain as published, retain handling) | Yes |
| Shared subscriptions, subscription identifiers | Not yet |
| PUBACK after majority commit | Yes |
| Failover and planned handoff of the sequencer | Yes |
| Prometheus metrics per node | Yes |
| TLS for clients, credentials, topic rules | Yes, when configured |
| TLS between nodes, with node identity | Yes, when configured |
| Single-node mode | No: a cluster starts at three nodes, which can share one machine |

The full matrix is in [MQTT support](../../reference/mqtt-support/).

## Who it is for

- Telemetry and industrial systems where a lost message costs money:
  metering, billing, SCADA events, audit trails.
- Edge-to-cloud gateways that want a small, predictable binary.
- Teams that need a replicated broker under a permissive license
  without a JVM or BEAM runtime.

Today it suits evaluation, test rigs and anyone who wants to
follow the project or help shape it.

## When goals conflict

This order wins:

1. An acknowledged message is committed.
2. Memory stays bounded.
3. Operations stay predictable: explicit backpressure and failure modes,
   configuration errors at startup.
4. Performance per CPU cycle, measured.
5. Protocol coverage.

## What it is not trying to be

A benchmark winner at the cost of those guarantees, a rule engine or
integration hub, a broker with a management UI built in (that is
[straum-console](../../ecosystem/straum-console/), outside the broker
process), or a server for protocols other than MQTT.

## Compared with others

Straum takes its own road: an MQTT cluster whose behavior follows from
one replicated log. If that is what you want, try it and tell us what
you need in an [Issue](https://github.com/straum-io/straum/issues). For
production today, use Mosquitto on a single node, or a clustered broker
such as EMQX, VerneMQ or HiveMQ.

Next: [run a three-node cluster](../../start/quick-start/).
