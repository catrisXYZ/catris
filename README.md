# Catris ($CATRIS)

Original-sprite cat tetris on **Robinhood Chain (4663)**. Tetris with cats.
Fifteen-minute pots. Treats land in a vault — never an EOA.

- Play: [catris.xyz](https://catris.xyz)
- House: [catris.xyz/house](https://catris.xyz/house)
- X: [@catrisXYZ](https://x.com/catrisXYZ)
- Door: [letscash.fun](https://letscash.fun/launch)

## The house

| Room | Contract | Launch |
|---|---|---|
| The Bowl | `CatrisVault.sol` | deploy |
| The Well | `CatrisBoard.sol` | deploy |
| Pounce | prize bucket in the Bowl | inside |
| Cream | holder drip in the Bowl | inside |
| Whiskers | team slice in the Bowl | inside |

`CatrisTreasury.sol`, `CatrisArena.sol`, `CatrisRewards.sol` are weekly PONS drafts. Do not deploy them.

## Stack

TanStack Start + React 19. Remix-ready Solidity 0.8.24 in [`contracts/`](./contracts).
Keeper: [`public/keeper/`](./public/keeper). Playbook: `/docs` and `/house`.
