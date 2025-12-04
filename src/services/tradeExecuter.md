# `TradeExecutor` — Short Function Documentation (with Examples)

Synchronizes **follower** positions with **leader** by computing deltas and placing trades on Hyperliquid.

---

# 🧩 Constructor: `constructor(deps)`

**Inputs (deps):**

* `exchangeClient` — submits orders
* `infoClient` — fetches clearinghouse states
* `followerAddress` — wallet/vault used to trade
* `leaderState` — current leader positions
* `followerState` — current follower positions
* `metadataService` — mark prices + asset metadata
* `risk` — slippage, leverage caps, copy ratio
* `log` — logger (optional)

**What it does:**

* Stores all dependencies
* Sets up internal logger
* Initializes a `syncing` flag to prevent double execution

---

# 🔁 1. `syncWithLeader()`

**Input:**

* None

**What it does (high-level):**

### **Step 1 — Refresh market metadata + prices**

Ensures price + metadata accuracy before sizing trades.

### **Step 2 — Refresh actual follower state from the API**

Prevents stale in-memory data from causing incorrect reduce-only logic.

### **Step 3 — Compute leader targets**

```
targets = leaderState.computeTargets(metadataService)
```

### **Step 4 — Compute follower deltas**

Two modes:

---

## **A. Exact-mode (`COPY_MODE="exact"`)**

Follower copies **raw leader sizes**, with no scaling.

Example:

```
Leader: +3.0 ETH
Follower: +1.0 ETH
→ delta = +2.0 ETH (buy)
```

---

## **B. Ratio-mode (default)**

Follower copies **leader leverage ratio**, scaled by copyRatio.

Example:

```
Leader equity = $50,000
Leader pos = 3 ETH @ $2,400  → leverage = 7200 / 50000 = 0.144x

Follower equity = $10,000
copyRatio = 1.0

Follower target notional = 0.144 × 10000 = $1440
Follower target size = 1440 / 2400 = 0.6 ETH
Follower current = 0.1 ETH
→ delta = +0.5 ETH
```

---

### **Step 5 — Filter negligible deltas & enforce minimum notional**

Example:

```
delta = 0.0000002 BTC → skipped (dust)
delta * price < $10   → skipped (too small for exchange)
```

---

### **Step 6 — Build IOC orders**

```
buildOrder(delta)
```

Produces:

* Price with slippage adjustment
* Size respecting decimals
* Reduce-only when appropriate
* Client order ID

(Examples in the next section)

---

### **Step 7 — Submit all orders as batch**

Logs:

* Successful fills
* Resting orders
* Errors (e.g., insufficient margin)

---

**Output:**

* None (performs trades)

---

# 🛠️ 2. `buildOrder(delta)`

*(PRIVATE)*
Builds a properly formatted Hyperliquid IOC order.

**Input:**

* `delta: PositionDelta`

**What it does:**

---

## **1. Determine buy/sell**

```
deltaSize > 0 → buy
deltaSize < 0 → sell
```

**Example:**

```
delta = +0.8 SOL → buy
delta = -0.3 SOL → sell
```

---

## **2. Apply slippage (BPS → decimal)**

If slippage = 25 BPS (0.25%):

```
Buy: price = mark * 1.0025
Sell: price = mark * 0.9975
```

**Example:**

```
mark = $100
buy price = 100 * 1.0025 = $100.25
sell price = 100 * 0.9975 = $99.75
```

---

## **3. Clamp price**

Ensures:

```
0.1 × mark <= price <= 10 × mark
```

(Prevents extreme values if mark is very low/high.)

---

## **4. Determine reduce-only flag**

Rules:

| Situation                       | reduceOnly              |
| ------------------------------- | ----------------------- |
| Target = 0                      | TRUE (closing position) |
| Target shrinks (same direction) | TRUE                    |
| Opening or expanding            | FALSE                   |
| Flipped to opposite direction   | FALSE                   |

**Example (closing):**

```
current = 2.0 ETH
target  = 0
→ reduceOnly = true
```

**Example (reducing):**

```
current = 3.0 ETH
target  = 1.0 ETH
→ reduceOnly = true
```

---

## **5. Round size to asset precision**

If SOL has 3 decimals:

```
delta = 1.234567 SOL → size = "1.235"
```

---

## **6. Round price to mark price precision**

If markPrice = 23.45 (2 decimals)

```
computed price = 23.4512 → priceStr = "23.45"
```

---

## **7. Build final order object**

Includes:

* `a` asset ID
* `b` buy/sell bool
* `p` price string
* `s` size string
* `r` reduceOnly
* `t.limit.tif = "Ioc"`
* `c` 32-byte client ID

---

**Output:**

* A valid Hyperliquid IOC order object