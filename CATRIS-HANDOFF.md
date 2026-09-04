# CATRIS HANDOFF — 5 Sep 2026

Paste this whole file at the start of a new Grok chat so the project is fully remembered.

Owner chats in **Turkish**. Product copy, site, contracts, and X are **English**.

**Do not** put secrets in chat. A GitHub classic PAT was pasted in an earlier session — **rotate it**. Never store private keys or PATs in this file or in the repo.

---

## 0) Paste-this prompt for a new Grok

You are continuing **Catris ($CATRIS)** — original-sprite cat tetris DApp on Robinhood Chain, launching on letscash.fun.

Repo: https://github.com/catrisXYZ/catris (branch `main`)
Live: https://www.catris.xyz
Stack: TanStack Start + React 19 + Tailwind v4 + Vite + Nitro → Vercel project `catris`.
Game well: 10×20, original js13k cat SVG sprites, overflow drawImage (N=35 / cell 30).
Launchpad: letscash.fun (NOT PONS). Trade tax **1%** (0.7% creator / 0.3% platform). Creator stream **must** go to `CatrisVault`, never an EOA.
Canonical contracts: only `CatrisVault.sol` + `CatrisBoard.sol`. Do not deploy Treasury/Arena/Rewards.
Keeper settles **previous** epoch (`currentEpoch - 1`) and vault `harvest()` calls `hook.claim(poolId)`.
Community TG: https://t.me/CatrisRH — X: https://x.com/catrisXYZ
Owner language: Turkish. Keep site/X in English.

Read `/workspace/artifacts/CATRIS-HANDOFF.md` or this file if present, then continue the current task. Do not reinvent PONS, 3% tax, or weekly seasons.

---

## 1) What it is

**Catris** is “Tetris with cats.” Original cat tetromino drawings (head / body / tail / legs) from a js13kGames HTML game, rebuilt as a Robinhood Chain DApp.

Tagline / slogan: **Tetris with cats**
Longer line: *The cats always land.* / *Tax feeds the litter.*
Ticker: **$CATRIS**
Chain: **Robinhood Chain, id 4663**
Launch: **letscash.fun** — Uniswap v4 pool, LP locked forever, no bonding curve.

Every trade pays **1% in ETH**. Creator share **0.7%** streams to a **vault contract**. Vault splits every **15 minutes**:

| Slice | Bucket | Who |
|---|---|---|
| 60% | `prizeWei` | epoch top score (payout capped at 80% of bucket) |
| 30% | `dripWei` | $CATRIS holders, merkle proof |
| 10% | `teamWei` | `teamWallet.withdrawTeam()` |

**Hard rule:** tax never sits on a personal wallet.

---

## 2) Identities and URLs

| Surface | Value |
|---|---|
| Site | https://catris.xyz · https://www.catris.xyz |
| GitHub org | https://github.com/catrisXYZ |
| Repo | https://github.com/catrisXYZ/catris |
| Vercel | https://vercel.com/catris |
| X | https://x.com/catrisXYZ · handle `catrisXYZ` |
| TG community | https://t.me/CatrisRH · `@CatrisRH` |
| TG announce (older) | https://t.me/catrisXYZ |
| Launch | https://letscash.fun/launch |
| Launch docs | https://letscashfun.com/docs |
| Explorer | https://robinhoodchain.blockscout.com |
| RPC | https://rpc.mainnet.chain.robinhood.com |

X name suggestion used: **Catris**
X bio used: `Tetris with cats. 15-minute pots on Robinhood Chain. $CATRIS`
(If bio was customized later, keep whatever is live on X.)

---

## 3) Live status (as of 5 Sep 2026 00:25 +03)

**Done**
- Site live on Vercel from GitHub `main`
- Full game on `/play` (web + mobile pads sticky under the well)
- Pages: `/` `/play` `/arena` `/treasury` `/docs`
- Docs rewritten as rules + mechanics + infra (Claude comparison removed)
- PONS branding fully replaced by letscash.fun
- OG/share description no longer says PONS
- Telegram community `@CatrisRH` in footer + vault metadata strings
- Vault rewritten for letscash `hook.claim(poolId)` via `harvest()`
- Keeper pays **epoch N−1**, skips already-settled, harvest try/catch
- Site copy: 1% tax / 0.7% creator stream
- Brand assets hosted on the site (see §8)

