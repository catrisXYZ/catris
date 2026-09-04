// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  CatrisVault
 * @notice Receives Pons v2 creator fees (3%) and distributes to:
 *         - Prize pool  (60%) → epoch winner paid in ETH
 *         - Holder drip (30%) → merkle-based claims for $CATRIS holders
 *         - Team        (10%) → team wallet
 *
 * @dev    Deploy this first. Use its address as `creatorFeeRecipient` when
 *         launching $CATRIS on Pons v2 factory:
 *         0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e  (Robinhood Chain 4663)
 *
 *         Fee Escrow: 0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e
 *         Call claimFromEscrow() periodically to pull accumulated fees.
 */

interface IFeeEscrow {
    function balanceOf(address recipient) external view returns (uint256);
    function claim() external;
}

contract CatrisVault {

    /* ─────────────────────────── Constants ─────────────────────────── */

    IFeeEscrow public constant FEE_ESCROW =
        IFeeEscrow(0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e);

    uint256 public constant PRIZE_BPS = 6000; // 60% — epoch game prize
    uint256 public constant DRIP_BPS  = 3000; // 30% — holder drip (merkle)
    uint256 public constant TEAM_BPS  = 1000; // 10% — team
    uint256 public constant EPOCH     = 15 minutes;

    /* ─────────────────────────── State ─────────────────────────── */

    // ETH buckets
    uint256 public prizeWei;
    uint256 public dripWei;
    uint256 public teamWei;

    // Current epoch drip merkle root
    bytes32 public currentMerkleRoot;
    // merkleRoot → player → claimed
    mapping(bytes32 => mapping(address => bool)) public claimed;

    // Total ETH ever received
    uint256 public totalReceived;

    // Access
    address public owner;
    address public bot;
    address public teamWallet;

    /* ─────────────────────────── Metadata ─────────────────────────── */

    string public SITE;
    string public X_HANDLE;
    string public GITHUB;
    string public TELEGRAM;
    string public TOKEN_CA;   // set after Pons v2 launch

    /* ─────────────────────────── Events ─────────────────────────── */

    event EthSplit(uint256 amount, uint256 prize, uint256 drip, uint256 team);
    event EscrowClaimed(uint256 amount);
    event EpochSettled(
        uint256 indexed epochId,
        address winner,
        uint256 prize,
        bytes32 merkleRoot
    );
    event DripClaimed(address indexed player, uint256 amount);
    event TeamWithdrawn(address to, uint256 amount);
    event BotSet(address bot);
    event TeamWalletSet(address wallet);

    /* ─────────────────────────── Modifiers ─────────────────────────── */

    modifier onlyOwner() {
        require(msg.sender == owner, "CatrisVault: not owner");
        _;
    }

    modifier onlyBot() {
        require(msg.sender == bot || msg.sender == owner, "CatrisVault: not bot");
        _;
    }

    /* ─────────────────────────── Constructor ─────────────────────────── */

    constructor(address _teamWallet) {
        owner      = msg.sender;
        teamWallet = _teamWallet;
    }

    /* ─────────────────────── Fee Collection ─────────────────────── */

    /**
     * @notice Pull creator fees from Pons v2 Fee Escrow.
     *         Call this after each sweep or on a schedule.
     *         Anyone can call — fees go to this vault, not the caller.
     */
    function claimFromEscrow() external {
        uint256 before   = address(this).balance;
        FEE_ESCROW.claim();
        uint256 received = address(this).balance - before;
        require(received > 0, "CatrisVault: nothing to claim");
        _split(received);
        emit EscrowClaimed(received);
    }

    /**
     * @notice Direct ETH deposits (keeper top-ups, future integrations).
     */
    receive() external payable {
        if (msg.value > 0) {
            _split(msg.value);
            emit EthSplit(msg.value,
                (msg.value * PRIZE_BPS) / 10_000,
                (msg.value * DRIP_BPS)  / 10_000,
                (msg.value * TEAM_BPS)  / 10_000
            );
        }
    }

    function _split(uint256 amount) internal {
        uint256 p = (amount * PRIZE_BPS) / 10_000;
        uint256 d = (amount * DRIP_BPS)  / 10_000;
        uint256 t = amount - p - d;   // remainder → team (avoids rounding dust)
        prizeWei += p;
        dripWei  += d;
        teamWei  += t;
        totalReceived += amount;
    }

    /* ─────────────────────── Epoch Settlement ─────────────────────── */

    /**
     * @notice Bot settles an epoch every 15 minutes.
     * @param  epochId      Block.timestamp / EPOCH at settlement time
     * @param  merkleRoot   Merkle root of {player → dripAmount} for this epoch
     * @param  winner       Top scorer — receives winnerPrize from prizeWei
     * @param  winnerPrize  ETH amount to pay winner (0 if no players this epoch)
     */
    function settleEpoch(
        uint256 epochId,
        bytes32 merkleRoot,
        address winner,
        uint256 winnerPrize
    ) external onlyBot {
        if (merkleRoot != bytes32(0)) {
            currentMerkleRoot = merkleRoot;
        }

        if (winner != address(0) && winnerPrize > 0) {
            require(winnerPrize <= prizeWei, "CatrisVault: prize > pool");
            prizeWei -= winnerPrize;
            (bool ok,) = payable(winner).call{value: winnerPrize}("");
            require(ok, "CatrisVault: prize transfer failed");
        }

        emit EpochSettled(epochId, winner, winnerPrize, merkleRoot);
    }

    /* ─────────────────────── Holder Drip Claims ─────────────────────── */

    /**
     * @notice Holder claims their ETH drip for the current epoch.
     * @param  amount  Their share according to the current merkle tree
     * @param  proof   Merkle proof from the keeper API
     */
    function claimDrip(uint256 amount, bytes32[] calldata proof) external {
        require(!claimed[currentMerkleRoot][msg.sender], "CatrisVault: already claimed");
        require(currentMerkleRoot != bytes32(0), "CatrisVault: no active epoch");
        require(amount <= dripWei, "CatrisVault: drip pool exhausted");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(_verifyMerkle(proof, currentMerkleRoot, leaf), "CatrisVault: invalid proof");

        claimed[currentMerkleRoot][msg.sender] = true;
        dripWei -= amount;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "CatrisVault: drip transfer failed");

        emit DripClaimed(msg.sender, amount);
    }

    /* ─────────────────────── Team Withdrawal ─────────────────────── */

    function withdrawTeam() external {
        require(msg.sender == teamWallet, "CatrisVault: not team wallet");
        uint256 amount = teamWei;
        require(amount > 0, "CatrisVault: nothing to withdraw");
        teamWei = 0;
        (bool ok,) = payable(teamWallet).call{value: amount}("");
        require(ok, "CatrisVault: team transfer failed");
        emit TeamWithdrawn(teamWallet, amount);
    }

    /* ─────────────────────── Admin ─────────────────────── */

    function setBot(address _bot) external onlyOwner {
        bot = _bot;
        emit BotSet(_bot);
    }

    function setTeamWallet(address _wallet) external onlyOwner {
        teamWallet = _wallet;
        emit TeamWalletSet(_wallet);
    }

    function setTokenCA(string calldata ca) external onlyOwner {
        TOKEN_CA = ca;
    }

    function setMetadata(
        string calldata site,
        string calldata xHandle,
        string calldata github,
        string calldata telegram
    ) external onlyOwner {
        SITE      = site;
        X_HANDLE  = xHandle;
        GITHUB    = github;
        TELEGRAM  = telegram;
    }

    /* ─────────────────────── Views ─────────────────────── */

    /// @notice ETH waiting in Pons escrow (not yet pulled)
    function pendingEscrow() external view returns (uint256) {
        return FEE_ESCROW.balanceOf(address(this));
    }

    function buckets() external view returns (uint256 prize, uint256 drip, uint256 team) {
        return (prizeWei, dripWei, teamWei);
    }

    function hasClaimed(address player) external view returns (bool) {
        return claimed[currentMerkleRoot][player];
    }

    /* ─────────────────────── Internal ─────────────────────── */

    function _verifyMerkle(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 h = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            h = h < p
                ? keccak256(abi.encodePacked(h, p))
                : keccak256(abi.encodePacked(p, h));
        }
        return h == root;
    }
}
