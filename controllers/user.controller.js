import { prisma } from "../prisma.ts"


export const address = async (req,res) => {
  try{
        const userId = req.user._id
        const {label,recipient,addressLine1 ,addressLine2 ,city,state,postalCode,country,phone} = req.body;

        if(!label||!recipient||!addressLine1||!addressLine2||!city||!state||!postalCode||!country||!phone) {
            return res.status(400).json({ message: "All fields are required"})
        }


        const createAddress = await prisma.address.create({
            data:{
                label,
                recipient,
                addressLine1,
                addressLine2,
                city,
                state,
                postalCode,
                country,
                phone,
                user: {
                    connect: {id: userId}
                }
            }
        })

        return res.status(201).json({
            message: "Address created successfully",
            addressLine: {
                createAddress
            }
        })    
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error"})
  }
}

export const getWishlist = async (req,res) => {
    try{
        const userId = req.user._id;

        let wishlist = await prisma.wishlist.findUnique({ 
            where: { userId },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!wishlist) {
            wishlist = await prisma.wishlist.create({
                data: { user: { connect: { id: userId} }},
                include: { items: { include: { product: true }}}
            });
        }
        return res.status(200).json({ wishlist });
    } catch(error) {
        console.log("Error getting wishlist", error.message)
        return res.status(500).json({ error: error.message || "Internal Server Error"})
    }
};

export const addToWishlist = async (req,res) => {
    try{
        const userId = req.user._id;
        const { productId } = req.body;

        if(!productId) {
            return res.status(400).json({ message: "productId is required"})
        }

        const product = await prisma.wishlist.findUnique({ where: { userId }});
        if(!product) {
            return res.status(404).json({ message: "Product Not Found"})
        }

        let wishlist = await prisma.wishlist.findUnique({ where: {userId}});
        if(!wishlist) {
            wishlist = await prisma.wishlist.create({
                data: { user: { connect: { id: userId }}}
            });
        }

        const item = await prisma.wishlistItem.create({
            data: {
                wishlist: { connect: {id: wishlist.id }},
                product: { connect: {id: productId}}
            }
        })

        return res.status(201).json({ message: "Added to wishlist", item })
    } catch (error) {
        if(error.code === "P2002") {
            return res.status(409).json({ message: "Product already in wishlist" });
        }
        console.log("Error adding to wishlist", error.message);
        return res.status(500).json({ error: error.message || "Internal Server Error"})
    }
}

export const removeFromWishlist = async (req,res) => {
    try{
        const userId = req.user._id;
        const { productId } = req.query;

        const wishlist = await prisma.wishlist.findUnique({ where: {userId}});
        if(!wishlist) {
            return res.status(404).json({ message: "Wishlist not found"})
        }

        await prisma.wishlistItem.delete({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId: Number(productId)
                }
            }
        });

        return res.status(200).json({ message: "Removed from wishlist"});
    } catch (error) {
        if(error.code === "P2025") {
            return res.status(404).json({ message: "Item not in wishlist" });
        }
        console.log("Error removing to wishlist", error.message);
        return res.status(500).json({ error: error.message || "Internal Server Error"})
    }
}

export const clearWishlist = async (req,res) => {
    try{
        const userId = req.user._id;

        const wishlist = await prisma.wishlist.findUnique({ where: { userId }});
        if(!wishlist) {
            return res.status(404).json({ message: "Wishlist not found" })
        }
        await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id }});

        return res.status(200).json({ message: "Wishlist cleared"})
    } catch (error) {
        console.log("Error clearing wishlist", error.message);
        return res.status(500).json({ error: error.mesage || "Internal Server Error"})
    }
}