// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SomniaEventHandler
 * @dev Base contract interface interacting with the Somnia Reactivity Engine.
 */
abstract contract SomniaEventHandler {
    function _onEvent(address emitter, bytes32[] calldata eventTopics, bytes calldata data) internal virtual;
    
    // The entry point called by the reactivity engine
    function onEvent(address emitter, bytes32[] calldata eventTopics, bytes calldata data) external {
        _onEvent(emitter, eventTopics, data);
    }
}

/**
 * @title FluxVault
 * @dev Programmable Security Firewall utilizing Somnia's Native Reactivity.
 */
contract FluxVault is SomniaEventHandler, ReentrancyGuard, Pausable {
    
    // --- State Variables --- //
    
    address public owner;
    address public coldStorageWallet;     // Wallet to redirect funds in a Critical event
    
    uint256 public threatThreshold;       // Base trigger threshold
    uint256 public constant LOCK_COOLDOWN = 24 hours;
    
    uint256 public unlockTime;            // Time when withdrawals can resume after reset
    
    // The system address for the Somnia Reactivity Engine on Shannon Testnet
    // The system address for the Somnia Reactivity Engine on Shannon Testnet
    // Validator callback address is often 0x0000000000000000000000000000000000000100
    address public constant SOMNIA_SYSTEM_ADDRESS = 0x0000000000000000000000000000000000000100;

    // Defcon Threat Levels
    enum DefconLevel {
        NORMAL,       // 0: Business as usual
        ELEVATED,     // 1: Large transfers detected, limit withdrawals
        HIGH,         // 2: Immediate Vault Lock
        CRITICAL      // 3: Massive Exploit Detected -> Auto-Rescue Funds
    }
    
    DefconLevel public currentDefcon;

    // --- Events --- //
    
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event DefconChanged(DefconLevel newLevel, uint256 triggerAmount, address indexed attacker, uint256 timestamp, string reason);
    event VaultResetInitiated(uint256 availableAtTime);
    event ThresholdUpdated(uint256 newThreshold);
    event EmergencyRescueExecuted(uint256 rescuedAmount, address destination, uint256 timestamp);

    // --- Modifiers --- //

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Not the Owner");
        _;
    }

    modifier onlySomniaEngine() {
        require(msg.sender == SOMNIA_SYSTEM_ADDRESS, "Unauthorized: Only Somnia Engine");
        _;
    }

    modifier checkCoolDown() {
        // Only enforce cooldown if we were previously locked but the threat is neutralized
        if (currentDefcon == DefconLevel.NORMAL && unlockTime > 0) {
            require(block.timestamp >= unlockTime, "Vault is in security cooldown phase");
        }
        _;
    }

    modifier defconAllowsWithdrawal(uint256 amount) {
        require(currentDefcon != DefconLevel.HIGH && currentDefcon != DefconLevel.CRITICAL, "Vault is Locked due to High Threat");
        
        if (currentDefcon == DefconLevel.ELEVATED) {
            // Under Elevated Threat, restrict to maximum 10% TVL withdrawal at a time
            uint256 maxSafeWithdrawal = address(this).balance / 10;
            require(amount <= maxSafeWithdrawal, "Withdrawal exceeds limit for Elevated Threat Level");
        }
        _;
    }

    // --- Constructor --- //

    constructor(uint256 _initialThreshold, address _coldStorageWallet) {
        owner = msg.sender;
        coldStorageWallet = _coldStorageWallet;
        threatThreshold = _initialThreshold;
        currentDefcon = DefconLevel.NORMAL;
    }

    // --- Core Reactivity Logic --- //

    /**
     * @dev Reactivity Entry Point: Triggered gaslessly by Somnia Reactivity Engine
     */
    function _onEvent(address /* emitter */, bytes32[] calldata /* eventTopics */, bytes calldata data) internal override onlySomniaEngine {
        uint256 amount;
        address attacker = address(0);

        // Advanced Profiling: Try to decode standard Transfer(from, to, value)
        // If it fails (e.g. data is only amount), fallback to single uint256
        if (data.length >= 96) {
            (attacker, , amount) = abi.decode(data, (address, address, uint256));
        } else {
            amount = abi.decode(data, (uint256));
        }

        // Evaluate the threat based on incoming stream anomaly depth
        if (amount >= (threatThreshold * 5)) {
            _escalateDefcon(DefconLevel.CRITICAL, amount, attacker, "CRITICAL: Massive Network Drain Detected");
            _executeAutoRescue();
        } else if (amount >= (threatThreshold * 2)) {
            _escalateDefcon(DefconLevel.HIGH, amount, attacker, "HIGH: Exploit Signature Match");
        } else if (amount >= threatThreshold) {
            _escalateDefcon(DefconLevel.ELEVATED, amount, attacker, "ELEVATED: High-Volume Anomalies");
        }
    }

    function _escalateDefcon(DefconLevel newLevel, uint256 triggerAmount, address attacker, string memory reason) private {
        // Only escalate upwards directly via Reactivity
        if (newLevel > currentDefcon) {
            currentDefcon = newLevel;
            _pause(); 
            emit DefconChanged(newLevel, triggerAmount, attacker, block.timestamp, reason);
        }
    }

    function _executeAutoRescue() private {
        uint256 balance = address(this).balance;
        if (balance > 0 && coldStorageWallet != address(0)) {
            (bool success, ) = coldStorageWallet.call{value: balance}("");
            require(success, "Auto-Rescue Failed");
            emit EmergencyRescueExecuted(balance, coldStorageWallet, block.timestamp);
        }
    }

    // --- Core Vault Functions --- //

    /**
     * @dev Fallback to receive STT cleanly
     */
    receive() external payable whenNotPaused {
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }
    
    fallback() external payable whenNotPaused {
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Classic deposit interface
     */
    function deposit() external payable whenNotPaused {
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Secure withdrawal with ReentrancyGuard, Cooldown enforcement, and Defcon awareness.
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant whenNotPaused checkCoolDown defconAllowsWithdrawal(amount) {
        require(address(this).balance >= amount, "Insufficient active balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    // --- Admin Functions --- //

    /**
     * @dev Allows the owner to manually pause deposits/withdrawals as a Circuit Breaker.
     */
    function manualPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Allows the owner to manually trigger an auto-rescue without Somnia Engine.
     */
    function panicRescue() external onlyOwner nonReentrant {
        _escalateDefcon(DefconLevel.CRITICAL, 0, msg.sender, "Manual Panic Triggered");
        _executeAutoRescue();
    }

    /**
     * @dev Admin override to downgrade the threat level to NORMAL once neutralized.
     * Starts the mandatory 24-hour withdrawal cooldown.
     */
    function resetVault() external onlyOwner {
        currentDefcon = DefconLevel.NORMAL;
        unlockTime = block.timestamp + LOCK_COOLDOWN;
        _unpause();
        emit VaultResetInitiated(unlockTime);
    }

    function updateThreshold(uint256 _newThreshold) external onlyOwner {
        threatThreshold = _newThreshold;
        emit ThresholdUpdated(_newThreshold);
    }

    function updateColdStorage(address _newColdStorage) external onlyOwner {
        coldStorageWallet = _newColdStorage;
    }

    /**
     * @dev Owner-callable simulation: directly injects an anomaly report for demo purposes.
     * Mirrors the exact logic of _onEvent so the UI can demonstrate reactivity
     * even when the Somnia Engine callback has not yet fired.
     */
    function simulateAttack(uint256 amount) external onlyOwner {
        if (amount >= (threatThreshold * 5)) {
            _escalateDefcon(DefconLevel.CRITICAL, amount, msg.sender, "CRITICAL: Massive Network Drain Detected");
            _executeAutoRescue();
        } else if (amount >= (threatThreshold * 2)) {
            _escalateDefcon(DefconLevel.HIGH, amount, msg.sender, "HIGH: Exploit Signature Match");
        } else if (amount >= threatThreshold) {
            _escalateDefcon(DefconLevel.ELEVATED, amount, msg.sender, "ELEVATED: High-Volume Anomalies");
        }
    }
}
