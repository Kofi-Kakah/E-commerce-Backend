import { prisma } from "../prisma.ts"



/**
 * GET /cart
 * Gets (or lazily creates) the logged-in user's cart, with items + product details.
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    }

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

/**
 * POST /cart/items
 * Body: { productId, quantity }
 * Adds a product to the cart, or increments quantity if it's already in the cart.
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be at least 1' });
    }

    const product = await prisma.products.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
    });

    let item;
    if (existingItem) {
      item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
        include: { product: true },
      });
    }

    return res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

/**
 * PUT /cart/items/:id
 * Body: { quantity }
 * Updates the quantity of a specific cart item.
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = parseInt(req.params.id, 10);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be at least 1' });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });

    return res.status(200).json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('updateCartItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update cart item' });
  }
};

/**
 * DELETE /cart/items/:id
 * Removes a single item from the cart.
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = parseInt(req.params.id, 10);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('removeCartItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove cart item' });
  }
};

/**
 * DELETE /cart
 * Clears all items from the logged-in user's cart.
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('clearCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};
