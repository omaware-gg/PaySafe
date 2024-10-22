const express = require("express");
const userRouter = express.Router();
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { User, Account } = require("../db");
require("dotenv").config();
const { authMiddleware } = require("../middleware");

const JWT_SECRET = process.env.JWT_SECRET;

const signupBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName:zod.string(),
    password: zod.string().min(6)
})

userRouter.post("/signup", async (req,res) => {
    const { success } = signupBody.safeParse(req.body);
    if(!success) {
        return res.status(400).json({
            message: "Email already taken/Invalid inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    })

    if(existingUser) {
        return res.status(400).json({
            message: "Email already taken"
        })
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    })
    const userId = user._id;

    await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
    })

    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    })
})

const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string().min(6)
})

userRouter.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body);
    if(!success) {
        return res.status(400).json({
            message: "Invalid inputs"
        })
    }

    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password
    });

    if(user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);

        res.json({
            token: token
        })
        return;
    }

    res.status(400).json({
        message: "Error while logging in"
    })
})

const updateBody = zod.object({
    password: zod.string().min(6).optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()
})

userRouter.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body);
    if(!success) {
        return res.status(400).json({
            message: "Invalid inputs"
        })
    }

    const user = await User.findById(req.userId);
    if(!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    await User.updateOne({ _id: req.userId }, req.body);

    res.json({
        message: "User updated successfully"
    })
})

userRouter.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = userRouter;