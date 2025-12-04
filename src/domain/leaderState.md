# `LeaderState` Module — Short Function Documentation (with Examples)

## **Class: `LeaderState`**

Tracks the leader’s positions and converts them into **target positions** the follower should mirror — expressed in **leverage**, not raw size.

---

## **1. `constructor()`**

**Input:**

* None

**What it does:**

* Initializes the leader’s state store.

**Output:**

* A new leader state manager.

---

## **2. `computeTargets(metadataService)`**

**Input:**

* `metadataService` — service that provides **current mark prices** for each coin

**What it does:**
Builds a list of **TargetPosition** objects describing the leader’s **current leverage** per coin, based on:

```
leaderLeverage = (|leaderSize| × markPrice) ÷ leaderEquity
```

This leverage ratio is what the follower mirrors (scaled by copy ratio later).

### **How it calculates leverage (with examples)**

---

### **Step 1 — Get leader's equity**

Example:
Leader account value = **$50,000**

---

### **Step 2 — Get current mark price**

Example:
Coin: `ETH`
Mark price from metadata service = **$2,400**

---

### **Step 3 — Compute leader notional exposure**

```
notionalUsd = |leaderSize| × markPrice
```

Example:
Leader size = **+3 ETH**
→ notionalUsd = 3 × 2400 = **$7,200**

---

### **Step 4 — Compute leader leverage**

```
leaderLeverage = notionalUsd / leaderEquity
```

Example:
7200 / 50000 = **0.144x leverage**

---

### **Step 5 — Package the target**

Every target includes:

* `coin`
* `leaderSize`
* `leaderLeverage`
* `markPrice`

**Example TargetPosition:**

```ts
{
  coin: "ETH",
  leaderSize: 3,
  leaderLeverage: 0.144,
  markPrice: 2400
}
```

This is what the follower receives and later converts into its own proportional position size.

---

**Output:**
Returns an array of `TargetPosition` objects (one for each leader-held coin).

---

## **3. `getPosition(coin)`**

**Input:**

* `coin` — symbol of the asset (e.g., `"SOL"`, `"BTC"`)

**What it does:**

* Fetches the leader’s current position for that coin.

**Output:**

* A `PositionSnapshot` or `undefined`.
