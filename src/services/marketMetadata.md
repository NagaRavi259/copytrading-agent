# `MarketMetadataService` — Short Function Documentation (with Examples)

Provides cached market metadata + mark prices for fast order sizing, leverage checks, and follower calculations.

---

## **Constructor: `constructor(infoClient, log?)`**

**Inputs:**

* `infoClient` — Hyperliquid InfoClient (used to fetch metadata + prices)
* `log` *(optional)* — logger instance

**What it does:**

* Initializes empty caches for:

  * metadata per coin
  * mark prices per coin
* Sets `loaded = false` initially.

---

## **1. `ensureLoaded(signal?)`**

**Input:**

* `signal` *(optional)* — AbortSignal for cancellation

**What it does:**

* If metadata is already loaded → does nothing.
* If not loaded → fetches:

  * Full asset metadata (name, leverage, decimals, etc.)
  * Current mark prices
* Fills the internal caches:

  * `coinToMeta`
  * `coinToMarkPx`

### **Example:**

Suppose Hyperliquid returns:

* `"ETH"` with maxLeverage 20, sizeDecimals 3, mark price $2,400

After calling:

```
service.getByCoin("ETH")
→ { assetId: 1, coin: "ETH", maxLeverage: 20, sizeDecimals: 3, marginTableId: … }

service.getMarkPrice("ETH")
→ 2400
```

**Output:**

* None (loads metadata into memory)

---

## **2. `getByCoin(coin)`**

**Input:**

* `coin` — e.g., `"ETH"`

**What it does:**

* Looks up metadata for that coin in the cache.

**Output:**

* `AssetMetadata` object or `undefined`

---

## **3. `requireByCoin(coin)`**

**Input:**

* `coin`

**What it does:**

* Same as `getByCoin`, but throws an error if metadata is missing.
* Useful for enforcing strict checks before placing orders.

**Output:**

* `AssetMetadata`

**Throws:**

* `Error("Unknown coin <symbol> …")`

---

## **4. `getMarkPrice(coin)`**

**Input:**

* `coin`

**What it does:**

* Returns the most recently cached mark price.

**Output:**

* `number | undefined`

**Example:**
If mark price was cached as 24,000 for BTC:

```
getMarkPrice("BTC") → 24000
```

---

## **5. `refreshMarkPrices(signal?)`**

**Input:**

* `signal` *(optional)* — AbortSignal

**What it does:**

* If metadata is not loaded → calls `ensureLoaded()` first.
* Otherwise → fetches **only mark prices**, no metadata.
* Updates the cached `coinToMarkPx` values.

### **Example: Updating prices**

Before:

```
BTC: 24000
ETH: 2400
```

After refresh:

```
BTC: 24320
ETH: 2421
```

**Output:**

* None (updates cache)