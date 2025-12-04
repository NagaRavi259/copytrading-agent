#!/usr/bin/env node
/**
 * Hyperliquid Copy Trading Agent
 *
 * This agent automatically replicates trades from a leader account to a follower account
 * on Hyperliquid DEX, with configurable risk management and position scaling.
 *
 * Key features:
 * - Real-time WebSocket subscriptions to leader fills
 * - Periodic reconciliation to ensure state consistency
 * - Risk controls: copy ratio, max leverage, max notional, slippage limits
 * - Support for both direct wallet trading and vault delegation
 */

import { setTimeout as delay } from "node:timers/promises";
import * as dotenv from "dotenv";
import { loadConfig } from "./config/index.js";
import { createHyperliquidClients } from "./clients/hyperliquid.js";
import { LeaderState } from "./domain/leaderState.js";
import { FollowerState } from "./domain/followerState.js";
import { MarketMetadataService } from "./services/marketMetadata.js";
import { TradeExecutor } from "./services/tradeExecutor.js";
import { Reconciler } from "./services/reconciler.js";
import { SubscriptionService } from "./services/subscriptions.js";
import { logger } from "./utils/logger.js";

/**
 * Main entry point for the copy trading agent.
 * Initializes all services, starts WebSocket subscriptions, and runs the sync loop.
 */
async function main() {
  try {
    // Load environment variables from .env if present
    dotenv.config();
    // Load configuration from environment variables
    const config = loadConfig();

    // Initialize Hyperliquid API clients (HTTP + WebSocket)
    const clients = createHyperliquidClients(config);

    // --- CRITICAL FIX: FORCE MAIN WALLET ADDRESS ---
    // We check process.env directly to bypass any config loading issues
    const envPublicAddress = process.env.FOLLOWER_PUBLIC_ADDRESS;
    const actualFollowerAddress = (envPublicAddress && envPublicAddress.startsWith("0x")) 
      ? envPublicAddress as `0x${string}`
      : clients.followerTradingAddress;

    // Log the decision
    console.log("\n========================================");
    console.log("🕵️ ADDRESS CONFIGURATION");
    console.log("========================================");
    console.log(`🔑 Signer (API Key):   ${clients.followerTradingAddress}`);
    console.log(`💰 Wallet (Funds):     ${actualFollowerAddress}`);
    if (clients.followerTradingAddress === actualFollowerAddress) {
        console.log("⚠️  Note: Signer and Wallet are the same. Ensure this key has funds.");
    } else {
        console.log("✅  Correct: Signing with Agent, checking Main Wallet for funds.");
    }
    console.log("========================================\n");
    // -----------------------------------------------

    // 3. Setup State
    const leaderState = new LeaderState();
    const followerState = new FollowerState();

    // Service to fetch and cache market metadata (decimals, max leverage, etc.)
    const metadataService = new MarketMetadataService(clients.infoClient, logger);

    // Core service that computes deltas and executes follower orders
    const tradeExecutor = new TradeExecutor({
      exchangeClient: clients.exchangeClient,
      infoClient: clients.infoClient,
      followerAddress: actualFollowerAddress, // <--- USE FORCED ADDRESS
      leaderState,
      followerState,
      metadataService,
      risk: config.risk,
      log: logger,
    });

    // Periodic reconciliation service to sync full account state from Hyperliquid API
    const reconciler = new Reconciler(
      clients.infoClient,
      config,
      leaderState,
      followerState,
      actualFollowerAddress, // <--- USE FORCED ADDRESS
      logger,
    );

    // WebSocket subscription service for real-time leader fill updates
    const subscriptions = new SubscriptionService(
      clients.subscriptionClient,
      config,
      leaderState,
      () => tradeExecutor.syncWithLeader(),
      logger,
    );

    // --- STARTUP SEQUENCE ---
    logger.info(`Starting Bot in [${config.environment.toUpperCase()}] mode`);
    logger.info(`Leader:   ${config.leaderAddress}`);

    // A. Connect to WebSocket
    await subscriptions.start();

    // B. Fetch Initial State
    logger.info("Fetching initial account state...");
    await reconciler.reconcileOnce();

    // C. Print Startup Balance
    const metrics = followerState.getMetrics();
    console.log("\n========================================");
    console.log("🚀 BOT LIVE & READY");
    console.log("========================================");
    console.log(`💵 Usable USDC:       $${metrics.withdrawableUsd.toFixed(2)}`);
    console.log(`📊 Account Equity:    $${metrics.accountValueUsd.toFixed(2)}`);
    console.log(`🎯 Copy Mode:         ${process.env.COPY_MODE === 'exact' ? 'EXACT MIRROR' : 'RATIO SCALING'}`);
    console.log("========================================\n");

    // D. Start Loops
    reconciler.start();

    /**
     * Background polling loop to periodically sync follower with leader.
     * This provides a fallback in case WebSocket events are missed.
     */
    const pollLoop = async () => {
      while (true) {
        await tradeExecutor.syncWithLeader().catch((error) => {
          logger.error("Periodic sync failed", { error });
        });
        await delay(config.refreshAccountIntervalMs);
      }
    };

    void pollLoop();

    /**
     * Graceful shutdown handler for SIGINT/SIGTERM signals.
     * Unsubscribes from WebSocket channels and closes connections cleanly.
     */
    const shutdown = async (signal: string) => {
      logger.warn(`Received ${signal}, shutting down`);
      await subscriptions.stop().catch((error) => logger.error("Failed to stop subscriptions cleanly", { error }));
      reconciler.stop();
      await clients.wsTransport.close().catch(() => undefined);
      process.exit(0);
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    logger.error("Fatal error in copy trading agent", { error });
    process.exit(1);
  }
}

void main();
