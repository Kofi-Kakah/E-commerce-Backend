import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"

import authRoutes from "./routes/auth.route.js"
import productRoutes from "./routes/product.route.js"
import userRoutes from "./routes/user.route.js"

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/user",userRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on PORT: http://localhost:${PORT}`)
});