import { prisma } from "../prisma.ts";
import { SignToken } from "../libs/verifyAndSignupToken.js"
import bcrypt from "bcryptjs"

const santisizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    product: user.product,
    wishlist: user.wishlist,
    cart: user.cart,
    address: user.addresses,
    order: user.orders
}) 

export const signup = async (req,res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(409).json({ message: "All fields are required"})
        }

        const existingUser = await prisma.user.findUnique({ where: {email} })
        if(existingUser) {
            return res.status(400).json({ message: "User already exist"})
        }
        
        const hashedPassword = await bcrypt.hash(password, 12)

        const User = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        })

        res.status(201).json({
            message: "User created successfully",
            user: santisizeUser(User)
        })

    } catch (error) {
        console.log("Error SigningUp")
        res.status(500).json({ error: error.message || "Internal Server Error" })
    }
}
export const login = async (req,res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password ) {
            return res.status(409).json({ message: "All field are reqired" })
        }

        const User = await prisma.user.findUnique({ where: { email }})
        if(!User) {
            return res.status(400).json({ message: " User don't exist"})
        }

        const isPassword = await bcrypt.compare(password,User.password)
        if(!isPassword) {
            return res.status(400).json({ message: "Invalid password"})
        }

        const token = await SignToken({ _id: User.id, email: User.email })

        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
        })

        res.status(200).json({
            message: "Login Successfully",
            user: santisizeUser(User)
        })
    } catch (error) {
        console.log("Error LoggingIn")
        res.status(500).json({ error: error.message || "Internal Server error"})
    }
}
export const logout = async (req,res) => {
    try {
    res.clearCookie("auth_token")
    res.status(200).json({ message: "Logout Successfully"})
    } catch (error) {
        console.log("Error LoggingOut")
        res.status(500).json({ error: error.message || "Internal server error"})
    }
}
export const getme = async (req,res) => {
    try{
        const userId = req.params.id;
        const authenticatedUser = Number(req.user?._id);

        if(!req.user || authenticatedUser !== Number(userId)) {
           return res.status(400).json({ message: "You are not authenticated to view another person profile"})
        }

        const user = await prisma.user.findUnique({ 
            where: {id: Number(userId)},
            include: {
                addresses: true,
                wishlist: true,
                cart: true,
                orders: true,
                reviews: true
            }
        })

        if(!user) {
            return res.status(400).json({ message: "User not found"})
        }

        res.status(200).json({
            message: "You are authenticated",
            user: santisizeUser(user)
        })
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error"})
    }
}