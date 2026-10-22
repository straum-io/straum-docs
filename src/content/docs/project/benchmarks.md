---
title: Benchmarks
description: How Straum's performance is measured, and why no figures are published yet.
sidebar:
  order: 2
---

Performance figures are not published yet. Straum quotes numbers only
from runs on bare-metal Linux with a recorded host, workload, noise
floor and raw data, and none is published yet. A figure from macOS or
Docker is preliminary and is not quoted here.

## What gets measured

| Benchmark | What it covers |
|---|---|
| `server/benches/puback.rs` | MQTT publish to PUBACK through three real server processes, with the servers' CPU time per PUBACK |
| `node/benches/cap.rs` | Records per second and commit latency (p50, p95, p99) inside the cluster, with no MQTT on the path, plus peak RSS and recovery time after a node stops |
| `storage/benches/` | The write-ahead log: record encoding, the commit cycle, scanning |

The `puback` run can also sample every node's positions to report apply
lag, how long a restarted node takes to serve again, and the effect of
clients connecting and disconnecting.

## How it is measured

- **Linux only**, on bare metal. The host, its kernel and its disks are
  recorded with every run.
- **Noise first.** The same tree is run against itself to find the noise
  floor; a difference smaller than that is not a result.
- **Alternating rounds.** Baseline and candidate alternate, and medians
  are compared, not best runs.
- **Separate levels.** A fast micro benchmark proves nothing about the
  network path, so every number names the level it comes from.
- **Each figure with its workload.** No "faster" without the workload,
  the host and the measurement.

## Reproduce it

On a Linux host, from a checkout of the broker:

```sh
scripts/linux-host.sh quick   # or: full
```

It runs the tests, the simulation sweeps and the benchmarks, and packs
every output into `target/linux-host/straum-linux-<time>.tar.gz`.

When the first accepted run exists, its numbers, host and raw data will
be published on this page.
