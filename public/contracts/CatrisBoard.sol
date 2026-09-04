// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CatrisBoard
/// @notice 15-minute epoch leaderboard. The keeper submits signed scores
///         so players pay no gas. Vault reads the winner at settlement.
contract CatrisBoard {
    struct Score {
        address player;
        uint256 score;
        uint256 lines;
        uint256 ts;
    }

    struct EpochRecord {
        address winner;
        uint256 topScore;
        uint256 topLines;
        bool settled;
    }

    uint256 public constant EPOCH_DURATION = 15 minutes;

    mapping(uint256 => EpochRecord) public epochs;
    mapping(uint256 => mapping(address => Score)) public playerEpochScore;
    mapping(address => uint256) public allTimeBest;
    mapping(bytes32 => bool) public usedNonces;

    address public owner;
    address public pendingOwner;
    address public bot;
    address public vault;

    event ScoreSubmitted(uint256 indexed epochId, address indexed player, uint256 score, uint256 lines);
    event NewEpochLeader(uint256 indexed epochId, address leader, uint256 score);
    event AllTimeRecord(address indexed player, uint256 score);
    event EpochMarkedSettled(uint256 indexed epochId);

    error Unauthorized();
    error NonceUsed();

    modifier onlyBot() {
        if (msg.sender != bot && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyVaultOrBot() {
        if (msg.sender != vault && msg.sender != bot && msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function submitScore(
        address player,
        uint256 score,
        uint256 lines,
        bytes32 nonce
    ) external onlyBot returns (bool isNewLeader) {
        if (usedNonces[nonce]) revert NonceUsed();
        usedNonces[nonce] = true;

        uint256 epochId = currentEpoch();
        Score storage prev = playerEpochScore[epochId][player];

        if (score >= prev.score) {
            playerEpochScore[epochId][player] = Score(player, score, lines, block.timestamp);
            if (score > epochs[epochId].topScore) {
                epochs[epochId].winner = player;
                epochs[epochId].topScore = score;
                epochs[epochId].topLines = lines;
                isNewLeader = true;
                emit NewEpochLeader(epochId, player, score);
            }
            if (score > allTimeBest[player]) {
                allTimeBest[player] = score;
                emit AllTimeRecord(player, score);
            }
        }

        emit ScoreSubmitted(epochId, player, score, lines);
    }

    function markSettled(uint256 epochId) external onlyVaultOrBot {
        epochs[epochId].settled = true;
        emit EpochMarkedSettled(epochId);
    }

    function currentEpoch() public view returns (uint256) {
        return block.timestamp / EPOCH_DURATION;
    }

    function epochEndsAt() public view returns (uint256) {
        return (currentEpoch() + 1) * EPOCH_DURATION;
    }

    function timeUntilEpochEnd() public view returns (uint256) {
        return epochEndsAt() - block.timestamp;
    }

    function getEpochWinner(uint256 epochId) external view returns (address winner, uint256 score, uint256 lines) {
        EpochRecord storage e = epochs[epochId];
        return (e.winner, e.topScore, e.topLines);
    }

    function getPlayerScore(uint256 epochId, address player) external view returns (Score memory) {
        return playerEpochScore[epochId][player];
    }

    function getCurrentLeader() external view returns (address winner, uint256 score) {
        EpochRecord storage e = epochs[currentEpoch()];
        return (e.winner, e.topScore);
    }

    function setBot(address _bot) external {
        if (msg.sender != owner) revert Unauthorized();
        bot = _bot;
    }

    function setVault(address _vault) external {
        if (msg.sender != owner) revert Unauthorized();
        vault = _vault;
    }

    function transferOwnership(address next) external {
        if (msg.sender != owner) revert Unauthorized();
        pendingOwner = next;
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        owner = msg.sender;
        pendingOwner = address(0);
    }
}
