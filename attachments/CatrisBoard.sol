// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  CatrisBoard
 * @notice On-chain leaderboard for Cat Tetris on Robinhood Chain 4663.
 *         The keeper bot submits scores after each game session.
 *         Every 15 minutes the epoch rolls over and top scorer is recorded.
 *
 * @dev    Scores are submitted by the keeper (Railway bot) after the player
 *         signs their result off-chain. This keeps gas on the player side zero.
 *         The vault's settleEpoch() reads the winner from this board.
 */
contract CatrisBoard {

    /* ─────────────────────────── Structs ─────────────────────────── */

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
        bool    settled;
    }

    /* ─────────────────────────── Constants ─────────────────────────── */

    uint256 public constant EPOCH_DURATION = 15 minutes;

    /* ─────────────────────────── State ─────────────────────────── */

    // epochId → epoch summary
    mapping(uint256 => EpochRecord) public epochs;

    // epochId → player → best score this epoch
    mapping(uint256 => mapping(address => Score)) public playerEpochScore;

    // all-time best per player
    mapping(address => uint256) public allTimeBest;

    // session nonces — prevent replay (player + nonce must be unique)
    mapping(bytes32 => bool) public usedNonces;

    // Access
    address public owner;
    address public bot;
    address public vault;  // CatrisVault, may call markSettled

    /* ─────────────────────────── Events ─────────────────────────── */

    event ScoreSubmitted(
        uint256 indexed epochId,
        address indexed player,
        uint256 score,
        uint256 lines
    );
    event NewEpochLeader(uint256 indexed epochId, address leader, uint256 score);
    event AllTimeRecord(address indexed player, uint256 score);
    event EpochMarkedSettled(uint256 indexed epochId);

    /* ─────────────────────────── Modifiers ─────────────────────────── */

    modifier onlyBot() {
        require(msg.sender == bot || msg.sender == owner, "CatrisBoard: not bot");
        _;
    }

    modifier onlyVaultOrBot() {
        require(
            msg.sender == vault || msg.sender == bot || msg.sender == owner,
            "CatrisBoard: not authorized"
        );
        _;
    }

    /* ─────────────────────────── Constructor ─────────────────────────── */

    constructor() {
        owner = msg.sender;
    }

    /* ─────────────────────────── Core ─────────────────────────── */

    /**
     * @notice Submit a player's game result.
     * @param  player    Wallet address of the player
     * @param  score     Game score (points)
     * @param  lines     Lines cleared
     * @param  nonce     Unique session ID (UUID from game client), prevents replay
     *
     * @dev    Bot verifies the player signed (player, score, lines, nonce) off-chain
     *         before calling this. The signature check lives in the keeper, not here —
     *         keeping the contract simpler and gas cheaper.
     */
    function submitScore(
        address player,
        uint256 score,
        uint256 lines,
        bytes32 nonce
    ) external onlyBot returns (bool isNewLeader) {
        // Prevent replay
        require(!usedNonces[nonce], "CatrisBoard: nonce already used");
        usedNonces[nonce] = true;

        uint256 epochId = currentEpoch();
        Score storage prev = playerEpochScore[epochId][player];

        // Only upgrade if this session was better
        if (score >= prev.score) {
            playerEpochScore[epochId][player] = Score(player, score, lines, block.timestamp);

            // Epoch leaderboard
            if (score > epochs[epochId].topScore) {
                epochs[epochId].winner   = player;
                epochs[epochId].topScore = score;
                epochs[epochId].topLines = lines;
                isNewLeader = true;
                emit NewEpochLeader(epochId, player, score);
            }

            // All-time record
            if (score > allTimeBest[player]) {
                allTimeBest[player] = score;
                emit AllTimeRecord(player, score);
            }
        }

        emit ScoreSubmitted(epochId, player, score, lines);
    }

    /**
     * @notice Mark an epoch as settled once the vault has paid out.
     */
    function markSettled(uint256 epochId) external onlyVaultOrBot {
        epochs[epochId].settled = true;
        emit EpochMarkedSettled(epochId);
    }

    /* ─────────────────────────── Views ─────────────────────────── */

    function currentEpoch() public view returns (uint256) {
        return block.timestamp / EPOCH_DURATION;
    }

    function epochEndsAt() public view returns (uint256) {
        return (currentEpoch() + 1) * EPOCH_DURATION;
    }

    function timeUntilEpochEnd() public view returns (uint256) {
        return epochEndsAt() - block.timestamp;
    }

    function getEpochWinner(uint256 epochId)
        external view returns (address winner, uint256 score, uint256 lines)
    {
        EpochRecord storage e = epochs[epochId];
        return (e.winner, e.topScore, e.topLines);
    }

    function getPlayerScore(uint256 epochId, address player)
        external view returns (Score memory)
    {
        return playerEpochScore[epochId][player];
    }

    function getCurrentLeader()
        external view returns (address winner, uint256 score)
    {
        EpochRecord storage e = epochs[currentEpoch()];
        return (e.winner, e.topScore);
    }

    /* ─────────────────────────── Admin ─────────────────────────── */

    function setBot(address _bot)     external { require(msg.sender == owner); bot = _bot; }
    function setVault(address _vault) external { require(msg.sender == owner); vault = _vault; }
}
