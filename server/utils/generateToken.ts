const jwt = require("jsonwebtoken");

interface TokenUser { _id: any; role: string; }

const generateToken = (user: TokenUser) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

module.exports = generateToken;