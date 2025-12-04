# 📘 Hyperliquid Copy Trading Agent — Developer Documentation

This document explains the full architecture of the **Copy Trading Agent**, how modules interact, and where to find detailed documentation for each subsystem.

It is intended for developers extending, debugging, or reviewing the bot’s internal components.

Root:

```
src/
```

---

# 🗺️ 1. Architecture Overview

The trading agent consists of **five major layers**:

1. **Configuration Layer**
2. **Client Layer (Hyperliquid API)**
3. **Domain Layer (State Models & Logic)**
4. **Services Layer (Metadata, Execution, Subscriptions, Reconciliation)**
5. **Main Runtime Layer (entrypoint)**

Each module is documented and hyperlinked below.

---

# 📂 2. Configuration Layer

Directory:

```
src/config/
```

Responsible for loading and validating environment-based configuration.

### Modules:

| File                                     | Purpose                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| [`config/index.ts`](src/config/index.ts) | Loads env vars, validates types, produces `CopyTradingConfig` |
| [`config/index.md`](src/config/index.md) | Detailed docs for interface definitions & helpers             |

### Responsibilities

* Load `.env` variables
* Construct:

  * copy ratio
  * max leverage
  * slippage
  * intervals
* Validate required addresses
* Provide typed configuration across the entire system

### Reference Documentation

👉 **[Config Documentation](src/config/index.md)**

---

# 🌐 3. Client Layer — Hyperliquid API Clients

Directory:

```
src/clients/
```

Provides authenticated HTTP/WebSocket clients to the Hyperliquid DEX.

### Modules:

| File                                                   | Purpose                                                |
| ------------------------------------------------------ | ------------------------------------------------------ |
| [`clients/hyperliquid.ts`](src/clients/hyperliquid.ts) | Creates InfoClient, ExchangeClient, SubscriptionClient |
| [`clients/hyperliquid.md`](src/clients/hyperliquid.md) | Docs for client initialization                         |

### Responsibilities

* Initialize:

  * HTTP transport
  * WebSocket transport
  * InfoClient
  * ExchangeClient
  * SubscriptionClient
* Convert private key → signing account
* Choose trading address (wallet vs vault)

### Reference

👉 **[Hyperliquid Client Documentation](src/clients/hyperliquid.md)**

### **Function Overviews**

* **isTestnet(environment)** — Helper that returns `true` if the target environment is `"testnet"`; otherwise `false`.
* **createHyperliquidClients(config)** — Initializes all Hyperliquid API clients (Info, Exchange, Subscription), WebSocket/HTTP transports, follower signing account, and trading address.
* **NodeWebSocketWrapper (class)** — Internal WebSocket adapter that makes the Node.js `ws` library behave like a browser WebSocket for the Hyperliquid SDK.

---

# 🧠 4. Domain Layer — State Logic

Directory:

```
src/domain/
```

This layer models **leader and follower trading state**, handles **position math**, and defines standard types.

### Modules:

| File               | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `traderState.ts`   | Base class for maintaining positions & metrics  |
| `leaderState.ts`   | Computes leader leverage-based target positions |
| `followerState.ts` | Computes follower deltas w/ risk controls       |
| `types.ts`         | Position & metrics type definitions             |

Markdown docs:

* [`traderState.md`](src/domain/traderState.md)
* [`leaderState.md`](src/domain/leaderState.md)
* [`followerState.md`](src/domain/followerState.md)
* [`types.md`](src/domain/types.md)

---

## 4.1 `TraderState` (base class)

Handles:

* Position snapshots
* Incremental WebSocket fill updates
* Clearinghouse snapshots
* Entry price math for adds, reductions, flips

**Documentation**
👉 [`traderState.md`](src/domain/traderState.md)

### **Function Overviews**

