# `main.ts` — Short Function Documentation (Entry Point)

This is the main runner for the Hyperliquid Copy Trading Agent.
It loads configuration, initializes all services, starts subscriptions, and runs background sync loops.

---

# **1. `main()`**

**Inputs:**

* none (reads process environment, initializes everything)

**What it does (high-level):**

---

## **A. Load configuration & environment**

1. Loads `.env` using `dotenv.config()`.
2. Builds typed config object with `loadConfig()`.

Example:

```
COPY_RATIO=0.5
MAX_LEVERAGE=5
```

becomes:

```
config.risk.copyRatio = 0.5
config.risk.maxLeverage = 5
```

---

## **B. Initialize Hyperliquid clients**

```
createHyperliquidClients(config)
```

Creates:

* HTTP & WebSocket transports
* Info client
* Exchange client
* Subscription client
* Follower signing account

---

## **C. Resolve follower trading address**

Checks:

* `FOLLOWER_PUBLIC_ADDRESS` (funds wallet)
* `followerTradingAddress` (signing wallet/vault)

Prints a summary showing which one is used for **funds** and **signing**.

Example:

```
🔑 Signer: 0xAgentKey...
💰 Wallet: 0xMainWallet...
```

---

## **D. Initialize core state managers**

Creates:

* `LeaderState`
* `FollowerState`

These store positions + account metrics in memory.

---

## **E. Initialize supporting services**

Creates:

### **1. `MarketMetadataService`**

Caches mark prices, leverage limits, decimals.

### **2. `TradeExecutor`**

Computes deltas and submits orders.

### **3. `Reconciler`**

Periodically fetches full account snapshots.

### **4. `SubscriptionService`**

Listens for **leader fills** and triggers sync.

---

## **F. Startup sequence**

### **1. Start WebSocket subscriptions**

```
subscriptions.start()
```

Begins listening for leader trades.

### **2. Fetch initial state**

```
reconciler.reconcileOnce()
```

Loads full leader + follower snapshots from API.

### **3. Print startup dashboard**

Shows:

* Withdrawable USDC
* Equity
* Copy mode (exact/ratio)

---

## **G. Start periodic loops**

### **1. Reconciliation loop**

```
reconciler.start()
```

Runs every `RECONCILIATION_INTERVAL_MS`.

### **2. Background polling loop**

Constantly:

```
tradeExecutor.syncWithLeader()
wait refreshAccountIntervalMs
```

A fallback if WebSocket events are missed.

---

## **H. Graceful shutdown**

Handles:

* `SIGINT`
* `SIGTERM`

Shuts down:

* Subscriptions
* Reconciler
* WebSocket transport

Then exits the process.

---

**Output:**

* none (starts the entire bot lifecycle)
