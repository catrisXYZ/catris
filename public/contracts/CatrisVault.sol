// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CatrisVault
/// @notice Receives the letscash.fun 3% creator stream and splits:
///         60% epoch prize, 30% holder drip (merkle), 10% team.
///         Point updateCreator at this address after launch.
interface IFeeEscrow {
    function balanceOf(address recipient) external view returns (uint256);
    function claim() external;
}

contract CatrisVault {
    IFeeEscrow public constant FEE_ESCROW =
        IFeeEscrow(0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e);

    uint256 public constant PRIZE_BPS = 6000;
    uint256 public constant DRIP_BPS = 3000;
    uint256 public constant TEAM_BPS = 1000;
    uint256 public constant EPOCH = 15 minutes;

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
    string public SITE;
    string public X_HANDLE;
    string public GITHUB;
    string public TELEGRAM;
    string public TOKEN_CA;

    bool private locked;

    event EthSplit(uint256 amount, uint256 prize, uint256 drip, uint256 team);
    event EscrowClaimed(uint256 amount);
    event EpochSettled(uint256 indexed epochId, address winner, uint256 prize, bytes32 merkleRoot);
    event DripClaimed(address indexed player, uint256 amount);
    event TeamWithdrawn(address to, uint256 amount);
    event BotSet(address bot);
    event TeamWalletSet(address wallet);

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

    /// @notice Pull native creator fees. No-op (no revert) if escrow is empty
    ///         so a keeper can poke this every epoch without failing.
    function claimFromEscrow() external nonReentrant {
        uint256 beforeBal = address(this).balance;
        FEE_ESCROW.claim();
        uint256 received = address(this).balance - beforeBal;
        if (received == 0) return;
        _split(received);
        emit EscrowClaimed(received);
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
            if (winnerPrize > prizeWei) revert PrizeTooHigh();
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

    function pendingEscrow() external view returns (uint256) {
        return FEE_ESCROW.balanceOf(address(this));
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
