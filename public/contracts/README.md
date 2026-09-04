# Catris helpers — download & paste into Remix

Compiler: Solidity **0.8.24**, optimization **200** runs. Network: Robinhood Chain **4663**.

1. Deploy `CatrisVault.sol` with constructor `_teamWallet`.
2. Deploy `CatrisBoard.sol` (no args).
3. Vault: `setBot(keeperEOA)` · Board: `setBot(keeperEOA)`, `setVault(VAULT_CA)`.
4. Launch on [letscash.fun/launch](https://letscash.fun/launch): name Catris, symbol CATRIS, fee **3%**, pair ETH.
5. Hand the creator stream to the **vault address** (`updateCreator`).
6. Vault: `setTokenCA(TOKEN_CA)`.

Fee split: 60% epoch prize / 30% holder drip / 10% team.

Full playbook: `/docs`. Keeper: `/keeper/epoch-bot.mjs`.
