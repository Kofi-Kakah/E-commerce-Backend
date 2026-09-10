const isAdmin = (req,res,next) => {
    if(req.user?.role !== "ADMIN") {
        return res.status(400).json({ message: "Only Admin can create products" })
    }
    next();
}

export default isAdmin