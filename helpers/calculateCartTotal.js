const calculateCartTotal = (cart) => {
  cart.totalPriceBeforeDiscount = cart.products.reduce(
    (acc, item) =>
      acc + item.option.price.priceBeforeDiscount * item.selectedCount,
    0
  );

  cart.totalDiscount = cart.products.reduce((acc, item) => {
    const discountPerItem =
      item.option.price.priceBeforeDiscount - item.option.price.finalPrice;
    const itemDiscount = discountPerItem * item.selectedCount;

    // تأكد من أن الخصم قيمة صالحة
    if (!isNaN(itemDiscount) && itemDiscount > 0) {
      return acc + itemDiscount;
    }
    return acc;
  }, 0);

  cart.totalFinalPrice =
    cart.totalPriceBeforeDiscount - (cart.totalDiscount || 0) + cart.shipping;
  return cart;
};

module.exports = { calculateCartTotal };
