---
title: Install
description: Run Straum from the Docker image, the Ubuntu PPA or Debian packages, or on Kubernetes with the Kustomize package.
sidebar:
  order: 3
---

Every option below runs the same `straum-server` binary, configured with
`STRAUM_*` environment variables. See
[Configuration](../../reference/configuration/) for each one.

:::danger[No authentication]
Containers and real networks need addresses beyond loopback, which
means setting `STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1`. Nothing is
authenticated or encrypted yet: keep the network private.
:::

## Docker

The image is about 40 MB, built on a distroless base, and runs as a
non-root user. Release candidates are on Docker Hub as
[`straumio/straum`](https://hub.docker.com/r/straumio/straum) for
`linux/amd64` and `linux/arm64`, with provenance and an SBOM attached:

```sh
docker pull straumio/straum:0.1.0-rc.3
docker tag straumio/straum:0.1.0-rc.3 straum
```

Or build it from a checkout of
[straum-io/straum](https://github.com/straum-io/straum):

```sh
docker build -t straum .
```

Three nodes on their own network:

```sh
docker network create --subnet 10.89.42.0/24 straum
PEERS=0=10.89.42.10:7000,1=10.89.42.11:7000,2=10.89.42.12:7000
for i in 0 1 2; do
  docker run -d --name straum-$i --network straum --ip 10.89.42.1$i \
    -v straum-$i:/var/lib/straum \
    -p 188$((3 + i)):1883 -p 910$i:9100 \
    -e STRAUM_EXPERIMENTAL_CLUSTER=1 \
    -e STRAUM_CLUSTER_UNAUTHENTICATED_NETWORK=1 \
    -e STRAUM_CLUSTER_NODE_ID=$i \
    -e STRAUM_CLUSTER_PEERS=$PEERS \
    -e STRAUM_CLUSTER_LISTEN=0.0.0.0:7000 \
    -e STRAUM_CLUSTER_MQTT_LISTEN=0.0.0.0:1883 \
    -e STRAUM_CLUSTER_METRICS_LISTEN=0.0.0.0:9100 \
    straum
done
```

Ports map as in the [quick start](../../start/quick-start/): MQTT on
1883–1885, metrics on 9100–9102. Each node keeps its log in its volume
and picks up where it left off after a restart. Peers are IP addresses:
the node does not resolve host names.

## Debian and Ubuntu

On Ubuntu 22.04, 24.04 and 26.04, the PPA keeps Straum up to date (amd64
and arm64):

```sh
sudo add-apt-repository ppa:straum/ppa
sudo apt install straum
```

Otherwise each [GitHub release](https://github.com/straum-io/straum/releases)
has `.deb` packages for amd64 and arm64 (Debian 12, Ubuntu 22.04 and newer)
with `SHA256SUMS` and build provenance. The latest is `v0.1.0-rc.3`:

```sh
curl -LO https://github.com/straum-io/straum/releases/download/v0.1.0-rc.3/straum_0.1.0.rc.3_amd64.deb
sudo apt install ./straum_0.1.0.rc.3_amd64.deb
```

Either way the package installs `/usr/bin/straum-server`, a `straum`
systemd service and its settings file. It starts nothing by itself:

```sh
sudoedit /etc/default/straum          # node id, peers, listen addresses
sudo systemctl enable --now straum
```

The service runs as a dynamic user with its data in `/var/lib/straum`
and a tight sandbox (`systemd-analyze security` rates it 1.4). Use it on
hosts or VMs; in containers use the Docker image, since the sandbox needs
namespaces a container usually cannot create.

## Kubernetes

[`deploy/kubernetes`](https://github.com/straum-io/straum/tree/main/deploy/kubernetes)
is a Kustomize package: a three-replica StatefulSet with a volume per
node, one Service per node for the links, a `straum-mqtt` Service for
clients, a headless Service for per-pod metrics, and a NetworkPolicy
that keeps the links to Straum pods. It needs Kubernetes 1.28 or newer.

Before applying, set:

- **the image**, in `kustomization.yaml` (`images:`);
- **three free ClusterIPs** in `peers.yaml`, inside your service CIDR,
  and the same three in `STRAUM_CLUSTER_PEERS` in `statefulset.yaml`.
  The node takes socket addresses, not host names, so each peer gets a
  Service with a fixed IP. The defaults fit the common `10.96.0.0/12`.

```sh
kubectl apply -k deploy/kubernetes
kubectl rollout status statefulset/straum
kubectl port-forward svc/straum-mqtt 1883:1883
```

Pods run as a non-root user with a read-only root filesystem. Service
links are off, because the server refuses unknown `STRAUM_*` variables.

:::note
A pod that restarts can stay behind and not serve clients
([straum#13](https://github.com/straum-io/straum/issues/13)); the other
two keep the cluster available.
:::
