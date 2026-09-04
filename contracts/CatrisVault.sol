// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CatrisVault
/// @notice Receives the letscash.fun creator stream (0.7% of the 1% trade tax)
///         and splits 60% epoch prize, 30% holder drip (merkle), 10% team.
///         After launch, hook.updateCreator(poolId, this). Keeper calls harvest().
interface ILetsCashHook {
    function claim(bytes32 poolId) external;
    function tab(bytes32 poolId) external view returns (uint256);
}

contract CatrisVault {
    ILetsCashHook public constant HOOK =
        ILetsCashHook(0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC);

    uint256 public constant PRIZE_BPS = 6000;
    uint256 public constant DRIP_BPS = 3000;
    uint256 public constant TEAM_BPS = 1000;
    uint256 public constant MAX_PAYOUT_BPS = 8000;

    uint256 public prizeWei;
    uint256 public dripWei;
    uint256 public teamWei;
    uint256 public totalReceived;
    bytes32 public currentMerkleRoot;
    mapping(bytes32 => mapping(address => bool)) public claimed;

    address public owner;
    address public pendingOwner;
    address public bot;
    address public teamWallet;
    bytes32 public poolId;
    string public SITE;
    string public X_HANDLE;
    string public GITHUB;
    string public TELEGRAM;
    string public TOKEN_CA;

    bool private locked;

    event EthSplit(uint256 amount, uint256 prize, uint256 drip, uint256 team);
    event Harvested(bytes32 indexed poolId);
    event EpochSettled(uint256 indexed epochId, address winner, uint256 prize, bytes32 merkleRoot);
    event DripClaimed(address indexed player, uint256 amount);
    event TeamWithdrawn(address to, uint256 amount);
    event BotSet(address bot);
    event TeamWalletSet(address wallet);
    event PoolIdSet(bytes32 poolId);

    error Unauthorized();
    error Reentrant();
    error PrizeTooHigh();
    error TransferFailed();
    error AlreadyClaimed();
    error InvalidProof();
    error NothingToWithdraw();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyBot() {
        if (msg.sender != bot && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (locked) revert Reentrant();
        locked = true;
        _;
        locked = false;
    }

    constructor(address _teamWallet) {
        owner = msg.sender;
        teamWallet = _teamWallet;
    }

    /// @notice Pull creator ETH from the letscash hook. claim() is creator-only,
    ///         so this vault must already be the stream owner. ETH arrives via
    ///         receive() and is split there — do not split again here.
    ///         Empty tab is a no-op (try/catch) so the keeper can poke every epoch.
    function harvest() external onlyBot nonReentrant {
        if (poolId == bytes32(0)) return;
        try HOOK.claim(poolId) {
            emit Harvested(poolId);
        } catch {}
    }

    receive() external payable {
        if (msg.value == 0) return;
        _split(msg.value);
        emit EthSplit(
            msg.value,
            (msg.value * PRIZE_BPS) / 10_000,
            (msg.value * DRIP_BPS) / 10_000,
            (msg.value * TEAM_BPS) / 10_000
        );
    }

    function _split(uint256 amount) internal {
        uint256 p = (amount * PRIZE_BPS) / 10_000;
        uint256 d = (amount * DRIP_BPS) / 10_000;
        uint256 t = amount - p - d;
        prizeWei += p;
        dripWei += d;
        teamWei += t;
        totalReceived += amount;
    }

    function settleEpoch(
        uint256 epochId,
        bytes32 merkleRoot,
        address winner,
        uint256 winnerPrize
    ) external onlyBot nonReentrant {
        if (merkleRoot != bytes32(0)) currentMerkleRoot = merkleRoot;
        if (winner != address(0) && winnerPrize > 0) {
            uint256 cap = (prizeWei * MAX_PAYOUT_BPS) / 10_000;
            if (winnerPrize > cap || winnerPrize > prizeWei) revert PrizeTooHigh();
            prizeWei -= winnerPrize;
            (bool ok, ) = payable(winner).call{value: winnerPrize}("");
            if (!ok) revert TransferFailed();
        }
        emit EpochSettled(epochId, winner, winnerPrize, merkleRoot);
    }

    function claimDrip(uint256 amount, bytes32[] calldata proof) external nonReentrant {
        bytes32 root = currentMerkleRoot;
        if (root == bytes32(0) || claimed[root][msg.sender]) revert AlreadyClaimed();
        if (amount == 0 || amount > dripWei) revert PrizeTooHigh();
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        if (!_verifyMerkle(proof, root, leaf)) revert InvalidProof();
        claimed[root][msg.sender] = true;
        dripWei -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit DripClaimed(msg.sender, amount);
    }

    function withdrawTeam() external nonReentrant {
        if (msg.sender != teamWallet) revert Unauthorized();
        uint256 amount = teamWei;
        if (amount == 0) revert NothingToWithdraw();
        teamWei = 0;
        (bool ok, ) = payable(teamWallet).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit TeamWithdrawn(teamWallet, amount);
    }

    function setBot(address _bot) external onlyOwner {
        bot = _bot;
        emit BotSet(_bot);
    }

    function setTeamWallet(address _wallet) external onlyOwner {
        teamWallet = _wallet;
        emit TeamWalletSet(_wallet);
    }

    function setPoolId(bytes32 id) external onlyOwner {
        poolId = id;
        emit PoolIdSet(id);
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
        SITE = site;
        X_HANDLE = xHandle;
        GITHUB = github;
        TELEGRAM = telegram;
    }

    function transferOwnership(address next) external onlyOwner {
        pendingOwner = next;
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function pendingTab() external view returns (uint256) {
        if (poolId == bytes32(0)) return 0;
        try HOOK.tab(poolId) returns (uint256 amount) {
            return amount;
        } catch {
            return 0;
        }
    }

    function buckets() external view returns (uint256 prize, uint256 drip, uint256 team) {
        return (prizeWei, dripWei, teamWei);
    }

    function hasClaimed(address player) external view returns (bool) {
        return claimed[currentMerkleRoot][player];
    }

    function _verifyMerkle(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 h = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            h = h < p ? keccak256(abi.encodePacked(h, p)) : keccak256(abi.encodePacked(p, h));
        }
        return h == root;
    }
}
