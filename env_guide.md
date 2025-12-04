# Environment Configuration Guide (`.env`)

This document explains the configuration variables used in the `.env` file for the **Hyperliquid Copy Trading Agent**.

## 🌐 Network Configuration

### `HYPERLIQUID_ENVIRONMENT`
- **Value:** `testnet` or `mainnet`  
- **Description:** Determines which Hyperliquid server the bot connects to.

## 👤 Accounts Setup

### `LEADER_ADDRESS`
- **Value:** Public wallet address (starts with `0x...`)
- **Description:** The address of the trader you want to copy.

### `FOLLOWER_PRIVATE_KEY`
- **Value:** API agent private key (starts with `0x...`)
- **Description:** The private key used to sign transactions.

### `FOLLOWER_PUBLIC_ADDRESS`
- **Value:** Main wallet public address (starts with `0x...`)
- **Description:** The address of the wallet that holds the funds (USDC).

### `FOLLOWER_VAULT_ADDRESS` *(Optional)*
- **Status:** Commented out (`#`)
- **Description:** Used only if you are managing a Hyperliquid Vault.

## 🧠 Copy Trading Logic

### `COPY_MODE` *(Optional)*
- **Value:** `exact` or commented out  
- **Behavior:**
  - **`exact`:** *Mirror Mode.* If the leader buys 1 ETH, you buy 1 ETH. Ignores account size differences.
  - **Commented out:** *Ratio Mode*, which uses `COPY_RATIO`.

### `COPY_RATIO`
- **Value:** Number (e.g., `1.0`, `0.5`, `2.0`)
- **Description:** Multiplier for trade size relative to account equity  
- **Formula:**  ```(Your Equity / Leader Equity) * COPY_RATIO```
    - **Examples:**
    - `1.0`: Match the leader's risk percentage exactly.
    - `0.5`: Take half the leader’s risk.
    - `15.0`: Common on testnet to meet the $10 minimum trade size when copying large accounts.

## 🛡️ Risk & Safety

### `MAX_LEVERAGE`
- **Value:** Number (e.g., `50`)
- **Description:** Maximum leverage the bot may use.  
- **Impact:** If the leader uses 100x leverage, your bot caps it at (for example) 50x by reducing position size.

### `MAX_NOTIONAL_USD`
- **Value:** Number (e.g., `100000`)
- **Description:** Maximum dollar value for a single position.  
- **Impact:** Prevents accidentally opening oversized positions due to calculation errors.

### `MAX_SLIPPAGE_BPS`
- **Value:** Basis points (e.g., `100 = 1%`)
- **Description:** Allowed price movement between leader trade and your copied trade.  
- **Recommendation:** `100` (1%) for volatile markets or testnet.


## ⚙️ System Settings

### `RECONCILIATION_INTERVAL_MS`
- **Value:** Milliseconds (e.g., `60000` → 1 minute)
- **Description:** How often the bot performs a full “Safety Check” and corrects missed trades.

### `REFRESH_ACCOUNT_INTERVAL_MS`
- **Value:** Milliseconds (e.g., `5000` → 5 seconds)
- **Description:** How often the bot updates your balance and position data.

### `AGGREGATE_FILLS`
- **Value:** `true` or `false`
- **Description:** If `true`, merges multiple small fills into one log entry for cleaner output.

### `LOG_LEVEL`
- **Value:** `debug`, `info`, `warn`, `error`
- **Description:** Controls console log detail.  
- **Recommendation:** Use `debug` while testing to understand decisions (e.g., “Value < $10”).