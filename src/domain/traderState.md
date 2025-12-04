# `TraderStateStore` — Short Function Documentation (with Examples)

This class manages a trader’s state (positions + account metrics).
Both **LeaderState** and **FollowerState** inherit from it.

---

## **Constructor: `constructor(name, log?)`**

**Inputs:**

* `name` — `"leader"` or `"follower"` (used for logging)
* `log` *(optional)* — custom logger

**What it does:**

* Initializes empty position map and account metrics store.

**Output:**

* A new trader state store.

---

## **1. `getPositions()`**

**Input:**

* None

**What it does:**

* Returns a read-only map of all positions currently tracked.

**Output:**

* `ReadonlyMap<string, PositionSnapshot>`

---

## **2. `getMetrics()`**

**Input:**

* None

**What it does:**

* Returns the trader’s latest account-level metrics.

**Output:**

* `AccountMetrics`

---

## **3. `handleFillEvent(event)`**

**Input:**

* `event` — WebSocket event containing one or more trade fills

**What it does:**

* Extracts fills from the event.
* Passes each fill into `applyFill()` to update positions incrementally.

**Output:**

* None (state is updated internally)

---

## **4. `applyClearinghouseState(state)`**

**Input:**

* `state` — full clearinghouse account snapshot

**What it does:**

1. Replaces all account-level metrics with the snapshot values.
2. Resets and rebuilds the position map using all open positions in the snapshot.
3. Filters out closed or near-zero positions.

### **Example: Snapshot position**

Raw snapshot data:

```
coin = ETH
size = 2.5
entryPx = 2400
positionValue = 6000
```

Position stored as:

```
size = 2.5 ETH
entryPrice = $2400
positionValueUsd = $6000
```

**Output:**

* None (state replaced)

---

## **5. `upsertPosition(coin, snapshot)`**

**Inputs:**

* `coin` — trading pair
* `snapshot` — new position state or `null`

**What it does:**

* If `snapshot` is null or size ≈ 0 → removes the position.
* Otherwise updates/inserts the snapshot.

**Output:**

* None

---

## **6. `applyFill(fill)` *(private)*

Updates position state based on a single executed trade fill.**

**Inputs:**

* `fill` — one fill event (`price`, `size`, `side`, timestamp)

**What it does:**
Handles all scenarios:

* Opening new positions
* Increasing positions
* Reducing positions
* Closing
* Flipping direction

### **Key Calculations (with examples)**

---

### **A. Signed fill size**

```
+size = buy
-size = sell
```

Example:

* fill.sz = `"1.5"`
* side = `"A"` (sell)
  → signedFillSize = **–1.5**

---

### **B. New position size**

```
newSize = oldSize + signedFillSize
```

Example:

* oldSize = **2 ETH**
* signedFillSize = **–1.5 ETH**
  → newSize = **0.5 ETH**

---

### **C. Closing a position**

If `|newSize| < EPSILON` → position is removed.

Example:
oldSize = 1
signedFill = –1
→ newSize = 0 → **position removed**

---

### **D. New entry price logic**

#### **1. Adding to a position → weighted average price**

```
newEntry = (oldNotional + fillNotional) / |newSize|
```

Example:
Old: 2 ETH @ $2400
Fill: +1 ETH @ $2600

```
oldNotional = 2×2400 = 4800
fillNotional = 1×2600 = 2600
newSize = 3

newEntry = (4800 + 2600) / 3 = $2466.67
```

---

#### **2. Reducing but not flipping → keep old entry**

Example:
Old size = 3 ETH
Fill = –1 ETH
→ entry price **unchanged**

---

#### **3. Flip direction (long → short or short → long)**

If reduction + extra fill goes past zero:

* New entry = fill price

Example:
Old size = +1 ETH
Fill = –2 ETH
→ final size = –1 ETH
→ New entry = **fill price**

---

### **E. Update stored snapshot**

Includes:

* `size`
* `entryPrice`
* `positionValueUsd`
* `marginUsedUsd`
* timestamp

**Output:**

* None (internal state updated)