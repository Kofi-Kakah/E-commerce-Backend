import express from "express"

import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from "../controllers/shopping.controller.js"
import { authMiddleware } from "../libs/authMiddleware.js"

const router = express.Router()

router.get('/cart', authMiddleware, getCart);
router.post('/cart/items', authMiddleware, addToCart);
router.put('/cart/update/:id', authMiddleware, updateCartItem);
router.delete('/cart/remove/:id', authMiddleware, removeCartItem);
router.delete('/cart/clear', authMiddleware, clearCart);

export default router