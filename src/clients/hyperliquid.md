# `hyperliquid.ts` — Short Function Documentation

## **1. `isTestnet(environment)`**

**Input:**

* `environment` — `"testnet"` or `"mainnet"`

**What it does:**

* Checks whether the environment is `"testnet"`.

**Output:**

* Returns `true` if testnet, otherwise `false`.

---

## **2. `NodeWebSocketWrapper` (class inside createHyperliquidClients)**

**Input:**

* `url`, `protocols`

**What it does:**

* Wraps the Node.js `ws` WebSocket to behave like a browser WebSocket.
* Ensures compatible `binaryType` and event handling for the Hyperliquid SDK.

**Output:**

* A DOM-compatible WebSocket instance used by subscriptions.

---

## **3. `createHyperliquidClients(config)`**

**Input:**

* `config` — contains environment, private key, vault address, etc.

**What it does:**

* Creates all necessary Hyperliquid clients:

  * HTTP transport
  * WebSocket transport
  * Info client (read-only)
  * Exchange client (order placement)
  * Subscription client (real-time streams)
* Converts follower private key into an account.
* Decides whether to trade using a wallet address or vault address.

**Output:**

* Returns a `HyperliquidClients` object containing:
 * infoClient – Read-only API client for fetching positions, fills, market data, and metadata.
 * exchangeClient – Trading client used to place orders, cancel orders, and manage positions.
 * subscriptionClient – WebSocket client for receiving real-time updates (fills, trades, orderbook events).
 * httpTransport – Underlying HTTP connection used by the Info and Exchange clients.
 * wsTransport – Underlying WebSocket transport powering real-time subscriptions.
 * followerAccount – Viem signer account created from the follower’s private key (used to sign orders).
 * followerTradingAddress – The address the bot trades from (wallet address or vault address if selected).