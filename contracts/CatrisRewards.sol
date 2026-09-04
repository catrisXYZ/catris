// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title CatrisRewards
/// @notice Synthetix-style staking: holders stake CATRIS (the PONS-launched
///         token) and earn the 30% ETH slice of the 3% creator tax. Call
///         setStakingToken after the PONS launch returns the token address.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract CatrisRewards {
    address public owner;
    address public pendingOwner;
    IERC20 public stakingToken;

    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public rewardRate;
    uint256 public periodFinish;
    uint256 public rewardsDuration = 7 days;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    bool private locked;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);
    event StakingTokenSet(address token);

    error Unauthorized();
    error ZeroAmount();
    error TokenUnset();
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

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable updateReward(address(0)) {
        _notify(msg.value);
    }

    function setStakingToken(address token) external onlyOwner {
        stakingToken = IERC20(token);
        emit StakingTokenSet(token);
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalStaked;
    }

    function earned(address account) public view returns (uint256) {
        return (balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (address(stakingToken) == address(0)) revert TokenUnset();
        if (amount == 0) revert ZeroAmount();
        totalStaked += amount;
        balances[msg.sender] += amount;
        if (!stakingToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        totalStaked -= amount;
        balances[msg.sender] -= amount;
        if (!stakingToken.transfer(msg.sender, amount)) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            (bool ok, ) = msg.sender.call{value: reward}("");
            if (!ok) revert TransferFailed();
            emit RewardPaid(msg.sender, reward);
        }
    }

    function exit() external nonReentrant updateReward(msg.sender) {
        uint256 amount = balances[msg.sender];
        if (amount > 0) {
            totalStaked -= amount;
            balances[msg.sender] = 0;
            if (!stakingToken.transfer(msg.sender, amount)) revert TransferFailed();
            emit Withdrawn(msg.sender, amount);
        }
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            (bool ok, ) = msg.sender.call{value: reward}("");
            if (!ok) revert TransferFailed();
            emit RewardPaid(msg.sender, reward);
        }
    }

    function notifyRewardAmount() external payable onlyOwner updateReward(address(0)) {
        _notify(msg.value);
    }

    function setRewardsDuration(uint256 duration) external onlyOwner {
        rewardsDuration = duration;
    }

    function transferOwnership(address next) external onlyOwner {
        pendingOwner = next;
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function _notify(uint256 reward) internal {
        if (reward == 0) return;
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 leftover = (periodFinish - block.timestamp) * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }
}
