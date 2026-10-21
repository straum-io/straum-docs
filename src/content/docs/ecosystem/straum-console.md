---
title: straum-console
description: straum-console is the planned web console for Straum clusters. Its read-only API schema is defined; there is no code to run yet.
sidebar:
  order: 2
---

[straum-console](https://github.com/straum-io/straum-console) is the
administrative web console for Straum, frontend and backend in one
product.

:::caution[Not started]
There is no code to run yet. Its read-only API schema is written down;
the application is not.
:::

## What it is for

Operating a cluster means watching every node at once: who sequences the
log, how far each replica lags, which connections are open. Today that
takes `straum-cli status` and a metrics scraper. The console is meant to
show it in one place.

- **Observe the cluster** from the metrics the broker declares stable.
  Every value is tagged with its node and the time it was read, and the
  console invents no health verdict.
- **Run administrative operations** only through operations the broker
  defines, each going through the broker's log. The broker has no
  administrative API yet, so the first version can only observe.
- **Authenticate first.** No administrative surface leaves loopback
  until it has authentication.

It runs outside the broker process: the broker will never have a
management UI built in.

## The API, as designed

The console will serve read-only JSON, version 1:

| Endpoint | What |
|---|---|
| `GET /api/v1/state` | A snapshot of every configured node |
| `GET /api/v1/stream` | Server-sent events: the state after every poll, and each change seen between polls |
| `GET /api/v1/events?after=<id>&limit=<n>` | Changes since an event id, oldest first |

The console sends nothing to a node except `GET /metrics`. The schema
and its compatibility rules are in
[docs/state-json.md](https://github.com/straum-io/straum-console/blob/main/docs/state-json.md).

Until it exists, [straum-cli](../../ecosystem/straum-cli/) gives the same
cluster view in a terminal.