**Not done — launch still waiting on human wallets**
- `CatrisVault` and `CatrisBoard` **not deployed** (`VITE_*_CA` empty → zero address)
- Token not launched on letscash.fun
- `updateCreator` / `setPoolId` not done
- Keeper not hosted
- Vercel env `VITE_VAULT_CA` `VITE_BOARD_CA` `VITE_TOKEN_CA` `VITE_KEEPER_URL` not set

Need three EOAs that must not be mixed:

| Wallet | Job |
|---|---|
| Deployer | Remix deploy + `set*` |
| Team | constructor `_teamWallet`, later `withdrawTeam` |
| Keeper | `setBot`, ~0.1 ETH gas, private key only on the host |

---

## 4) Stack

- TanStack Start + React 19 + Tailwind v4 + Vite + Nitro
- viem wallet, Robinhood 4663
- Scores: Postgres (Neon in prod, PGLite local)
- Auth: existing app-builder session gates (not the product identity)
- Contracts: Solidity **0.8.24**, optimizer **200**, no OpenZeppelin
- Keeper: Node, `public/keeper/epoch-bot.mjs` + `public/keeper/package.json`
- Vercel preset: **Other** (not the TanStack template). Root of `catrisXYZ/catris`.

Routes (`src/routes/`):

| Path | Page |
|---|---|
| `/` | Home + hero well |
| `/play` | Live game |
| `/arena` | 15-min board + all-time |
| `/treasury` | Vault copy + hook tab + addresses |
| `/docs` | Rules, mechanics, contracts, keeper env |

Canonical chain constants: `src/lib/chain.ts`

```
LETSCASH.factory  0x5bd1Fbe78a78fe8236fa00CF48fbEBA74ae34661
LETSCASH.hook     0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC
CATRIS.creatorTaxBps = 100   // 1%
```

PONS object is leftover/deprecated. Do not use `feeEscrow 0xd3AF…`.

---

## 5) Game

Source of sprites: original js13k `index.html` (also in `attachments/index.html`).
Painter: `src/lib/game/cats.ts` + `render.ts` + `engine.ts` + `pieces.ts`.

Well: **10 cols × 20 visible rows**, 2 hidden spawn rows.
Guideline-feel: 7-bag, DAS 160ms, ARR 38ms, lock delay 520ms / 15 resets, ghost, hold, soft drop gravity 18.

**Pieces (original colors)**

| Name | Color | Anatomy |
|---|---|---|
| I | `#ff6666` | head body body tail |
| O | `#0044ff` | head/body · legs/tail |
| T | `#99ff99` | T |
| L | `#ffcc66` | L |
| J | `#ff7b00` | J |
| S | `#f266ff` | S |
| Z | `#62cdff` | Z |
| Special | `#333333` | black cat |

**Specials** (`SpecialKind`): 1 UNROTATABLE, 2 UNMOVABLE, 3 HARD DROP (pounce). Overlay labels in-game.

**Overflow:** sprites drawn at `cell * 100/30`, offset `35/30 * cell` so ears and tails spill the cell. This is sacred — do not “fit sprites inside the square.”

**Score table** (× level): 1 line 100, 2=300, 3=500, 4=800 + combo×50×level. Overlay `LITTER CLEAR` on tetris, `TRIPLE` on 3. Game over copy: **Litter full**.

**Controls**
- Desktop: arrows / WASD, up/X rotate, space hard drop, C/shift hold, P pause
- Mobile: D-pad + rotate/drop/hold **sticky under the well** (not below the fold). `/play` uses `wellSlotRef` + ResizeObserver so the canvas fits the viewport.

Off-chain scores go to Postgres. On-chain scores: wallet `personal_sign` of

```
Catris score v1:${player.toLowerCase()}:${score}:${lines}:${nonce}
```

Keeper verifies EIP-191, then `board.submitScore`. Players pay **no gas**.

---

## 6) Contracts (launch pair)

Remix downloads (also in repo):

