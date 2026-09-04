# Catris helpers — download & paste into Remix

Compiler: Solidity **0.8.24**, optimization **200** runs. Network: Robinhood Chain **4663**.

1. Deploy `CatrisVault.sol` (The Bowl) with constructor `_teamWallet` (Whiskers).
2. Deploy `CatrisBoard.sol` (The Well) — no args.
3. Bowl: `setBot(keeperEOA)` · Well: `setBot(keeperEOA)`, `setVault(BOWL_CA)`.
4. Launch on [letscash.fun/launch](https://letscash.fun/launch): name Catris, symbol CATRIS, pair ETH.
5. Hand the creator stream to the **Bowl** (`updateCreator(poolId, BOWL_CA)`).
6. Bowl: `setPoolId(poolId)`, `setTokenCA(TOKEN_CA)`.

Rooms inside the Bowl: Pounce (epoch prize) / Cream (holder drip) / Whiskers (crew).

Playbook: `/house` and `/docs`. Keeper: `/keeper/epoch-bot.mjs`.
