import jwt from "jsonwebtoken"

export const SignToken = async (payload) => jwt.sign(payload,process.env.JWT_SECRET, {expiresIn: "7d"})

export const VerifyToken = async (token) => jwt.verify(token, process.env.JWT_SECRET)