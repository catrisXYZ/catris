# Catris helpers — download & paste into Remix

Compiler: Solidity **0.8.24**, optimization **200** runs. Network: Robinhood Chain **4663**.

1. Deploy `CatrisVault.sol` with constructor `_teamWallet`.
2. Deploy `CatrisBoard.sol` (no args).
3. Vault: `setBot(keeperEOA)` · Board: `setBot(keeperEOA)`, `setVault(VAULT_CA)`.
4. PONS create: tax 3%, `creatorFeeRecipient` = **vault address**, buyback off.
5. Vault: `setTokenCA(TOKEN_CA)`.

Fee split: 60% epoch prize / 30% holder drip / 10% team.

Full playbook: `/docs`. Keeper: `/keeper/epoch-bot.mjs`.
