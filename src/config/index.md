# `config/index.ts` — Short Function Documentation

## **1. `requireEnv(key)`**

**Input:**

* `key` — the name of an environment variable

**What it does:**

* Reads the environment variable.
* Throws an error if it is missing.

**Output:**

* Returns the variable’s string value.

---

## **2. `optionalNumberEnv(key, fallback)`**

**Input:**

* `key` — environment variable name
* `fallback` — number to use if the variable is not set

**What it does:**

* Reads the environment variable.
* If missing → returns the fallback value.
* If present → parses it into a number.
* Throws an error if parsing fails.

**Output:**

* A valid number (parsed or fallback).

---

## **3. `optionalBooleanEnv(key, fallback)`**

**Input:**

* `key` — environment variable name
* `fallback` — boolean to use if not set

**What it does:**

* Reads the environment variable.
* Converts recognized true-like strings (`"1"`, `"true"`, `"yes"`, `"on"`) into `true`.
* Otherwise returns `false`.
* If unset → returns fallback.

**Output:**

* A boolean value.

---

## **4. `loadConfig()`**

**Input:**

* None (reads directly from `process.env`)

**What it does:**

* Loads all environment variables needed for the bot.
* Validates:

  * network environment
  * required keys (leader, private key)
  * optional vault address
* Loads all risk parameters using helper functions.
* Loads all interval and feature flags.
* Builds the final configuration object used by the bot.

**Output:**

* A fully validated `CopyTradingConfig` object containing:

  * `environment`
  * `leaderAddress`
  * `followerPrivateKey`
  * optional `followerVaultAddress`
  * `risk` config
  * all intervals
  * flags like `websocketAggregateFills`
