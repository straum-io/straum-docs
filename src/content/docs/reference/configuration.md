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
| `STRAUM_EXPERIMENTAL_CLUSTER` | unset | Set to `1` to opt in to the experimental cluster. The server does not start without it. |
| `STRAUM_CLUSTER_NODE_ID` | required | This node's id, 0–255. |
| `STRAUM_CLUSTER_PEERS` | required | Every voter, this node included: `id=address,…` as socket addresses. Odd, at least three, no id twice. |
| `STRAUM_CLUSTER_LISTEN` | this node's address in the peers | Where its links to other nodes listen. It and the peers may be beyond loopback when the three `STRAUM_CLUSTER_TLS_*` are set. |
| `STRAUM_CLUSTER_MQTT_LISTEN` | `127.0.0.1:1883` | Where MQTT clients connect. It may be beyond loopback when `STRAUM_TLS_*` and a password file are set and anonymous clients are refused. |
| `STRAUM_CLUSTER_METRICS_LISTEN` | off | Plain-HTTP Prometheus text, no credentials. At most 4 scrapes at once, each read and write bounded by 2 s. A diagnostic interface, not a monitoring system. |
| `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK` | `0` | `1` lets every listener and peer use addresses beyond loopback, without TLS where TLS is not configured. For an isolated, trusted network only. Without it such an address is refused at startup, except where TLS secures it (the two rows above). Metrics are never encrypted. |
| `STRAUM_CLUSTER_DATA_DIR` | required | The log, snapshots, and a file pinning the directory to its cluster's configuration. |
| `STRAUM_CLUSTER_HEARTBEAT_MS` | `50` | 1–10 000. A starting value, not yet tuned on Linux. |
| `STRAUM_CLUSTER_TAKEOVER_TICKS` | `3` | Heartbeats of silence before a takeover, 1–1 000. A starting value. At least `4` with node TLS, or the start is refused. |
| `STRAUM_CLUSTER_RETAIN_BYTES` | `67108864` | How much log is kept behind a slow replica (64 MiB). |
| `STRAUM_READ_BYTES` | `65536` | One catch-up or fetch read. At most 4 MiB. |
| `STRAUM_WAL_PREALLOCATE_BYTES` | `8388608` (8 MiB) | Zeros written this far ahead of each log segment's end, 0–1 GiB, so a sync flushes data only. On by default since a run on an accepted host confirmed the gain: on that host (ext4 on a SATA disk) steady acknowledged publishes per second went from about 1 800 to about 4 500. One host and one filesystem, so no precise gain is claimed elsewhere; XFS, Btrfs and ZFS are not measured. On a copy-on-write filesystem (Btrfs, ZFS) no benefit is expected: set `0` there, which turns it off. |
| `STRAUM_AUTH_PASSWORD_FILE` | off | MQTT credentials, one `user:<hash>` per line. With it, every CONNECT is checked; read again on `SIGHUP`. [Format](#credentials-and-topic-rules). |
| `STRAUM_AUTH_ACL_FILE` | off | Topic rules. With it, a client may do only what the file grants; read again on `SIGHUP`. [Format](#credentials-and-topic-rules). |
| `STRAUM_AUTH_ALLOW_ANONYMOUS` | `1` without a password file, `0` with one | Whether a client without a user name is let in. A configuration under which no client could connect is refused at startup. |
| `STRAUM_TLS_CERT_PATH` | off | PEM certificate chain for the MQTT listener. With the key, that listener speaks TLS only. Both or neither; read again on `SIGHUP`. |
| `STRAUM_TLS_KEY_PATH` | off | Its private key, PEM. |
| `STRAUM_CLUSTER_TLS_CERT_PATH` | off | This node's certificate for its links. With the next two, every link is TLS 1.3 and both ends prove their node identity. All three or none. [Node certificates](#node-certificates). |
| `STRAUM_CLUSTER_TLS_KEY_PATH` | off | Its private key, PEM. |
| `STRAUM_CLUSTER_TLS_CA_PATH` | off | The cluster CA, PEM. Use a CA for this cluster alone. |
| `STRAUM_LOG_LEVEL` | `info` | |
| `STRAUM_WORKER_THREADS` | `auto` | The number of CPUs. |

A node with node TLS and one without cannot link: turning it on or off
means stopping every node, then starting every node with the new settings.

## Credentials and topic rules

The password file holds one `user:hash` per line; `#` starts a comment.
Make each hash with `straum-server hash-password`, which reads the
password on stdin. Use its parameters for every hash: a hash made with
others lets a known user name be told from an unknown one by timing.

The ACL file names a user, or `anonymous`, then what it may do:

```text
user alice
publish   sensors/+/temp
subscribe sensors/#

user bob
readwrite shared/bus

anonymous
subscribe public/#
```

The file grants only what it lists. A user it names may do what its rules
allow, a user it does not name may do nothing, and anonymous clients, if
let in, only what the `anonymous` section lists. Without the file every
client let in may do anything. A subscription is allowed only when a rule
covers everything the filter could match: `subscribe sensors/#` does not
grant `#`.

A refused SUBSCRIBE filter gets "not authorized". A refused QoS 1 PUBLISH
gets "not authorized" in MQTT 5; MQTT 3.1.1 closes the connection.
A file that cannot be read or parsed refuses the start. A file under which
nobody may do anything starts, with a warning in the log.

## Node certificates

Each node's certificate names it with the subjectAltName
`DNS:<id>.node.straum`, for example `2.node.straum` for node 2, exactly
once. Its extendedKeyUsage includes both `serverAuth` and `clientAuth`,
or is absent. One way to issue the files:

```sh
# Once per cluster: the CA. Keep ca.key off the nodes.
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \
  -keyout ca.key -out ca.pem -days 3650 -subj "/CN=straum cluster CA" \
  -addext basicConstraints=critical,CA:TRUE -addext keyUsage=critical,keyCertSign

# Per node, here node 2.
openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \
  -keyout node-2.key -out node-2.csr -subj "/CN=node 2"
openssl x509 -req -in node-2.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
  -out node-2.pem -days 365 -extfile <(printf '%s\n' \
  'subjectAltName=DNS:2.node.straum' \
  'extendedKeyUsage=serverAuth,clientAuth' \
  'keyUsage=critical,digitalSignature')
```

Node 2 then runs with `STRAUM_CLUSTER_TLS_CERT_PATH=node-2.pem`,
`STRAUM_CLUSTER_TLS_KEY_PATH=node-2.key`,
`STRAUM_CLUSTER_TLS_CA_PATH=ca.pem` and
`STRAUM_CLUSTER_TAKEOVER_TICKS=4` or more.

To renew, issue a new certificate from the same CA, replace the files and
send `SIGHUP`: no link closes. To remove a node, give every other node
files of a new CA, then `SIGHUP` each; their links to the removed node
close; new certificates from a CA that never signed the removed node work
too. There is no revocation list. A peer certificate that expires keeps
its link until the next `SIGHUP` checks it.

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
| `SIGHUP` | Read the TLS, node TLS and credential files again. All are checked first; if any fails, the files in use stay. Open connections keep what they were admitted with; open links are checked against the new node files. It never turns TLS or credentials on or off. |
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
These pages copy them at revision `26fd82e`.
