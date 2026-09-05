# Catris contracts — Robinhood Chain 4663

Remix-ready Solidity **0.8.24**, 200 runs. No OpenZeppelin imports.

## Opening pair

| Room | File | Role |
|---|---|---|
| The Bowl | `CatrisVault.sol` | Creator-stream recipient. Splits Pounce / Cream / Whiskers. |
| The Well | `CatrisBoard.sol` | 15-minute on-chain scoreboard. Keeper submits; players pay no gas. |

Pounce, Cream, and Whiskers are buckets on the Bowl — not separate deploys.

`CatrisTreasury.sol`, `CatrisArena.sol`, and `CatrisRewards.sol` are the earlier weekly PONS split. Do **not** deploy them.

## Flow

```
letscash.fun  (Uniswap v4, LP locked, creator stream on the hook)
        │
        │  updateCreator(poolId, Bowl)   ← never an EOA
        ▼
letscash hook     0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC
        │  Bowl.harvest() → hook.claim(poolId)
        ▼
CatrisVault
        ├── Pounce    prizeWei     epoch winner (capped)
        ├── Cream     dripWei      holders via merkle proof
        └── Whiskers  teamWei      teamWallet.withdrawTeam()
```

Hardening:

- empty hook tab does not revert
- `nonReentrant` on prize, drip, team
- two-step `transferOwnership` / `acceptOwnership`
- scores are EIP-191 `personal_sign`, verified in the keeper

## Remix order

1. `CatrisVault(whiskersWallet)` → Bowl
2. `CatrisBoard()` → Well
3. Bowl: `setBot(keeperEOA)`, `setMetadata("https://catris.xyz", "catrisXYZ", "https://github.com/catrisXYZ", "")`
4. Well: `setBot(keeperEOA)`, `setVault(BOWL_CA)`
5. Launch **CATRIS** on [letscash.fun](https://letscash.fun/launch)
   - Name `Catris`, symbol `CATRIS`, pair ETH
   - Image `https://www.catris.xyz/token-logo.jpg`
   - Then `updateCreator(poolId, BOWL_CA)`
6. Bowl: `setPoolId(poolId)`, `setTokenCA(TOKEN_CA)`
7. Site env: `VITE_VAULT_CA`, `VITE_BOARD_CA`, `VITE_TOKEN_CA`, `VITE_KEEPER_URL`

RPC: `https://rpc.mainnet.chain.robinhood.com`  
Explorer: https://robinhoodchain.blockscout.com  
Factory: `0x5bd1Fbe78a78fe8236fa00CF48fbEBA74ae34661`  
Hook: `0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC`

Keeper: `/public/keeper/epoch-bot.mjs`. Fund ~0.1 ETH for gas.

If you launched with an EOA as creator, that EOA calls `hook.updateCreator(poolId, bowl)`, then send any already-claimed ETH to the Bowl (`receive` splits).
