---
title: Metrics
description: The stable Prometheus metrics each Straum node exposes, and what they mean.
sidebar:
  order: 2
---

Set `STRAUM_CLUSTER_METRICS_LISTEN` and each node serves its current
snapshot in the Prometheus text format over plain HTTP. There are no
credentials; the listener stays on loopback unless
`STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1`.

```sh
curl -s http://127.0.0.1:9100/metrics | grep '^straum_'
```

## Stable metrics

These series are a contract. Each is a gauge without labels, one sample
per node, and its name and meaning change only by a recorded decision.
The authoritative list is in the broker's
[docs/configuration.md](https://github.com/straum-io/straum/blob/main/docs/configuration.md#stable-metrics-d-141-a),
where a test fails if the renderer and it disagree. This copy was taken
at revision `50224fe`.

| Metric | Meaning |
|---|---|
| `straum_node` | This node's id |
| `straum_slot` | The highest slot it promised |
| `straum_leading` | 1 while it sequences its slot |
| `straum_serving` | 1 once its gateway takes clients |
| `straum_commit` | The commit point it knows |
| `straum_applied` | The last position applied here |
| `straum_log_end` | Its log's last position |
| `straum_log_durable` | The position its log is durable through |
| `straum_lag` | Positions its log is behind the commit point it heard |
| `straum_outbox_entries` | Its own proposals awaiting commit |
| `straum_outbox_capacity` | The bound on those proposals |

A value is this node's view at the scrape. It is not the cluster's view
and not a health verdict.

## Everything else

The endpoint serves more series: histograms, replica state, takeovers,
MQTT load, catch-up. They are diagnostics and may be renamed or removed
with any change. Scrape them with Prometheus and graph them, but don't
build automation on them.

## From the terminal

[`straum-cli status`](../../ecosystem/straum-cli/) reads the stable set from
every node at once and shows it as a table or JSON.
