const COMMON_MESSAGES = {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    PRODUCT_NOT_FOUND: 'Product not found',
    USER_NOT_FOUND: 'User not found',
    INVALID_ACTION: 'Invalid action or quantity',
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
    ID_REQUIRED: 'ID is required',
    FILE_NOT_FOUND: 'File not found',
    IMAGE_REMOVED: 'Image removed',
};

const MESSAGES = {
    wishlist: {
        PRODUCT_NOT_FOUND: COMMON_MESSAGES.PRODUCT_NOT_FOUND,
        PRODUCT_ADDED: 'Product added to wishlist',
        PRODUCT_ALREADY_IN_WISHLIST: 'Product already in wishlist',
        ITEM_NOT_FOUND: 'Item not found in list',
        ITEM_REMOVED: 'Item removed from list',
    },

    cart: {
        PRODUCT_NOT_AVAILABLE: 'Product not available',
        PRODUCT_ADDED: 'Product added to cart',
        USER_CART_NOT_FOUND: 'User cart not found',
        PRODUCT_NOT_IN_CART: 'Product not found in cart',
        PRODUCT_REMOVED: 'Product has been removed from cart.',
        PRODUCT_NOT_FOUND: 'Product not found in the cart',
        MAX_QUANTITY_REACHED: 'Maximum quantity reached for this product',
    },

    auth: {
        INVALID_OTP: 'Invalid OTP',
        PASSWORD_MISMATCH: "Current password doesn't match",
        EMAIL_EXISTS: 'Email already exists',
        OTP_SEND_ERROR: 'Failed to send OTP',
        INVALID_CREDENTIALS: 'Email or password is invalid',
    },

    order: {
        ORDER_NOT_FOUND: 'Order not found',
        PRODUCT_NOT_FOUND_IN_ORDER: 'Product not found in order',
        ORDER_OR_PRODUCT_NOT_FOUND: 'Order or product not found',
        PRODUCT_CANCELLED: 'Product cancelled successfully',
        PRODUCT_RETURNED: 'Product returned successfully',
        PRODUCT_CONFIRMED: 'Product confirmed successfully',
        PRODUCT_SHIPPED: 'Product shipped successfully',
        PRODUCT_DELIVERED: 'Product delivered successfully',
        NOT_ENOUGH_WALLET: 'Not enough money in wallet',
        INVOICE_FAILED: 'Failed to generate invoice',
    },

    coupon: {
        COUPON_EXISTS: 'The coupon already exists',
        COUPON_DUPLICATE: 'A coupon with the same details already exists',
        COUPON_NOT_FOUND: 'Coupon not found',
        COUPON_LISTED: 'Coupon has been listed successfully',
        COUPON_UNLISTED: 'Coupon has been unlisted successfully',
        COUPON_ID_REQUIRED: 'Coupon ID is required',
    },

    category: {
        CATEGORY_EXISTS: 'The category already exists',
        CATEGORY_NOT_FOUND: 'Category not found',
        CATEGORY_LISTED: 'Category has been listed successfully',
        CATEGORY_UNLISTED: 'Category has been unlisted successfully',
        INVALID_LIST_STATUS: 'Invalid list status',
    },

    brand: {
        BRAND_NOT_FOUND: 'Brand not found',
        BRAND_EXISTS: 'The brand already exists',
        BRAND_LISTED: 'Brand has been listed successfully',
        BRAND_UNLISTED: 'Brand has been unlisted successfully',
        INVALID_LIST_STATUS: 'Invalid list status',
        SERVER_ERROR: 'Something went wrong on the server',
        CANNOT_GET_BRANDS: 'Cannot get any brands',
    },

    user: {
        USER_BLOCKED: 'User has been blocked successfully',
        USER_UNBLOCKED: 'User has been unblocked successfully',
        REPORT_ERROR: 'Failed to generate report',
        INVALID_TIMEFRAME: 'Invalid timeframe',
    },

    address: {
        REQUIRED_FIELDS: 'All fields are required',
        ADDRESS_EXISTS: 'Address already exists',
        ADDRESS_NOT_FOUND: 'Selected address not found',
        ADDRESS_DELETED: 'Your address has been deleted.',
        ADDRESS_SAVE_ERROR: 'Something went wrong while saving address. Please try again.',
        ADDRESS_EDIT_ERROR: 'Error editing address',
        CANT_FIND_ADDRESS: "Can't find address",
        ADDRESS_ADDED: 'Address added successfully',
    },
};

module.exports = {
    MESSAGES,
    COMMON_MESSAGES,
};
