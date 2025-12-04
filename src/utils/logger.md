# `logger.ts` — Short Function Documentation

A simple structured logger with level filtering controlled by `LOG_LEVEL`.

---

## **1. `log(level, message, meta?)` (internal function)**

**Inputs:**

* `level`: `"debug" | "info" | "warn" | "error"`
* `message`: human-readable log message
* `meta` *(optional)*: additional structured fields

**What it does:**

1. Checks whether the log level meets the minimum required threshold (`LOG_LEVEL`).
2. Constructs a timestamped log entry:

   ```
   [2024-05-01T12:00:00.000Z] [INFO]  { message: "...", meta: {...} }
   ```
3. Sends the message to the appropriate console method:

   * debug → `console.log`
   * info → `console.info`
   * warn → `console.warn`
   * error → `console.error`

**Output:**

* None (writes to console)

---

## **2. `logger.debug(message, meta?)`**

**What it does:**

* Logs detailed diagnostic information.
* Only shown when `LOG_LEVEL=debug`.

---

## **3. `logger.info(message, meta?)`**

**What it does:**

* Logs normal operational events (startup, sync cycle, metadata load).
* Default log level if `LOG_LEVEL` is not set.

---

## **4. `logger.warn(message, meta?)`**

**What it does:**

* Logs recoverable issues, such as:

  * Skipped order
  * Minor API inconsistencies
  * Partial failures

---

## **5. `logger.error(message, meta?)`**

**What it does:**

* Logs serious failures:

  * API errors
  * Order execution failures
  * Unexpected exceptions

---

## **6. `Logger` type alias**

**What it does:**

* Represents the shape of your logger object.
* Used for dependency injection into classes.