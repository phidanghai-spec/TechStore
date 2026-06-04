/**
 * Maps category slug to its respective technology placeholder image
 */
export const getCategoryPlaceholder = (categorySlug: string): string => {
  switch (categorySlug) {
    case 'dien-thoai':
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80';
    case 'laptop':
      return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80';
    case 'tai-nghe':
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
    case 'dong-ho':
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
    case 'phu-kien':
      return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80';
    case 'linh-kien':
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
    default:
      return 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore';
  }
};

/**
 * Guesses the category slug from the product name or slug if not provided
 */
export const getCategorySlugFromProduct = (product: { name: string; slug: string; category?: { slug: string } }): string => {
  if (product.category?.slug) {
    return product.category.slug;
  }
  const name = product.name.toLowerCase();
  const slug = product.slug.toLowerCase();
  
  if (name.includes('iphone') || name.includes('galaxy') || name.includes('xiaomi') || name.includes('oppo') || name.includes('samsung s') || name.includes('điện thoại') || slug.includes('phone') || slug.includes('iphone') || slug.includes('samsung')) {
    return 'dien-thoai';
  }
  if (name.includes('macbook') || name.includes('laptop') || name.includes('xps') || name.includes('rog strix') || name.includes('zenbook') || name.includes('ideapad') || slug.includes('laptop') || slug.includes('macbook') || slug.includes('xps') || slug.includes('strix')) {
    return 'laptop';
  }
  if (name.includes('airpods') || name.includes('sony wh') || name.includes('tai nghe') || name.includes('headphone') || slug.includes('airpods') || slug.includes('ear') || slug.includes('headphones')) {
    return 'tai-nghe';
  }
  if (name.includes('watch') || name.includes('đồng hồ') || slug.includes('watch')) {
    return 'dong-ho';
  }
  if (name.includes('keyboard') || name.includes('mouse') || name.includes('logitech') || name.includes('sạc') || name.includes('cáp') || name.includes('phụ kiện') || slug.includes('keyboard') || slug.includes('mouse') || slug.includes('charger') || slug.includes('adapter')) {
    return 'phu-kien';
  }
  if (name.includes('ssd') || name.includes('ram') || name.includes('rtx') || name.includes('cpu') || name.includes('mainboard') || name.includes('noctua') || name.includes('lian li') || name.includes('linh kiện') || slug.includes('ssd') || slug.includes('ram') || slug.includes('rtx') || slug.includes('cpu') || slug.includes('mainboard') || slug.includes('noctua') || slug.includes('lian-li') || slug.includes('component')) {
    return 'linh-kien';
  }
  return '';
};

/**
 * Validates a product image URL and returns either the original URL or a suitable category placeholder
 */
export const validateProductImage = (
  imageUrl: string | null | undefined,
  product: { name: string; slug: string; category?: { slug: string } }
): string => {
  if (!imageUrl) {
    return getCategoryPlaceholder(getCategorySlugFromProduct(product));
  }
  
  // Known bad non-technology image (orange shirt stock photo)
  if (imageUrl.includes('photo-1563132337-f159f484226c')) {
    return getCategoryPlaceholder(getCategorySlugFromProduct(product));
  }
  
  return imageUrl;
};
