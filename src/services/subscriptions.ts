import type { SubscriptionClient } from "@nktkas/hyperliquid";
import type { CopyTradingConfig } from "../config/index.js";
import type { LeaderState } from "../domain/leaderState.js";
import type { Logger } from "../utils/logger.js";

export class SubscriptionService {
  /**
   * @param subscriptionClient - Hyperliquid WebSocket subscription client
   * @param config - Copy trading configuration
   * @param leaderState - Leader state store to update
   * @param onLeaderFill - Optional callback to trigger on each fill event
   * @param log - Logger instance
   */
  constructor(
    private readonly client: SubscriptionClient,
    private readonly config: CopyTradingConfig,
    private readonly leaderState: LeaderState,
    private readonly onUpdate: () => Promise<void>,
    private readonly log: Logger,
  ) {}

  /**
   * Starts WebSocket subscription to leader fills.
   * No-op if already subscribed.
   */
  async start() {
    this.log.info("Starting leader subscriptions", {
      leader: this.config.leaderAddress,
    });

    // FIX: Pass object { user: address } instead of just the address string
    await this.client.userFills({ user: this.config.leaderAddress }, (event) => {
      
      // --- LOGGING FOR DEBUGGING ---
      if (event.fills && event.fills.length > 0) {
        const firstFill = event.fills[0]!;
        this.log.info("🚨 LEADER TRADED! 🚨", {
          count: event.fills.length,
          coin: firstFill.coin,
          side: firstFill.side,
          size: firstFill.sz,
          price: firstFill.px
        });
      }
      // -----------------------------

      if (event.isSnapshot) {
        this.log.debug("Received initial fill snapshot");
        return;
      }

      if (event.fills.length > 0) {
        try {
          // 2. Update Internal State
          this.leaderState.handleFillEvent(event);
          
          // --- NEW LOG HERE ---
          this.log.info("⚡ Triggering Trade Executor (onUpdate)...");
          // --------------------

          // 3. Trigger the trade sync
          void this.onUpdate();
        } catch (err) {
          this.log.error("Failed to handle leader fill event", { error: err });
        }
      }
    });
  }

  async stop() {
    this.log.info("Stopping subscriptions");
    // No explicit unsubscribe needed as SDK handles it on transport close
  }
}
