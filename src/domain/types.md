# `types.ts` — Short Type Documentation

## **1. `PositionSide`**

**Type:**
`"long" | "short" | "flat"`

**Meaning:**
Represents the direction of a position.

---

## **2. `PositionSnapshot`**

A single, immutable snapshot of a trader’s position at a specific moment.

**Fields:**

* **`coin`** — trading pair (e.g., `"ETH"`, `"SOL"`)
* **`size`** — positive = long, negative = short, zero = flat
* **`entryPrice`** — average entry price of the position
* **`positionValueUsd`** — `abs(size) × markPrice`
* **`leverage`** — current leverage (notional / equity)
* **`marginUsedUsd`** — margin allocated to this specific position
* **`liquidationPrice`** — estimated liquidation price, or null
* **`lastUpdatedMs`** — timestamp of most recent update

**Used for:**
Tracking follower and leader positions across time.

---

## **3. `AccountMetrics`**

Aggregated account-wide values for a trader.

**Fields:**

* **`accountValueUsd`** — total account equity
* **`totalNotionalUsd`** — sum of all open position notionals
* **`totalMarginUsedUsd`** — total margin being used
* **`withdrawableUsd`** — funds available to withdraw
* **`lastUpdatedMs`** — timestamp of last metrics update

**Used for:**
Scaling follower positions (copy ratio × equity), computing leverage, etc.

---

## **4. `TraderState`**

Represents the full state of a trader.

**Fields:**

* **`positions`** — `Map<string, PositionSnapshot>` for all open positions
* **`metrics`** — the trader’s `AccountMetrics`

**Used for:**
Reconstructing the complete trading state during reconciliation.