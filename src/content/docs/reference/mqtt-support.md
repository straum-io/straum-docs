---
title: MQTT support
description: Which MQTT 3.1.1 and MQTT 5 features Straum supports today, which it refuses, and the reason codes it sends.
sidebar:
  order: 3
---

Straum speaks MQTT 3.1.1 and MQTT 5 over TCP on the same listener, from
one packet model with properties and reason codes.

## Feature matrix

| Feature | Status | Notes |
|---|---|---|
| MQTT 3.1.1 | Supported | |
| MQTT 5 | Supported | Properties and reason codes are part of the packet model |
| QoS 0 | Supported | Nothing confirms delivery |
| QoS 1 | Supported | PUBACK after majority commit |
| QoS 2 | Refused | `QosNotSupported`; the log reserves room for it |
| Retained messages | Supported | Set, and clear with an empty payload |
| `+` and `#` wildcards | Supported | |
| No local, retain as published, retain handling | Supported | |
| Topic aliases | Supported | Per connection |
| Clean sessions | Supported | |
| Persistent sessions | Refused at CONNECT | Planned |
| Wills | Refused at CONNECT | Planned |
| Session expiry | Refused at CONNECT | Planned |
| Message expiry | Accepted and forwarded, not enforced | Planned |
| Shared subscriptions | Refused | CONNACK says they are unavailable |
| Subscription identifiers | Refused | |
| Username and password | Supported | With `STRAUM_AUTH_PASSWORD_FILE`; topic rules with `STRAUM_AUTH_ACL_FILE` |
| TLS | Supported | With `STRAUM_TLS_*`; TLS only on that listener, never plaintext beside it |
| Enhanced authentication | Refused | `BadAuthenticationMethod` |
| WebSocket | Not planned | |

## Reason codes

The reason codes the gateway sends by name, in CONNACK, SUBACK and
DISCONNECT. The authoritative list is in the broker's
[docs/configuration.md](https://github.com/straum-io/straum/blob/main/docs/configuration.md#stable-names-d-141-a),
where a test pins it; this copy was taken at revision `0036c96`.

<!-- stable-reasons:begin -->
```text
Success
GrantedQos1
BadAuthenticationMethod
BadUserNameOrPassword
ClientIdentifierNotValid
ImplementationSpecificError
KeepAliveTimeout
NotAuthorized
ProtocolError
QosNotSupported
QuotaExceeded
ReceiveMaximumExceeded
ServerBusy
ServerUnavailable
SessionTakenOver
SharedSubscriptionsNotSupported
SubscriptionIdentifiersNotSupported
TopicAliasInvalid
```
<!-- stable-reasons:end -->

A malformed packet closes the connection with the reason the decoder
gives it; those are not in this list.

## Session takeover

Connecting twice with the same client id to the **same node** ends the
first connection with `SessionTakenOver`. Across nodes this is not
enforced yet: two nodes can each hold a live session for one client id.
