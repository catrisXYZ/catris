// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title CatrisArena
/// @notice Weekly prize pot funded by the Catris treasury (50% of the 3% PONS
///         creator tax). The operator posts a merkle root of the season's
///         verified top scores; players claim their share. Also accepts
///         direct donations to the live pot.
contract CatrisArena {
    address public owner;
    address public pendingOwner;
    address public oracle;
    address public treasury;

    uint64 public currentEpoch;
    uint64 public epochDuration = 7 days;
    uint64 public epochStartedAt;
    uint256 public prizePool;
    uint256 public eventsPool;

    struct Epoch {
        bytes32 merkleRoot;
        uint256 pot;
        uint256 claimed;
        bool finalized;
        uint64 startedAt;
        uint64 endedAt;
    }

    mapping(uint64 => Epoch) public epochs;
    mapping(uint64 => mapping(address => bool)) public claimed;
    mapping(address => uint64) public lastSubmitAt;

    uint32 public submitCooldown = 10 minutes;
    uint8 public maxWinners = 10;

    bool private locked;

    event Donated(address indexed from, uint256 amount, bool toEvents);
    event ScorePosted(address indexed player, uint64 epoch, uint64 score, uint32 lines);
    event EpochFinalized(uint64 indexed epoch, bytes32 root, uint256 pot);
    event Claimed(address indexed player, uint64 indexed epoch, uint256 amount);
    event EpochAdvanced(uint64 indexed epoch);

    error Unauthorized();
    error AlreadyFinalized();
    error NotFinalized();
    error AlreadyClaimed();
    error InvalidProof();
    error Cooldown();
    error ZeroAddress();
    error TransferFailed();
    error Reentrant();
    error EpochOpen();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyOracle() {
        if (msg.sender != oracle && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (locked) revert Reentrant();
        locked = true;
        _;
        locked = false;
    }

    constructor(address oracle_) {
        owner = msg.sender;
        oracle = oracle_ == address(0) ? msg.sender : oracle_;
        epochStartedAt = uint64(block.timestamp);
        currentEpoch = 1;
        epochs[1].startedAt = uint64(block.timestamp);
    }

    receive() external payable {
        prizePool += msg.value;
        emit Donated(msg.sender, msg.value, false);
    }

    function donateToEvents() external payable {
        eventsPool += msg.value;
        emit Donated(msg.sender, msg.value, true);
    }

    /// @notice Optional on-chain attestation of a run. The DApp still stores
    ///         the public leaderboard off-chain; this is the audit trail the
    ///         operator uses when building the epoch merkle root.
    function postScore(address player, uint64 score, uint32 lines) external onlyOracle {
        if (player == address(0)) revert ZeroAddress();
        if (block.timestamp < lastSubmitAt[player] + submitCooldown) revert Cooldown();
        lastSubmitAt[player] = uint64(block.timestamp);
        emit ScorePosted(player, currentEpoch, score, lines);
    }

    function finalizeEpoch(bytes32 merkleRoot) external onlyOwner {
        Epoch storage e = epochs[currentEpoch];
        if (e.finalized) revert AlreadyFinalized();
        if (block.timestamp < epochStartedAt + epochDuration) revert EpochOpen();
        e.merkleRoot = merkleRoot;
        e.pot = prizePool;
        e.finalized = true;
        e.endedAt = uint64(block.timestamp);
        prizePool = 0;
        emit EpochFinalized(currentEpoch, merkleRoot, e.pot);

        currentEpoch += 1;
        epochStartedAt = uint64(block.timestamp);
        epochs[currentEpoch].startedAt = uint64(block.timestamp);
        emit EpochAdvanced(currentEpoch);
    }

    function claim(uint64 epoch, uint256 amount, bytes32[] calldata proof) external nonReentrant {
        Epoch storage e = epochs[epoch];
        if (!e.finalized) revert NotFinalized();
        if (claimed[epoch][msg.sender]) revert AlreadyClaimed();
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        if (!_verify(proof, e.merkleRoot, leaf)) revert InvalidProof();
        claimed[epoch][msg.sender] = true;
        e.claimed += amount;
        _send(msg.sender, amount);
        emit Claimed(msg.sender, epoch, amount);
    }

    function fundEvent(address payable to, uint256 amount) external onlyOwner nonReentrant {
        if (amount > eventsPool) revert TransferFailed();
        eventsPool -= amount;
        _send(to, amount);
    }

    function setOracle(address oracle_) external onlyOwner {
        if (oracle_ == address(0)) revert ZeroAddress();
        oracle = oracle_;
    }

    function setEpochDuration(uint64 duration) external onlyOwner {
        epochDuration = duration;
    }

    function setTreasury(address treasury_) external onlyOwner {
        treasury = treasury_;
    }

    function transferOwnership(address next) external onlyOwner {
        pendingOwner = next;
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function _send(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function _verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            computed = computed <= p
                ? keccak256(abi.encodePacked(computed, p))
                : keccak256(abi.encodePacked(p, computed));
        }
        return computed == root;
    }
}
