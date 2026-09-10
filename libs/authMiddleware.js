import { VerifyToken } from "./verifyAndSignupToken.js"

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token
        if (!token) {
            return res.status(401).json({ message: "No token provided. Please login first." })
        }

        const decoded = await VerifyToken(token)
        req.user = decoded
        next()
    } catch (error) {
        console.log("Error in authMiddleware", error.message)
        return res.status(401).json({ message: "Invalid or expired token" })
    }
}

