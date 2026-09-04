# Catris contracts — Robinhood Chain 4663

Remix-ready Solidity **0.8.24**, 200 runs. No OpenZeppelin imports.

Canonical pair:

| Contract | Role |
|---|---|
| `CatrisVault.sol` | letscash.fun creator-stream recipient. Splits 60 / 30 / 10. |
| `CatrisBoard.sol` | 15-minute on-chain scoreboard. Keeper submits; players pay no gas. |

`CatrisTreasury.sol`, `CatrisArena.sol`, and `CatrisRewards.sol` are the earlier weekly split. Do **not** deploy them for launch.

## Fee path

```
letscash.fun launch  (3% trade tax, Uniswap v4 pool, LP locked)
        │
        │  updateCreator(poolId, CatrisVault)   ← never an EOA
        ▼
letscash.fun hook     0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC
        │  hook.claim(poolId)  (creator / keeper)
        ▼
CatrisVault       split 60 / 30 / 10
        ├── 60%  prizeWei     epoch winner (up to 80% of the bucket)
        ├── 30%  dripWei      $CATRIS holders via merkle proof
        └── 10%  teamWei      teamWallet.withdrawTeam()
```

Hardening vs the first draft:

- vault receive / harvest does **not** revert on an empty stream
- `nonReentrant` on prize, drip, team
- two-step `transferOwnership` / `acceptOwnership`
- player signatures are EIP-191 `personal_sign`, verified in the keeper (not raw `ecrecover` of a packed hash)

## Deploy order (Remix)

1. `CatrisVault(teamWallet)` → `VAULT_CA`
2. `CatrisBoard()` → `BOARD_CA`
3. Vault: `setBot(keeperEOA)`, `setMetadata("https://catris.xyz", "catrisXYZ", "https://github.com/catrisXYZ", "https://t.me/CatrisRH")`
4. Board: `setBot(keeperEOA)`, `setVault(VAULT_CA)`
5. Launch **CATRIS** on [letscash.fun](https://letscash.fun/launch)
   - Name `Catris`, symbol `CATRIS`, fee **3%**, pair ETH
   - After launch: `updateCreator` so the stream pays **VAULT_CA**
6. Vault: `setTokenCA(TOKEN_CA)`
7. Site env: `VITE_VAULT_CA`, `VITE_BOARD_CA`, `VITE_TOKEN_CA`, `VITE_KEEPER_URL`

RPC: `https://rpc.mainnet.chain.robinhood.com`  
Explorer: https://robinhoodchain.blockscout.com  
Factory: `0x5bd1Fbe78a78fe8236fa00CF48fbEBA74ae34661`  
Hook: `0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC`

Keeper source: `/public/keeper/epoch-bot.mjs` (Railway / any Node host). Fund the keeper EOA with ~0.1 ETH.

If you launched with an EOA as creator, call `hook.updateCreator(poolId, vault)` from that EOA, then send any already-claimed ETH to the vault (`receive` splits).
