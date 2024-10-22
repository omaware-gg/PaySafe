const express = require("express");
const { authMiddleware } = require("../middleware");
const { default: mongoose } = require("mongoose");
const { Account } = require("../db");

const accountRouter = express.Router();

accountRouter.get("/balance", authMiddleware, async (req,res) => {
    const account = await Account.findOne({
        userId: req.userId
    })

    res.json({
        balance: account.balance
    })
});

accountRouter.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    //fetching the accounts within the transaction
    const fromAccount = await Account.findOne({ userId: req.userId}).session(session);

    if(!fromAccount || fromAccount.balance < amount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: "Insufficient balance"
        })
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if(!toAccount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: "Invalid recipient"
        })
        
    }

    //performing the transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount }}).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount }}).session(session);

    await session.commitTransaction();
    session.endSession();
    res.json({
        message: "Transfer successful"
    })

    
})

module.exports = accountRouter;