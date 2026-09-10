import express from "express"

import {createProducts, deleteProducts, updateProducts, searchProducts, category, filterProducts} from "../controllers/product.controller.js"
import { authMiddleware } from "../libs/authMiddleware.js"
import  isAdmin  from "../libs/adminMiddleware.js"

const router = express.Router()

router.post("/create-product", authMiddleware, isAdmin, createProducts)
router.delete("/delete-products/:id",authMiddleware, isAdmin, deleteProducts)
router.patch("/update-products/:id",authMiddleware, isAdmin, updateProducts)
router.get("/searchProducts/search",authMiddleware, searchProducts)
router.get("/category",authMiddleware, category)
router.get("/filter", filterProducts);

export default router
