# `FollowerState` Module — Short Function Documentation (with Examples)

## **Class: `FollowerState`**

Tracks follower positions and computes how much the follower must buy/sell to match the leader — applying leverage rules, copy ratio, caps, and optional inversion.

---

## **1. `constructor()`**

**Input:**

* None

**What it does:**

* Initializes follower state by calling the base class with `"follower"`.

**Output:**

* A new follower state store.

---

## **2. `getPosition(coin)`**

**Input:**

* `coin` (e.g., `"ETH"`, `"BTC"`)

**What it does:**

* Returns the follower’s existing position for that coin.

**Output:**

* A `PositionSnapshot` or `undefined`.

---

## **3. `computeDeltas(targets, risk)`**

**Input:**

* `targets` — leader-derived target positions
* `risk` — follower risk settings (copy ratio, caps, inverse, etc.)

**What it does:**
Computes how much the follower must adjust each position.
Here is the high-level logic **with simple examples**:

---

### **Step 1 — Scale leader leverage using copyRatio**

```
targetLeverage = leaderLeverage × copyRatio
```

**Example:**
Leader uses **8x**, follower copyRatio = **0.5**
→ targetLeverage = 8 × 0.5 = **4x**

---

### **Step 2 — Apply maxLeverage cap**

```
cappedLeverage = min(targetLeverage, maxLeverage)
```

**Example:**
targetLeverage = 4x
maxLeverage = 3x
→ cappedLeverage = **3x**

---

### **Step 3 — Compute allowed notional based on follower equity**

```
targetNotional = cappedLeverage × followerEquity
```

**Example:**
Follower equity = **$2,000**, cappedLeverage = 3x
→ targetNotional = 3 × 2000 = **$6,000**

---

### **Step 4 — Apply maxNotionalUsd cap**

```
allowedNotional = min(targetNotional, maxNotionalUsd)
```

**Example:**
targetNotional = $6,000
maxNotionalUsd = $5,000
→ allowedNotional = **$5,000**

---

### **Step 5 — Convert notional → position size using mark price**

```
targetSize = direction × (allowedNotional / markPrice)
```

* `direction` = +1 to mirror leader
* `direction` = −1 if `inverse = true`

**Example:**
allowedNotional = $5,000
mark price = $2,500
direction = +1
→ size = 5000 / 2500 = **2.0 ETH**

---

### **Step 6 — Compute required delta**

```
deltaSize = targetSize − currentSize
```

**Example:**
Follower currently holds **0.5 ETH**
targetSize = **2.0 ETH**
→ deltaSize = 2.0 − 0.5 = **+1.5 ETH** (buy 1.5 ETH)

---

### **Step 7 — Add extra deltas for coins leader has closed**

If follower holds a coin the leader does not, the follower gets:

```
targetSize = 0
deltaSize = -currentSize
```

**Example:**
Follower has 0.8 SOL
Leader has no SOL target anymore
→ deltaSize = −0.8 (sell everything)

---

**Output:**
Returns an array of `PositionDelta` objects, each containing:

* `coin`
* `current` (follower’s current position)
* `targetSize` (after risk rules)
* `deltaSize` (how much to buy/sell)
* `maxNotionalUsd` applied to this calculation
