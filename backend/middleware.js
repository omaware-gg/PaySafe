const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        if(payload.userId) {
            req.userId = payload.userId;
            next();
        } else {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

    } catch(err) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
}

module.exports = {
    authMiddleware
}