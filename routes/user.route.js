import express from "express"

import { address, getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from "../controllers/user.controller.js"
import  {authMiddleware}  from "../libs/authMiddleware.js"

const router = express.Router()

router.post("/address",authMiddleware,address)
router.get("/wishlist",authMiddleware,getWishlist)
router.post("/wishlist/add",authMiddleware,addToWishlist)
router.delete("/wishlist/remove",authMiddleware,removeFromWishlist)
router.delete("/wishlist/clear",authMiddleware,clearWishlist)

export default router