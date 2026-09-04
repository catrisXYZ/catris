// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title CatrisTreasury
/// @notice Receives the PONS v2 creator tax (set creatorFeeRecipient to this
///         address, or claim from the PONS fee escrow and forward here) and
///         splits quote-asset proceeds across Arena, staker rewards, events,
///         and ops. Designed for Robinhood Chain (4663).
interface IPonsFeeEscrow {
    function claim() external;
    function claimToken(address token) external;
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract CatrisTreasury {
    address public owner;
    address public pendingOwner;
    address public ponsEscrow;
    address public arena;
    address public rewards;
    address public eventsVault;
    address public ops;

    uint16 public arenaBps = 5000;
    uint16 public rewardsBps = 3000;
    uint16 public eventsBps = 1500;
    uint16 public opsBps = 500;

    uint256 public totalHarvested;
    mapping(address => uint256) public totalHarvestedToken;

    bool private locked;

    event Harvested(address indexed asset, uint256 amount);
    event SplitUpdated(uint16 arenaBps, uint16 rewardsBps, uint16 eventsBps, uint16 opsBps);
    event DestinationsUpdated(address arena, address rewards, address eventsVault, address ops);
    event OwnershipTransferStarted(address indexed previous, address indexed next);
    event OwnershipTransferred(address indexed previous, address indexed next);

    error Unauthorized();
    error InvalidSplit();
    error ZeroAddress();
    error TransferFailed();
    error Reentrant();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (locked) revert Reentrant();
        locked = true;
        _;
        locked = false;
    }

    constructor(
        address escrow_,
        address arena_,
        address rewards_,
        address eventsVault_,
        address ops_
    ) {
        if (arena_ == address(0) || rewards_ == address(0) || eventsVault_ == address(0) || ops_ == address(0)) {
            revert ZeroAddress();
        }
        owner = msg.sender;
        ponsEscrow = escrow_;
        arena = arena_;
        rewards = rewards_;
        eventsVault = eventsVault_;
        ops = ops_;
    }

    receive() external payable {
        if (msg.value > 0) _splitNative(msg.value);
    }

    /// @notice Pull native fees from the PONS fee escrow into this treasury and split.
    function harvestNative() external nonReentrant {
        uint256 beforeBal = address(this).balance;
        IPonsFeeEscrow(ponsEscrow).claim();
        uint256 gained = address(this).balance - beforeBal;
        if (gained > 0) _splitNative(gained);
    }

    /// @notice Pull an ERC-20 quote asset from the PONS escrow and split it the same way.
    function harvestToken(address token) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        IERC20 erc = IERC20(token);
        uint256 beforeBal = erc.balanceOf(address(this));
        IPonsFeeEscrow(ponsEscrow).claimToken(token);
        uint256 gained = erc.balanceOf(address(this)) - beforeBal;
        if (gained > 0) _splitToken(token, gained);
    }

    /// @notice Forward ERC-20 already sitting on this contract (manual claim + send).
    function splitTokenBalance(address token) external nonReentrant {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) _splitToken(token, bal);
    }

    function setSplit(uint16 arenaBps_, uint16 rewardsBps_, uint16 eventsBps_, uint16 opsBps_) external onlyOwner {
        if (uint256(arenaBps_) + rewardsBps_ + eventsBps_ + opsBps_ != 10_000) revert InvalidSplit();
        arenaBps = arenaBps_;
        rewardsBps = rewardsBps_;
        eventsBps = eventsBps_;
        opsBps = opsBps_;
        emit SplitUpdated(arenaBps_, rewardsBps_, eventsBps_, opsBps_);
    }

    function setDestinations(address arena_, address rewards_, address eventsVault_, address ops_) external onlyOwner {
        if (arena_ == address(0) || rewards_ == address(0) || eventsVault_ == address(0) || ops_ == address(0)) {
            revert ZeroAddress();
        }
        arena = arena_;
        rewards = rewards_;
        eventsVault = eventsVault_;
        ops = ops_;
        emit DestinationsUpdated(arena_, rewards_, eventsVault_, ops_);
    }

    function setPonsEscrow(address escrow_) external onlyOwner {
        if (escrow_ == address(0)) revert ZeroAddress();
        ponsEscrow = escrow_;
    }

    function transferOwnership(address next) external onlyOwner {
        pendingOwner = next;
        emit OwnershipTransferStarted(owner, next);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function _splitNative(uint256 amount) internal {
        uint256 a = (amount * arenaBps) / 10_000;
        uint256 r = (amount * rewardsBps) / 10_000;
        uint256 e = (amount * eventsBps) / 10_000;
        uint256 o = amount - a - r - e;
        _send(arena, a);
        _send(rewards, r);
        _send(eventsVault, e);
        _send(ops, o);
        totalHarvested += amount;
        emit Harvested(address(0), amount);
    }

    function _splitToken(address token, uint256 amount) internal {
        uint256 a = (amount * arenaBps) / 10_000;
        uint256 r = (amount * rewardsBps) / 10_000;
        uint256 e = (amount * eventsBps) / 10_000;
        uint256 o = amount - a - r - e;
        _sendToken(token, arena, a);
        _sendToken(token, rewards, r);
        _sendToken(token, eventsVault, e);
        _sendToken(token, ops, o);
        totalHarvestedToken[token] += amount;
        emit Harvested(token, amount);
    }

    function _send(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function _sendToken(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (!IERC20(token).transfer(to, amount)) revert TransferFailed();
    }
}