* **constructor(name, log?)** — Initializes a trader state store with a label (`"leader"` or `"follower"`) and optional logger.
* **getPositions()** — Returns a read-only map of all current open positions.
* **getMetrics()** — Returns the stored account-level metrics such as equity, margin used, and notional exposure.
* **handleFillEvent(event)** — Processes a batch of WebSocket fill events and applies each fill to update position state incrementally.
* **applyClearinghouseState(state)** — Replaces all positions and metrics with a full clearinghouse snapshot from the Hyperliquid API.
* **upsertPosition(coin, snapshot)** — Manually inserts, updates, or removes a position snapshot based on the provided data.
* **applyFill(fill)** — (private) Applies a single fill to update size, entry price, and position direction, handling adds, reductions, and flips.

---

## 4.2 `LeaderState`

Responsible for:

* Computing leader **leverage-based target positions**
* Using **current mark price**, not entry price
* Producing `TargetPosition[]` used by FollowerState

**Documentation**
👉 [`leaderState.md`](src/domain/leaderState.md)

### **Function Overviews**

* **constructor()** — Initializes leader state storage by extending TraderStateStore with the `"leader"` label.
* **computeTargets(metadataService)** — Computes the leader’s leverage-based target positions using current mark prices, producing `TargetPosition[]` for the follower.
* **getPosition(coin)** — Returns the leader’s current position snapshot for a specific coin, or `undefined` if none exists.

---

## 4.3 `FollowerState`

Responsible for:

* Computing deltas between follower & leader
* Applying:

  * copy ratio
  * max leverage cap
  * max notional cap
  * slippage logic
  * inverse mode

Outputs `PositionDelta[]`

**Documentation**
👉 [`followerState.md`](src/domain/followerState.md)

### **Function Overviews**

* **constructor()** — Initializes follower state storage by extending the base TraderStateStore with the `"follower"` label.
* **getPosition(coin)** — Returns the follower’s current position snapshot for a specific asset, or `undefined` if none exists.
* **computeDeltas(targets, risk)** — Computes target position sizes based on leader leverage and follower risk settings, then returns the required buy/sell deltas for each asset.

---

## 4.4 Types

Includes:

* `PositionSnapshot`
* `AccountMetrics`
* `TraderState`

**Documentation**
👉 [`types.md`](src/domain/types.md)

### **Type Overviews**

* **PositionSide** — Represents the direction of a position (`"long"`, `"short"`, or `"flat"`).
* **PositionSnapshot** — Immutable snapshot describing a single open position (size, entry price, leverage, liquidation price, etc.).
* **AccountMetrics** — Aggregated account-wide metrics including equity, notional exposure, margin usage, and withdrawable balance.
* **TraderState** — Full trader state object composed of a position map and corresponding account metrics.

---

# ⚙️ 5. Services Layer — Core Runtime Logic

Directory:

```
src/services/
```

This layer drives the trading engine: quotes, execution, syncing, and subscriptions.

### Modules:

| File                | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `marketMetadata.ts` | Load/cache metadata & mark prices        |
| `tradeExecutor.ts`  | Build orders & sync follower with leader |
| `reconciler.ts`     | Periodic full-state sync                 |
| `subscriptions.ts`  | Live WebSocket listener for leader fills |

Markdown docs:

* [`marketMetadata.md`](src/services/marketMetadata.md)
* [`tradeExecutor.md`](src/services/tradeExecutor.md)
* [`reconciler.md`](src/services/reconciler.md)
* [`subscriptions.md`](src/services/subscriptions.md)

---

## 5.1 `MarketMetadata`

Does:

* Loads asset metadata
* Caches mark prices
* Refreshes prices on demand
* Required by TradeExecutor for:

  * price precision
  * size decimals
  * leverage limits

👉 Documentation:
[`marketMetadata.md`](src/services/marketMetadata.md)

### **Function Overviews**

* **constructor(...)** — Initializes the metadata service with an InfoClient and logger, and prepares internal caches for metadata and mark prices.
* **ensureLoaded()** — Loads full asset metadata and initial mark prices from Hyperliquid if not already loaded.
* **getByCoin(coin)** — Retrieves cached metadata for a coin, returning `undefined` if missing.
* **requireByCoin(coin)** — Same as `getByCoin`, but throws an error if the coin is not found.
* **getMarkPrice(coin)** — Returns the most recently cached mark price for a given coin.
* **refreshMarkPrices()** — Updates cached mark prices by fetching fresh data without reloading full metadata.

