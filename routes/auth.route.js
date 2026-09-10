import express from "express"
import { signup, login, logout, getme } from "../controllers/auth.controller.js"
import { authMiddleware } from "../libs/authMiddleware.js"

const router = express.Router()

router.post("/signup",signup)
router.post("/login",login)
router.post("/logout",logout)
router.get("/getMe/:userId", authMiddleware, getme)

export default router;