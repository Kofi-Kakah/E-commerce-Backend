import { prisma } from "../prisma.ts"

export const createProducts = async (req,res) => {
    try{
        const { sku, price, name, description, stock, status, category } = req.body;

        if(!sku|| !price|| !name|| !description|| stock === undefined|| !status || !category) {
            return res.status(400).json({ message: "All fields are reqiured"})
        }

        if(description.length < 7) {
            return res.status(400).json({ message: "Description should be less than seven(7) words"})
        }
        if(description.length > 50) {
            return res.status(400).json({ message: "Description should be more than fifty(50) words"})
        }

        const productSku = await prisma.products.findUnique({ where: {sku}})
        if(productSku) {
            return res.status(400).json({ message: "A product already exist with this sku"})
        }
        

        function stockStatus (stock) {
            return stock === 0 ? "OUT_OF_STOCK" : "ACTIVE"
        }

        const product = await prisma.products.create({
            data: {
                sku,
                price,
                name,
                description,
                stock,
                status:stockStatus(stock),
                category
            }
        })

        return res.status(201).json({
            message: "Product Created Successfully",
            product: {
                _id: product.id,
                sku: product.sku,
                price: product.price,
                name: product.name,
                description: product.description,
                stock: product.stock,
                status: product.status,
                category: product.category
            }
        })
    } catch (error) {
        console.log("Error creating Products")
        return res.status(500).json({ error: error.message || "Internal Server Error"})
    }
}

export const deleteProducts = async (req,res) => {
    try {
        const id = Number(req.params.id)

        if(!id) {
            return res.status(400).json({ message: "No product found"})
        }

        const product = await prisma.products.delete({where: {id}})

        return res.status(200).json({
            message: `${product.name} deleted successfully`
        })

    } catch (error) {
        res.status(500).json({ error: error.message})
    }
}

export const updateProducts = async (req,res) => {
    try {
        const { id } = req.params;

        const { sku, price, name, description, stock, status, category } = req.body;

        const updateProduct = await prisma.products.update({ 
            where: {
                id: Number( id ),
            },
                data: {
                    sku, 
                    price, 
                    name, 
                    description, 
                    stock, 
                    status, 
                    category
            }})
            
            return res.status(200).json({
                message: "Product updated successfully",
                product: {
                sku: updateProduct.sku,
                price: updateProduct.price,
                name:updateProduct.name,
                description: updateProduct.description,
                stock: updateProduct.stock,
                status: updateProduct.status,
                category: updateProduct.category
                }
             })
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal Server Error"})
    }
}

export const searchProducts = async (req,res) => {
    try {
        const { query } = req.query;

        if(!query || query.trim() === "") {
            return res.status(400).json({ message: "Search query is required"})
        }

        const searchProduct = await prisma.products.findMany({
            where: {
                OR: [
                {
                    name: {
                        contains: query,
                    }
                },
                {
                    description: {
                        contains: query
                    }
                } 
            ]
            }
        })

        return res.status(200).json({ 
            count: searchProduct.length,
            searchProduct
        })
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal Server Error"})
    }
}

export const category = async (req, res) => {
    try {
        const { category } = req.query;

        if(!category || category.trim() === "") {
            return res.status(400).json({ message: "Search query is required"})
        }

        const findCategory = await prisma.products.findMany({ 
            where: {
                OR: [
                    {
                        category :{
                            contains: category,
                            mode: "insensitive",
                        }
                    },
                    {
                        description: {
                            contains: category,
                            mode: "insensitive",
                        }
                    },
                    {
                        name: {
                            contains: category,
                            mode: "insensitive", 
                        }
                    },

                ]
            }
        })

        return res.status(200).json({ 
            category: findCategory
        })
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal Server Error"})
    }

}

export const filterProducts = async (req, res) => {
    try {
        const {
            // Search / match filters
            sku,
            name,
            category,
            status,
            description,

            // Price range
            minPrice,
            maxPrice,

            // Stock range
            minStock,
            maxStock,

            // Sorting
            sortBy = "createdAt",
            order  = "desc",

            // Pagination
            page  = 1,
            limit = 10,
        } = req.query;

        //  Build filter object dynamically
        // — only includes a field if the query param was actually sent
        const filters = {};

        if (sku) {
            filters.sku = {
                contains: sku, // partial match e.g. ?sku=MED
            };
        }

        if (name) {
            filters.name = {
                contains: name, // partial match e.g. ?name=Para
            };
        }

        if (description) {
            filters.description = {
                contains: description,
            };
        }

        if (category) {
            filters.category = {
                contains: category, // partial match e.g. ?category=Medicine
            };
        }

        if (status) {
            // Accepts "in_stock" or "IN_STOCK" — normalizes automatically
            filters.status = status.toUpperCase(); // IN_STOCK | OUT_OF_STOCK
        }

        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.gte = parseFloat(minPrice);
            if (maxPrice) filters.price.lte = parseFloat(maxPrice);
        }

        if (minStock || maxStock) {
            filters.stock = {};
            if (minStock) filters.stock.gte = parseInt(minStock);
            if (maxStock) filters.stock.lte = parseInt(maxStock);
        }

        //  Pagination calculation
        const pageNumber = parseInt(page);
        const pageSize   = parseInt(limit);
        const skip       = (pageNumber - 1) * pageSize;

        //  Whitelist allowed sort fields — prevents injection
        const allowedSortFields = ["sku", "name", "price", "stock", "category", "status", "createdAt"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortOrder = order === "asc" ? "asc" : "desc";

        //  Fetch products + total count in parallel
        const [products, totalCount] = await Promise.all([
            prisma.products.findMany({
                where:   filters,
                orderBy: { [sortField]: sortOrder },
                skip,
                take: pageSize,
                //  Only return the fields you need
                select: {
                    id:          true,
                    sku:         true,
                    name:        true,
                    description: true,
                    price:       true,
                    stock:       true,
                    status:      true,
                    category:    true,
                    createdAt:   true,
                    updatedAt:   true,
                },
            }),
            prisma.products.count({ where: filters }),
        ]);

        return res.status(200).json({
            success:    true,
            page:       pageNumber,
            limit:      pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            products,
        });

    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};