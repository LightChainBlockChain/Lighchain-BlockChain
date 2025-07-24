/**
 * LightPay Digital Wallet - GCash-like Wallet for Sideline Pinas
 * Integrated with blockchain and commission system
 * Developer: Ronirei Light
 * Created: 2025-01-19
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class LightPayWallet extends EventEmitter {
    constructor(userId, blockchain) {
        super();
        this.userId = userId;
        this.blockchain = blockchain;
        this.walletId = this.generateWalletId();
        this.balance = 0;
        this.transactions = [];
        this.cards = [];
        this.qrCode = this.generateQRCode();
        this.pin = null;
        this.isVerified = false;
        this.createdAt = new Date();
        this.lastActivity = new Date();
        
        // Commission settings
        this.OWNER_COMMISSION_RATE = 0.10; // 10% commission to owner
        this.OWNER_WALLET_ADDRESS = 'LIGHTCHAIN_OWNER_WALLET_001';
        
        // Transaction limits
        this.dailyLimit = 50000; // PHP 50,000 daily limit
        this.monthlyLimit = 100000; // PHP 100,000 monthly limit
        this.dailySpent = 0;
        this.monthlySpent = 0;
        
        this.initializeWallet();
    }

    initializeWallet() {
        console.log(`🔥 LightPay Wallet initialized for user: ${this.userId}`);
        console.log(`💳 Wallet ID: ${this.walletId}`);
        console.log(`📱 QR Code: ${this.qrCode}`);
        this.emit('walletCreated', this.getWalletInfo());
    }

    generateWalletId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `LP${timestamp.toString().slice(-6)}${random}`;
    }

    generateQRCode() {
        const qrData = {
            walletId: this.walletId,
            userId: this.userId,
            timestamp: Date.now()
        };
        return Buffer.from(JSON.stringify(qrData)).toString('base64');
    }

    // PIN Management
    setPin(pin) {
        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            throw new Error('PIN must be exactly 6 digits');
        }
        
        this.pin = crypto.createHash('sha256').update(pin).digest('hex');
        console.log('✅ PIN set successfully');
        return true;
    }

    verifyPin(inputPin) {
        if (!this.pin) {
            throw new Error('No PIN set for this wallet');
        }
        
        const hashedInput = crypto.createHash('sha256').update(inputPin).digest('hex');
        return this.pin === hashedInput;
    }

    // KYC Verification
    verifyAccount(kycData) {
        // Simulate KYC verification process
        const requiredFields = ['fullName', 'idNumber', 'phoneNumber', 'address'];
        const isComplete = requiredFields.every(field => kycData[field]);
        
        if (isComplete) {
            this.isVerified = true;
            this.dailyLimit = 100000; // Increase limits for verified users
            this.monthlyLimit = 500000;
            console.log('✅ Account verified successfully');
            this.emit('accountVerified', this.userId);
            return true;
        }
        
        throw new Error('Incomplete KYC information');
    }

    // Cash In Methods
    async cashInViaBank(amount, bankDetails, pin) {
        if (!this.verifyPin(pin)) {
            throw new Error('Invalid PIN');
        }

        const transaction = {
            id: this.generateTransactionId(),
            type: 'CASH_IN_BANK',
            amount: amount,
            source: bankDetails.bankName,
            status: 'PROCESSING',
            timestamp: new Date(),
            fee: amount * 0.01 // 1% processing fee
        };

        this.transactions.push(transaction);
        
        // Simulate bank processing
        setTimeout(() => {
            transaction.status = 'COMPLETED';
            this.balance += amount;
            console.log(`💰 Cash in successful: ₱${amount}`);
            this.emit('cashInComplete', transaction);
        }, 3000);

        return transaction;
    }

    async cashInViaCard(amount, cardDetails, pin) {
        if (!this.verifyPin(pin)) {
            throw new Error('Invalid PIN');
        }

        const transaction = {
            id: this.generateTransactionId(),
            type: 'CASH_IN_CARD',
            amount: amount,
            source: `****${cardDetails.number.slice(-4)}`,
            status: 'PROCESSING',
            timestamp: new Date(),
            fee: amount * 0.015 // 1.5% card processing fee
        };

        this.transactions.push(transaction);
        
        // Simulate card processing
        setTimeout(() => {
            transaction.status = 'COMPLETED';
            this.balance += amount;
            console.log(`💳 Card cash in successful: ₱${amount}`);
            this.emit('cashInComplete', transaction);
        }, 2000);

        return transaction;
    }

    // Send Money with Commission System
    async sendMoney(recipientWalletId, amount, pin, message = '') {
        if (!this.verifyPin(pin)) {
            throw new Error('Invalid PIN');
        }

        if (amount <= 0) {
            throw new Error('Invalid amount');
        }

        if (this.balance < amount) {
            throw new Error('Insufficient balance');
        }

        if (!this.checkTransactionLimits(amount)) {
            throw new Error('Transaction exceeds daily or monthly limits');
        }

        // Calculate owner commission
        const commission = amount * this.OWNER_COMMISSION_RATE;
        const actualAmount = amount - commission;

        const transaction = {
            id: this.generateTransactionId(),
            type: 'SEND_MONEY',
            amount: amount,
            actualAmount: actualAmount,
            commission: commission,
            recipient: recipientWalletId,
            message: message,
            status: 'PROCESSING',
            timestamp: new Date(),
            blockchainTxHash: null
        };

        this.transactions.push(transaction);
        
        // Process on blockchain
        const blockchainTx = await this.processOnBlockchain(transaction);
        transaction.blockchainTxHash = blockchainTx.hash;
        transaction.status = 'COMPLETED';

        // Deduct from sender
        this.balance -= amount;
        this.dailySpent += amount;
        this.monthlySpent += amount;

        // Send commission to owner
        await this.sendCommissionToOwner(commission, transaction.id);

        console.log(`💸 Sent ₱${actualAmount} to ${recipientWalletId}`);
        console.log(`💰 Commission ₱${commission} sent to owner`);
        
        this.emit('moneyTransferred', transaction);
        return transaction;
    }

    // Receive Money
    async receiveMoney(senderWalletId, amount, transactionId) {
        const transaction = {
            id: transactionId,
            type: 'RECEIVE_MONEY',
            amount: amount,
            sender: senderWalletId,
            status: 'COMPLETED',
            timestamp: new Date()
        };

        this.transactions.push(transaction);
        this.balance += amount;
        
        console.log(`💰 Received ₱${amount} from ${senderWalletId}`);
        this.emit('moneyReceived', transaction);
        return transaction;
    }

    // Sideline Pinas Integration - Purchase from Marketplace
    async purchaseFromSidelinePinas(productId, amount, sellerWalletId, pin) {
        if (!this.verifyPin(pin)) {
            throw new Error('Invalid PIN');
        }

        if (this.balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Calculate commission
        const commission = amount * this.OWNER_COMMISSION_RATE;
        const sellerAmount = amount - commission;

        const transaction = {
            id: this.generateTransactionId(),
            type: 'MARKETPLACE_PURCHASE',
            productId: productId,
            amount: amount,
            sellerAmount: sellerAmount,
            commission: commission,
            seller: sellerWalletId,
            status: 'PROCESSING',
            timestamp: new Date(),
            blockchainTxHash: null
        };

        this.transactions.push(transaction);

        // Process on blockchain
        const blockchainTx = await this.processOnBlockchain(transaction);
        transaction.blockchainTxHash = blockchainTx.hash;
        transaction.status = 'COMPLETED';

        // Deduct from buyer
        this.balance -= amount;

        // Send commission to owner
        await this.sendCommissionToOwner(commission, transaction.id);

        console.log(`🛒 Purchase completed: Product ${productId} for ₱${amount}`);
        console.log(`💰 Seller receives: ₱${sellerAmount}`);
        console.log(`💰 Owner commission: ₱${commission}`);

        this.emit('purchaseCompleted', transaction);
        return transaction;
    }

    // Bills Payment
    async payBill(billType, amount, accountNumber, pin) {
        if (!this.verifyPin(pin)) {
            throw new Error('Invalid PIN');
        }

        if (this.balance < amount) {
            throw new Error('Insufficient balance');
        }

        const transaction = {
            id: this.generateTransactionId(),
            type: 'BILL_PAYMENT',
            billType: billType,
            amount: amount,
            accountNumber: accountNumber,
            status: 'PROCESSING',
            timestamp: new Date(),
            fee: 5 // Fixed ₱5 convenience fee
        };

        this.transactions.push(transaction);
        
        // Simulate bill payment processing
        setTimeout(() => {
            transaction.status = 'COMPLETED';
            this.balance -= (amount + transaction.fee);
            console.log(`🧾 Bill payment successful: ${billType} - ₱${amount}`);
            this.emit('billPaid', transaction);
        }, 2000);

        return transaction;
    }

    // QR Code Payments
    async payViaQR(qrCode, amount, pin) {
        if (!this.verifyPin(pin)) {
            throw new Error('Invalid PIN');
        }

        const qrData = this.decodeQR(qrCode);
        if (!qrData || !qrData.walletId) {
            throw new Error('Invalid QR code');
        }

        return await this.sendMoney(qrData.walletId, amount, pin, 'QR Payment');
    }

    // Cash Out
    async cashOut(amount, bankDetails, pin) {
        if (!this.verifyPin(pin)) {
            throw new Error('Invalid PIN');
        }

        if (this.balance < amount) {
            throw new Error('Insufficient balance');
        }

        const fee = amount * 0.02; // 2% cash out fee
        const totalDeduction = amount + fee;

        const transaction = {
            id: this.generateTransactionId(),
            type: 'CASH_OUT',
            amount: amount,
            fee: fee,
            totalDeduction: totalDeduction,
            destination: bankDetails.accountNumber,
            status: 'PROCESSING',
            timestamp: new Date()
        };

        this.transactions.push(transaction);
        
        // Simulate bank transfer
        setTimeout(() => {
            transaction.status = 'COMPLETED';
            this.balance -= totalDeduction;
            console.log(`🏦 Cash out successful: ₱${amount} (Fee: ₱${fee})`);
            this.emit('cashOutComplete', transaction);
        }, 5000);

        return transaction;
    }

    // Blockchain Integration
    async processOnBlockchain(transaction) {
        if (!this.blockchain) {
            throw new Error('Blockchain not connected');
        }

        const blockchainTx = {
            hash: crypto.randomBytes(32).toString('hex'),
            from: this.walletId,
            to: transaction.recipient || transaction.seller,
            amount: transaction.amount,
            commission: transaction.commission || 0,
            type: transaction.type,
            timestamp: transaction.timestamp,
            gasUsed: 21000,
            status: 'confirmed'
        };

        // Record on blockchain
        this.blockchain.addTransaction(blockchainTx);
        
        console.log(`⛓️ Transaction recorded on blockchain: ${blockchainTx.hash}`);
        return blockchainTx;
    }

    // Send commission to owner
    async sendCommissionToOwner(commission, transactionId) {
        const commissionTx = {
            id: this.generateTransactionId(),
            type: 'COMMISSION_PAYMENT',
            amount: commission,
            recipient: this.OWNER_WALLET_ADDRESS,
            originalTransaction: transactionId,
            timestamp: new Date(),
            status: 'COMPLETED'
        };

        // Record commission transaction
        console.log(`💰 Commission ₱${commission} sent to owner wallet`);
        this.emit('commissionPaid', commissionTx);
        
        return commissionTx;
    }

    // Utility Methods
    generateTransactionId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `LP${timestamp}${random}`;
    }

    decodeQR(qrCode) {
        try {
            return JSON.parse(Buffer.from(qrCode, 'base64').toString());
        } catch (error) {
            return null;
        }
    }

    checkTransactionLimits(amount) {
        if (!this.isVerified) {
            return (this.dailySpent + amount) <= this.dailyLimit;
        }
        return (this.dailySpent + amount) <= this.dailyLimit && 
               (this.monthlySpent + amount) <= this.monthlyLimit;
    }

    // Get wallet information
    getWalletInfo() {
        return {
            walletId: this.walletId,
            userId: this.userId,
            balance: this.balance,
            isVerified: this.isVerified,
            qrCode: this.qrCode,
            dailyLimit: this.dailyLimit,
            monthlyLimit: this.monthlyLimit,
            dailySpent: this.dailySpent,
            monthlySpent: this.monthlySpent,
            transactionCount: this.transactions.length,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }

    // Get transaction history
    getTransactionHistory(limit = 50) {
        return this.transactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Get balance
    getBalance() {
        return this.balance;
    }

    // Update last activity
    updateLastActivity() {
        this.lastActivity = new Date();
    }
}

module.exports = LightPayWallet;