- https://www.catris.xyz/contracts/CatrisVault.sol
- https://www.catris.xyz/contracts/CatrisBoard.sol
- https://www.catris.xyz/contracts/README.md
- https://www.catris.xyz/keeper/epoch-bot.mjs

**Do not deploy** `CatrisTreasury.sol` `CatrisArena.sol` `CatrisRewards.sol`.

### CatrisVault

Constructor: `CatrisVault(teamWallet)`. `owner = msg.sender`.

| Fn | Who | What |
|---|---|---|
| `harvest()` | bot/owner | `HOOK.claim(poolId)` as the vault (creator-only). Empty tab is try/catch no-op. ETH hits `receive()`. |
| `receive()` | anyone sending ETH | split 60/30/10 immediately. **Not** `nonReentrant` (harvest would deadlock). |
| `settleEpoch(epochId, merkleRoot, winner, prize)` | bot | pay winner, set drip root. Prize cannot exceed 80% of `prizeWei`. |
| `claimDrip(amount, proof)` | holder | merkle; leaf `keccak256(abi.encodePacked(addr, amount))` |
| `withdrawTeam()` | `teamWallet` only | dump `teamWei` |
| `setBot` `setTeamWallet` `setPoolId` `setTokenCA` `setMetadata` | owner | wiring |
| `transferOwnership` / `acceptOwnership` | two-step | |

Hook constant: `0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC`

letscash (creator-only after vault owns the stream):

```
hook.pending(poolId)
hook.tab(poolId)
hook.sweep(poolId)
hook.claim(poolId)                 // vault.harvest() does this
hook.updateCreator(poolId, addr)   // current recipient only
```

### CatrisBoard

No constructor args. `epochId = block.timestamp / 15 minutes` (global clock).

| Fn | Who | What |
|---|---|---|
| `submitScore(player, score, lines, nonce)` | bot | nonce one-shot; keeps best per player per epoch; updates leader |
| `markSettled(epochId)` | vault/bot/owner | flag only — does **not** freeze scores |
| `getEpochWinner` `getCurrentLeader` `epochs(id)` | view | |

### Keeper (`public/keeper/epoch-bot.mjs`)

Every 15 min + 5s:

1. `vault.harvest()` (ignore revert)
2. `epochId = currentEpoch() - 1`
3. skip if `epochs(epochId).settled`
4. build drip merkle from recent token Transfers + balances (sortPairs tree)
5. `winnerPrize = prize * 80 / 100`
6. `settleEpoch` then `markSettled`

Env: `RPC_URL` `BOT_PRIVATE_KEY` `VAULT_CA` `BOARD_CA` `TOKEN_CA` `PORT` `ALLOW_ORIGIN=https://www.catris.xyz`

HTTP: `POST /submit-score` · `GET /merkle-proof?player=` · `GET /status`

---

## 7) Launch steps (do in this order)

Compiler 0.8.24, 200 runs, network Robinhood 4663.

1. Deploy `CatrisVault(teamWallet)` → `VAULT_CA`. Verify on Blockscout.
2. Deploy `CatrisBoard()` → `BOARD_CA`. Verify.
3. Vault: `setBot(KEEPER_EOA)`  
   `setMetadata("https://catris.xyz", "catrisXYZ", "https://github.com/catrisXYZ", "https://t.me/CatrisRH")`
4. Board: `setBot(KEEPER_EOA)` `setVault(VAULT_CA)`
5. letscash.fun/launch  
   Name **Catris** · Symbol **CATRIS** · Image `https://www.catris.xyz/token-logo.jpg`  
   Site / X / TG as above · fee **1%** (form is fixed) · pair ETH  
   Token address must end in **`cc`**. Save `TOKEN_CA` + `poolId`.
6. Launch wallet: `hook.updateCreator(poolId, VAULT_CA)`
7. Vault: `setPoolId(poolId)` `setTokenCA(TOKEN_CA)`
8. Vercel env + redeploy: `VITE_VAULT_CA` `VITE_BOARD_CA` `VITE_TOKEN_CA` `VITE_KEEPER_URL`
9. Host keeper, fund 0.1 ETH.
10. Smoke: small trade → `harvest` increases vault → play + sign score → wait 15 min → winner paid.

