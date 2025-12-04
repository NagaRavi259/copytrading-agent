# `SubscriptionService` — Short Function Documentation

Listens to **leader fill events** over WebSocket and triggers follower updates when the leader trades.

---

## **Constructor: `constructor(client, config, leaderState, onUpdate, log)`**

**Inputs:**

* `client` — Hyperliquid WebSocket subscription client
* `config` — copy-trading configuration (contains leader address)
* `leaderState` — state store that maintains leader positions
* `onUpdate` — callback triggered whenever the leader trades
* `log` — logger

**What it does:**

* Stores everything needed to listen for leader fills live.

---

## **1. `start()`**

**Input:**

* None

**What it does:**

* Logs that subscriptions are starting.
* Subscribes to **leader fill events** using:

  ```
  client.userFills({ user: leaderAddress }, callback)
  ```
* Handles event types:

  * **Snapshot event:** initial batch → ignored for trading logic
  * **Fill event:** one or more fills → used to update leaderState

### **What happens on each fill event:**

1. **Logs trade alert**
   (price, size, side, etc.)

2. **Updates leader state**

   ```
   leaderState.handleFillEvent(event)
   ```

3. **Triggers the bot’s sync process**

   ```
   onUpdate()
   ```

### **Example flow:**

Leader buys 1.2 ETH → WebSocket emits:

```
fills = [{ coin: "ETH", size: "1.2", side: "B", price: "2400" }]
```

`start()` callback does:

* logs “leader traded”
* updates leaderState (ETH position increased)
* calls `onUpdate()` → follower computes deltas → executes trades

**Output:**

* None (starts listening forever, until stopped)

---

## **2. `stop()`**

**Input:**

* None

**What it does:**

* Logs that subscriptions are stopping.
* No manual unsubscribe needed (SDK auto-handles on transport close).

**Output:**

* None
