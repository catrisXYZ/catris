# Catris contracts — Robinhood Chain 4663

Remix-ready Solidity **0.8.24**, 200 runs. No OpenZeppelin imports.

Canonical pair:

| Contract | Role |
|---|---|
| `CatrisVault.sol` | PONS `creatorFeeRecipient`. Splits 60 / 30 / 10. |
| `CatrisBoard.sol` | 15-minute on-chain scoreboard. Keeper submits; players pay no gas. |

`CatrisTreasury.sol`, `CatrisArena.sol`, and `CatrisRewards.sol` are the earlier weekly split. Do **not** deploy them for launch.

## Fee path

```
PONS v2 launch  (creatorTaxBps = 300, buyback off)
        │
        │  creatorFeeRecipient = CatrisVault   ← never an EOA
        ▼
PONS Fee Escrow   0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e
        │  claimFromEscrow()  (keeper, every epoch; no-op if empty)
        ▼
CatrisVault       split 60 / 30 / 10
        ├── 60%  prizeWei     epoch winner (up to 80% of the bucket)
        ├── 30%  dripWei      $CATRIS holders via merkle proof
        └── 10%  teamWei      teamWallet.withdrawTeam()
```

Hardening vs the first draft:

- `claimFromEscrow` does **not** revert on an empty escrow
- `nonReentrant` on prize, drip, team, escrow
- two-step `transferOwnership` / `acceptOwnership`
- player signatures are EIP-191 `personal_sign`, verified in the keeper (not raw `ecrecover` of a packed hash)

## Deploy order (Remix)

1. `CatrisVault(teamWallet)` → `VAULT_CA`
2. `CatrisBoard()` → `BOARD_CA`
3. Vault: `setBot(keeperEOA)`, `setMetadata("https://catris.xyz", "catrisXYZ", "https://github.com/catrisXYZ", "https://t.me/catrisXYZ")`
4. Board: `setBot(keeperEOA)`, `setVault(VAULT_CA)`
5. Launch **CATRIS** on [PONS v2](https://www.ponsfamily.com/launchpad/create)
   - Name `Catris`, symbol `CATRIS`, tax **3.00%**, fee recipient **VAULT_CA**, buyback off, pair ETH
6. Vault: `setTokenCA(TOKEN_CA)`
7. Site env: `VITE_VAULT_CA`, `VITE_BOARD_CA`, `VITE_TOKEN_CA`, `VITE_KEEPER_URL`

RPC: `https://rpc.mainnet.chain.robinhood.com`  
Explorer: https://robinhoodchain.blockscout.com  
Factory: `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`

Keeper source: `/public/keeper/epoch-bot.mjs` (Railway / any Node host). Fund the keeper EOA with ~0.1 ETH.

If you already launched with an EOA as fee recipient, call PONS factory `transferCreatorFeeRecipient(token, vault)`, then `claim()` on the escrow from the old EOA and send the ETH to the vault (`receive` splits).