letscash factory salt is bound to sender; token stamp `cc`.

If someone launched with an EOA as creator: that EOA calls `updateCreator`, then send any already-claimed ETH to the vault (`receive` splits).

---

## 8) Design system

Fonts: **Fraunces** italic = display (`Catris` wordmark). **Figtree** = UI.
Colors (`src/styles.css`):

```
bg        #100e0c
surface   #1a1714
elevated  #24201c
fg        #f3ead8
muted     #9a9084
subtle    #6f675e
accent    #e07a5f   (terracotta)
well      #140f0c
```

Frame: terracotta `#c45c3e` + cream `#f3ead8` bezel around the well. Never 3D clay cats — always the 2D game sprites.

**Hosted assets (after Vercel)**

| File | Use |
|---|---|
| `/token-logo.jpg` | Square framed well, Catris + Tetris with cats inside. letscash image URL + token logo. |
| `/dex-banner.jpg` | 1500×500. Three 10-col wells, slogan only: *Tetris with cats*. X header + Dexscreener. |
| `/cover-52.jpg` | 2160×864 (5:2) X article cover |
| `/og.jpg` | Share card (50:11-ish) |
| `/favicon.svg` | Favicon |

Workspace copies also live under `/workspace/artifacts/` (`catris-square-cover.jpg`, `catris-banner-1500x500.jpg`, `catris-x-cover-52.jpg`, `catris-x-logo.jpg`, `CATRIS-X-ARTICLE.md`).

X article draft: `artifacts/CATRIS-X-ARTICLE.md` — **still says 3% in one paragraph; change to 1% / 0.7% before posting.**

---

## 9) Copy bank (English, keep as-is)

- Catris
- Tetris with cats
- $CATRIS
- Well 10×20
- Litter full
- Litter clear
- 15-minute pots. One winner.
- Tax feeds the litter.
- Vault, not a wallet.
- Play. Score. Earn. The cats always land.

Team TG (already sent, 3 people): zincir / launch / saha split. Community is `@CatrisRH`.

---

## 10) What Grok already fixed this session (do not re-break)

- Play well was too tall; now viewport-fitted. Mobile pads sticky under well.
- Share/Telegram preview still said PONS → `site.json` + every surface → letscash.
- Vault `claimFromEscrow` pointed at PONS `0xd3AF…` → replaced with `harvest()` → letscash hook.
- Keeper settled **current** empty epoch → now **previous** epoch + settled guard.
- Fee marketing 3% (old PONS / old letscash tiers) → **1%** to match live letscash launch form/docs. If the letscash UI later shows selectable 3/5/10 again, ask the owner before changing copy.
- Token logo: square, text **inside** the frame, original sprites.
- Dex/X banner: no system copy, slogan only, three different 10-col concepts, same sprites.

---

## 11) Owner preferences

- Turkish in chat, short answers, no lecture.
- English on the website and on X.
- Original js13k cats are the brand. No 3D, no AI-redrawn faces.
- Tax to a **contract vault**, never EOA.
- Don’t invent extra features. Launch first.
- Vercel Application Preset: **Other**.
- Three-person team. Community TG `@CatrisRH`.

---

## 12) Next message the owner likely wants

“Remix’e basıyoruz” — walk vault then board then wiring, collect `VAULT_CA` `BOARD_CA` team/keeper addresses.

Or asset tweaks (banner/logo) using the **game sprites**, not Imagine-clay.

Or post-ready X article with 1% tax and 5:2 cover `cover-52.jpg`.

---

## 13) Key files

```
src/lib/chain.ts
src/lib/game/{cats,pieces,engine,render,types}.ts
src/routes/{index,play,arena,treasury,docs}.tsx
src/components/game/{CatrisBoard,HeroWell,PageWell}.tsx
contracts/CatrisVault.sol
contracts/CatrisBoard.sol
public/contracts/*          (Remix downloads, must match contracts/)
public/keeper/epoch-bot.mjs
src/lib/og/site.json
src/styles.css
```

Repo HEAD at handoff time: `6332b9e` (slogan-only 1500×500 banner). Newer commits may exist — `git log` on `main`.