---

## 5.2 `TradeExecutor`

The **core engine** that:

1. Refreshes metadata & mark prices
2. Re-fetches follower clearinghouse state
3. Computes:

   * EXACТ mode deltas
   * Ratio-scaled deltas
4. Builds IOC limit orders
5. Applies slippage rules
6. Submits batch orders

👉 Documentation:
[`tradeExecutor.md`](src/services/tradeExecutor.md)

### **Function Overviews**

* **constructor(...)** — Initializes the executor with exchange client, info client, state stores, metadata service, risk settings, and logger.
* **syncWithLeader()** — Refreshes market metadata and follower state, computes deltas, builds IOC orders, and submits trades to synchronize follower with leader.
* **buildOrder(delta)** — Creates a fully formatted Hyperliquid IOC order (price, size, reduce-only flag, client ID) based on a single position delta.

---

## 5.3 `Reconciler`

Background process that:

* Fetches full leader/follower snapshots
* Updates TraderState stores
* Prevents drift from missed WebSocket events
* Runs on interval

👉 Documentation:
[`reconciler.md`](src/services/reconciler.md)

### **Function Overviews**

* **constructor(...)** — Initializes the reconciler with API client, config, leader & follower state stores, follower address, and logger.
* **reconcileOnce()** — Fetches full clearinghouse snapshots for both leader and follower, updating in-memory state to correct drift.
* **start()** — Begins the periodic reconciliation loop, running immediately and then on a fixed interval.
* **stop()** — Stops the reconciliation loop by clearing the active interval timer.


---

## 5.4 `Subscriptions`

Listens to:

```
userFills({ user: leader })
```

Triggers:

* LeaderState updates
* TradeExecutor.syncWithLeader()

👉 Documentation:
[`subscriptions.md`](src/services/subscriptions.md)

### **Function Overviews**

* **constructor(...)** — Initializes the subscription service with client, config, leader state, and sync callback.
* **start()** — Subscribes to live leader fill events and invokes leader state updates + trade execution.
* **stop()** — Stops subscriptions (safe no-op; SDK handles cleanup automatically).

---

# 🔧 6. Utility Layer

Directory:

```
src/utils/
```

Contains shared helper utilities.

### Files:

* `logger.ts` — structured logging
* `math.ts` — numeric helpers

Markdown docs:

* [`logger.md`](src/utils/logger.md)
* [`math.md`](src/utils/math.md)

---

## 6.1 `logger.ts`

Provides:

* debug/info/warn/error
* env-controlled log level
* structured console output

👉 [`logger.md`](src/utils/logger.md)

---

## 6.2 `math.ts`

Contains:

* `toFloat`
* `round`
* `clamp`
* `safeDivide`

👉 [`math.md`](src/utils/math.md)

---

# 🚀 7. Main Runtime Layer (Entry Point)

File:

```
src/index.ts
```

### Responsibilities

1. Load environment
2. Build config
3. Initialize all services
4. Start:

   * WebSocket subscriptions
   * Initial reconciliation
   * Periodic reconciliation
   * Background polling sync loop
5. Graceful shutdown

(link to full documentation)

👉 [`index.md`](src/index.md)

---

# 🔄 8. High-Level Flow Diagram

```mermaid
flowchart TD

A[Env Vars] --> B[loadConfig()]
B --> C[createHyperliquidClients]
C --> D[LeaderState]
C --> E[FollowerState]
C --> H[SubscriptionService]

C --> F[MarketMetadataService]
D --> G[TradeExecutor]
E --> G
F --> G

H --> G

C --> I[Reconciler]
I --> D
I --> E

G -->|Orders| C

subgraph Bot Runtime
D
E
F
G
H
I
end
```