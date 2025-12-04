# `math.ts` — Short Function Documentation

Lightweight numeric helpers used throughout the trading engine.

---

## **1. `toFloat(value)`**

**Inputs:**

* `value`: string, number, bigint, or null/undefined

**What it does:**

* Converts the input into a JavaScript `number`.
* Handles:

  * numbers directly
  * bigint → number
  * strings → parsed number
  * null/undefined → `0`
* Throws an error if a string cannot be parsed.

**Example:**

```
toFloat("2.5") → 2.5
toFloat(undefined) → 0
toFloat("abc") → throws Error
```

**Output:**

* A valid floating-point number.

---

## **2. `round(value, decimals = 6)`**

**Inputs:**

* `value`: number to round
* `decimals`: number of decimals (default: 6)

**What it does:**

* Multiplies by 10^decimals
* Applies `Math.round()`
* Divides back down
* Used for trimming floating-point precision noise.

**Example:**

```
round(1.23456789, 4) → 1.2346
round(5.1234567) → 5.123457
```

**Output:**

* Rounded number.

---

## **3. `clamp(value, min, max)`**

**Inputs:**

* `value`, `min`, `max`

**What it does:**

* Ensures the value stays within the range `[min, max]`.

**Example:**

```
clamp(10, 0, 5) → 5
clamp(-2, 0, 5) → 0
clamp(3, 0, 5) → 3
```

**Output:**

* A number between min and max.

---

## **4. `safeDivide(numerator, denominator, fallback = 0)`**

**Inputs:**

* `numerator`
* `denominator`
* `fallback` (default = 0)

**What it does:**

* If denominator is effectively zero → returns fallback
* Otherwise → returns `numerator / denominator`
* Used to avoid NaN issues.

**Example:**

```
safeDivide(10, 2) → 5
safeDivide(10, 0) → 0   (fallback)
safeDivide(10, 0, 999) → 999
```

**Output:**

* Division result or fallback.
