# `Reconciler` — Short Function Documentation

Periodically pulls full account snapshots for **leader** and **follower** to ensure internal state stays correct, even if WebSocket updates are missed.

---

## **Constructor: `constructor(infoClient, config, leaderState, followerState, followerAddress, log?)`**

**Inputs:**

* `infoClient` — Hyperliquid Info client
* `config` — full bot config (interval included)
* `leaderState` — LeaderState instance
* `followerState` — FollowerState instance
* `followerAddress` — follower trading address
* `log` *(optional)* — logger

**What it does:**

* Stores everything needed to run reconciliation.

---

## **1. `reconcileOnce()`**

**Input:**

* None

**What it does:**

* Fetches **two full clearinghouse snapshots in parallel**:

  * Leader account
  * Follower account
* Applies snapshots to `leaderState` and `followerState`.

### **Example:**

If the follower previously missed a WebSocket event:

* Leader: 3 ETH long
* Follower (local state): 1 ETH long
* Follower (actual on exchange): 3 ETH long

After reconciliation:

```
followerState now reflects the correct 3 ETH long position.
```

**Output:**

* None (updates state stores)

---

## **2. `start()`**

**Input:**

* None

**What it does:**

* If already running → does nothing.
* Logs startup info.
* Runs `reconcileOnce()` **immediately**.
* Starts an interval loop calling `reconcileOnce()` every:

  ```
  config.reconciliationIntervalMs
  ```

### **Example:**

If interval = 60,000 ms (1 min):

* Reconcile immediately
* Reconcile again every 60 seconds

**Output:**

* None (begins interval loop)

---

## **3. `stop()`**

**Input:**

* None

**What it does:**

* Cancels the interval if it is running.
* Safe no-op if already stopped.

**Output:**

* None
