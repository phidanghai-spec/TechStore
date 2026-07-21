import { PrismaClient, Role, Rank, ProductStatus, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script...');

  const isSafeSeed = process.env.SAFE_SEED === 'true';

  if (isSafeSeed) {
    console.log('🛡️ SAFE SEED MODE ACTIVE: Skipping database deletion and demo logs/orders creation.');
  } else {
    // 1. Clean database
    await prisma.chatMessage.deleteMany({});
    await prisma.productReview.deleteMany({});
    await prisma.productQna.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Database cleaned.');
  }

  // 2. Create Users
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123', saltRounds);
  const customerPasswordHash = await bcrypt.hash('Test@123', saltRounds);

  if (!isSafeSeed) {
    // Admin User
    await prisma.user.create({
      data: {
        email: 'admin@techstore.vn',
        fullName: 'TechStore Administrator',
        phone: '0987654321',
        password: adminPasswordHash,
        address: '180 Cao Lỗ, Phường 4, Quận 8, TP.HCM',
        dob: new Date('1990-01-01'),
        role: Role.ADMIN,
      },
    });

    // Loyalty Customers
    await prisma.user.create({
      data: {
        email: 'silver@test.vn',
        fullName: 'Nguyễn Văn Bạc',
        phone: '0901234567',
        password: customerPasswordHash,
        address: '828 Sư Vạn Hạnh, Phường 13, Quận 10, TP.HCM',
        address2: '100 Lê Hồng Phong, Quận 5, TP.HCM',
        bankAccount: '111122223333 (Agribank)',
        deposit: 5000000, // 5M VND
        dob: new Date('1995-05-15'),
        role: Role.CUSTOMER,
        loyaltyPoints: 150, // Silver tier (100 - 499)
        rank: Rank.SILVER,
      },
    });
   
    await prisma.user.create({
      data: {
        email: 'gold@test.vn',
        fullName: 'Trần Thị Vàng',
        phone: '0912345678',
        password: customerPasswordHash,
        address: '123 Cách Mạng Tháng Tám, Quận 3, TP.HCM',
        address2: '456 Lê Lợi, Quận 1, TP.HCM',
        bankAccount: '888877776666 (Techcombank)',
        deposit: 10000000, // 10M VND
        dob: new Date('1993-10-20'),
        role: Role.CUSTOMER,
        loyaltyPoints: 600, // Gold tier (500 - 999)
        rank: Rank.GOLD,
      },
    });
   
    await prisma.user.create({
      data: {
        email: 'platinum@test.vn',
        fullName: 'Phạm Bạch Kim',
        phone: '0923456789',
        password: customerPasswordHash,
        address: '456 Nguyễn Thị Minh Khai, Quận 1, TP.HCM',
        address2: '789 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
        bankAccount: '9999123456789 (Vietcombank)',
        deposit: 25000000, // 25M VND
        dob: new Date('1988-12-30'),
        role: Role.CUSTOMER,
        loyaltyPoints: 1200, // Platinum tier (>= 1000)
        rank: Rank.PLATINUM,
      },
    });

    console.log('Sample users created.');

    // 3. Create Coupons
    await prisma.coupon.create({
      data: {
        code: 'SALE10',
        discountType: 'PERCENTAGE',
        discountValue: 10, // 10% off
        maxUsage: 100,
        usedCount: 0,
        expiryDate: new Date('2027-12-31'),
      },
    });

    await prisma.coupon.create({
      data: {
        code: 'GIAM50K',
        discountType: 'FIXED',
        discountValue: 50000, // 50k off
        maxUsage: 100,
        usedCount: 0,
        expiryDate: new Date('2027-12-31'),
      },
    });

    await prisma.coupon.create({
      data: {
        code: 'VIP15',
        discountType: 'PERCENTAGE',
        discountValue: 15, // 15% off
        maxUsage: 50,
        usedCount: 0,
        expiryDate: new Date('2027-12-31'),
      },
    });

    console.log('Coupons created.');
  } else {
    // In safe seed, ensure admin user exists
    const adminEmail = 'admin@techstore.vn';
    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminExists) {
      console.log('Admin user not found. Creating admin...');
      await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'TechStore Administrator',
          phone: '0987654321',
          password: adminPasswordHash,
          address: '180 Cao Lỗ, Phường 4, Quận 8, TP.HCM',
          dob: new Date('1990-01-01'),
          role: Role.ADMIN,
        },
      });
    }
  }

  // 4. Create Categories
  const categoriesData = [
    { name: 'Điện thoại', slug: 'dien-thoai' },
    { name: 'Laptop', slug: 'laptop' },
    { name: 'Tai nghe', slug: 'tai-nghe' },
    { name: 'Đồng hồ', slug: 'dong-ho' },
    { name: 'Phụ kiện', slug: 'phu-kien' },
    { name: 'Linh kiện', slug: 'linh-kien' },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    categoriesMap[cat.name] = createdCat.id;
  }

  console.log('Categories created/updated.');

  // Helper helper to generate random stock
  const getRandomStock = (isHot: boolean = false) => {
    // some hot products can have 0 stock to test "CHÁY HÀNG" status
    if (isHot && Math.random() < 0.15) return 0;
    return Math.floor(Math.random() * 80) + 10;
  };

  // 5. Products Seed Data
  const products = [
    // --- 1. ĐIỆN THOẠI (20 sản phẩm) ---
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'iPhone 16 Pro Max 256GB',
      slug: 'iphone-16-pro-max-256gb',
      originalPrice: 34990000,
      salePrice: 33990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'iphone, apple, ios, 16 pro max, 256gb, flagship',
      description: JSON.stringify({
        screen: '6.9 inches, Super Retina XDR OLED, 120Hz',
        cpu: 'Apple A18 Pro (3nm)',
        ram: '8 GB',
        storage: '256 GB',
        camera: 'Chính 48 MP & Phụ 48 MP, 12 MP',
        battery: '4685 mAh, sạc nhanh 30W',
        weight: '227 g',
        os: 'iOS 18',
        detail: 'iPhone 16 Pro Max thiết kế Titan sa mạc đẳng cấp, kích thước màn hình lớn nhất từ trước đến nay 6.9 inch, camera zoom quang học 5x sắc nét và nút Camera Control hoàn toàn mới.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'iPhone 16 Pro 128GB',
      slug: 'iphone-16-pro-128gb',
      originalPrice: 29990000,
      salePrice: 28990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'iphone, apple, ios, 16 pro, 128gb',
      description: JSON.stringify({
        screen: '6.3 inches, Super Retina XDR OLED, 120Hz',
        cpu: 'Apple A18 Pro (3nm)',
        ram: '8 GB',
        storage: '128 GB',
        camera: 'Chính 48 MP & Phụ 48 MP, 12 MP',
        battery: '3582 mAh, sạc nhanh 30W',
        weight: '199 g',
        os: 'iOS 18',
        detail: 'Kích thước nhỏ gọn hơn 6.3 inch nhưng sở hữu đầy đủ sức mạnh của con chip A18 Pro, nút điều khiển camera chuyên dụng và thiết kế vỏ Titan siêu bền nhẹ.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'iPhone 16 Plus 256GB',
      slug: 'iphone-16-plus-256gb',
      originalPrice: 28990000,
      salePrice: 26990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-plus-finish-select-202409-6-7inch-ultramarine?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'iphone, apple, ios, 16 plus, 256gb',
      description: JSON.stringify({
        screen: '6.7 inches, Super Retina XDR OLED, 60Hz',
        cpu: 'Apple A18 (3nm)',
        ram: '8 GB',
        storage: '256 GB',
        camera: 'Chính 48 MP & Phụ 12 MP',
        battery: '4674 mAh, sạc nhanh 25W',
        weight: '199 g',
        os: 'iOS 18',
        detail: 'iPhone 16 Plus mang đến thời lượng pin vượt trội, màn hình lớn 6.7 inch hiển thị sắc nét cùng nhiều màu sắc pastel thời thượng.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'iPhone 16 128GB',
      slug: 'iphone-16-128gb',
      originalPrice: 24990000,
      salePrice: 22990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-black?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'iphone, apple, ios, 16, 128gb',
      description: JSON.stringify({
        screen: '6.1 inches, Super Retina XDR OLED, 60Hz',
        cpu: 'Apple A18 (3nm)',
        ram: '8 GB',
        storage: '128 GB',
        camera: 'Chính 48 MP & Phụ 12 MP',
        battery: '3561 mAh',
        weight: '170 g',
        os: 'iOS 18',
        detail: 'Dòng sản phẩm tiêu chuẩn của Apple năm nay được nâng cấp chip A18, nút Camera Control và nút Action đa năng.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'iPhone 15 Pro Max 256GB',
      slug: 'iphone-15-pro-max-256gb',
      originalPrice: 30990000,
      salePrice: 28990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'iphone, apple, ios, 15 pro max, 256gb, best seller',
      description: JSON.stringify({
        screen: '6.7 inches, Super Retina XDR OLED, 120Hz',
        cpu: 'Apple A17 Pro (3nm)',
        ram: '8 GB',
        storage: '256 GB',
        camera: 'Chính 48 MP & Phụ 12 MP, 12 MP',
        battery: '4441 mAh',
        weight: '221 g',
        os: 'iOS 17',
        detail: 'Flagship năm ngoái của Apple vẫn cực hot với khung vỏ Titan tự nhiên cứng cáp, cổng sạc USB-C lần đầu xuất hiện và hiệu năng cực đỉnh.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'iPhone 15 128GB',
      slug: 'iphone-15-128gb',
      originalPrice: 21990000,
      salePrice: 18990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-black?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'iphone, apple, ios, 15, 128gb, best seller',
      description: JSON.stringify({
        screen: '6.1 inches, Super Retina XDR OLED, 60Hz',
        cpu: 'Apple A16 Bionic',
        ram: '6 GB',
        storage: '128 GB',
        camera: 'Chính 48 MP & Phụ 12 MP',
        battery: '3349 mAh',
        weight: '171 g',
        os: 'iOS 17',
        detail: 'Thiết kế đảo động Dynamic Island thông minh, camera độ phân giải cao 48MP và cổng kết nối chuẩn USB-C tiện lợi.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Samsung Galaxy S25 Ultra 512GB',
      slug: 'samsung-galaxy-s25-ultra-512gb',
      originalPrice: 34990000,
      salePrice: 31990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2501/gallery/vn-galaxy-s25-ultra-s938-sm-s938bzaaxsp-thumb-544159823?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy, s25 ultra, android, flagship, 512gb, s-pen',
      description: JSON.stringify({
        screen: '6.9 inches, Dynamic AMOLED 2X, 120Hz',
        cpu: 'Snapdragon 8 Gen 4 for Galaxy',
        ram: '12 GB',
        storage: '512 GB',
        camera: 'Chính 200 MP & Phụ 50 MP, 12 MP, 10 MP',
        battery: '5000 mAh, sạc nhanh 45W',
        weight: '219 g',
        os: 'Android 15 (One UI 7)',
        detail: 'Đỉnh cao công nghệ của Samsung với camera mắt thần 200MP, bút S-Pen đa năng, tính năng Galaxy AI thế hệ mới được tích hợp sâu.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Samsung Galaxy S25+ 256GB',
      slug: 'samsung-galaxy-s25-plus-256gb',
      originalPrice: 27990000,
      salePrice: 25990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2501/gallery/vn-galaxy-s25-plus-s936-sm-s936bzadxxv-thumb-544256676?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy, s25 plus, android, 256gb',
      description: JSON.stringify({
        screen: '6.7 inches, Dynamic AMOLED 2X, 120Hz',
        cpu: 'Exynos 2500 / Snapdragon 8 Gen 4',
        ram: '12 GB',
        storage: '256 GB',
        camera: 'Chính 50 MP & Phụ 10 MP, 12 MP',
        battery: '4900 mAh, sạc nhanh 45W',
        weight: '196 g',
        os: 'Android 15',
        detail: 'Phiên bản cân bằng hoàn hảo với màn hình lớn 6.7 inch cực đẹp, dung lượng pin trâu và hỗ trợ Galaxy AI thông minh.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Samsung Galaxy S25 256GB',
      slug: 'samsung-galaxy-s25-256gb',
      originalPrice: 22990000,
      salePrice: 20990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2501/gallery/vn-galaxy-s25-s931-sm-s931bzadxxv-thumb-544150539?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy, s25, android, 256gb',
      description: JSON.stringify({
        screen: '6.2 inches, Dynamic AMOLED 2X, 120Hz',
        cpu: 'Exynos 2500 / Snapdragon 8 Gen 4',
        ram: '8 GB',
        storage: '256 GB',
        camera: 'Chính 50 MP & Phụ 10 MP, 12 MP',
        battery: '4000 mAh, sạc nhanh 25W',
        weight: '167 g',
        os: 'Android 15',
        detail: 'Thiết kế nhỏ gọn, tinh tế, trọng lượng siêu nhẹ 167g cùng sức mạnh phần cứng vô cùng mạnh mẽ.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Samsung Galaxy A56 5G 128GB',
      slug: 'samsung-galaxy-a56-5g-128gb',
      originalPrice: 10490000,
      salePrice: 9490000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/sm-a556bzkdxxv/gallery/vn-galaxy-a55-5g-sm-a556-sm-a556bzkdxxv-thumb-540192348?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy, a56, 5g, android, tam trung, best seller',
      description: JSON.stringify({
        screen: '6.6 inches, Super AMOLED, 120Hz',
        cpu: 'Exynos 1580 (4nm)',
        ram: '8 GB',
        storage: '128 GB',
        camera: 'Chính 50 MP & Phụ 12 MP, 5 MP',
        battery: '5000 mAh, sạc 25W',
        weight: '202 g',
        os: 'Android 15',
        detail: 'Vua phân khúc tầm trung của Samsung với khả năng kháng nước IP67, camera chống rung OIS và hiệu năng chiến game mượt mà.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Samsung Galaxy A36 5G 128GB',
      slug: 'samsung-galaxy-a36-5g-128gb',
      originalPrice: 8490000,
      salePrice: 7490000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/sm-a356blbdxxv/gallery/vn-galaxy-a35-5g-sm-a356-sm-a356blbdxxv-thumb-540183199?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy, a36, 5g, android, gia re',
      description: JSON.stringify({
        screen: '6.6 inches, Super AMOLED, 120Hz',
        cpu: 'Exynos 1380',
        ram: '8 GB',
        storage: '128 GB',
        camera: 'Chính 50 MP & Phụ 8 MP, 5 MP',
        battery: '5000 mAh',
        weight: '195 g',
        os: 'Android 15',
        detail: 'Sở hữu màn hình 120Hz cao cấp, hỗ trợ 5G siêu tốc và pin dung lượng lớn đủ sử dụng cả ngày dài.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Samsung Galaxy Z Fold 6 512GB',
      slug: 'samsung-galaxy-z-fold-6-512gb',
      originalPrice: 47990000,
      salePrice: 44990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2407/gallery/vn-galaxy-z-fold6-f956-sm-f956bzkaxxv-thumb-542111818?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, fold, fold 6, man hinh gap, 512gb, flagship',
      description: JSON.stringify({
        screen: 'Chính 7.6 inches, Phụ 6.3 inches, Dynamic AMOLED 2X',
        cpu: 'Snapdragon 8 Gen 3 for Galaxy',
        ram: '12 GB',
        storage: '512 GB',
        camera: 'Chính 50 MP & Phụ 10 MP, 12 MP',
        battery: '4400 mAh, sạc nhanh 25W',
        weight: '239 g',
        os: 'Android 14 (One UI 6.1.1)',
        detail: 'Điện thoại màn hình gập cao cấp thế hệ mới, mỏng nhẹ hơn đáng kể (239g), trang bị nhiều tính năng dịch thuật AI và ghi chú thông minh.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Samsung Galaxy Z Flip 6 256GB',
      slug: 'samsung-galaxy-z-flip-6-256gb',
      originalPrice: 24990000,
      salePrice: 22990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2407/gallery/vn-galaxy-z-flip6-f741-sm-f741bzyaxxv-thumb-542106757?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, flip, flip 6, man hinh gap, 256gb',
      description: JSON.stringify({
        screen: 'Chính 6.7 inches, Phụ 3.4 inches, Dynamic AMOLED 2X',
        cpu: 'Snapdragon 8 Gen 3 for Galaxy',
        ram: '12 GB',
        storage: '256 GB',
        camera: 'Chính 50 MP & Phụ 12 MP',
        battery: '4000 mAh',
        weight: '187 g',
        os: 'Android 14',
        detail: 'Điện thoại gập vỏ sò thời trang nâng cấp camera lên 50MP sắc nét, RAM 12GB mạnh mẽ và tính năng FlexMode linh hoạt.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Xiaomi 14 Ultra 512GB',
      slug: 'xiaomi-14-ultra-512gb',
      originalPrice: 24990000,
      salePrice: 22990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
      brand: 'Xiaomi',
      tags: 'xiaomi, xiaomi 14 ultra, camera leica, flagship, android',
      description: JSON.stringify({
        screen: '6.73 inches, LTPO AMOLED, 120Hz, 3000 nits',
        cpu: 'Snapdragon 8 Gen 3',
        ram: '16 GB',
        storage: '512 GB',
        camera: 'Chính 50 MP & 3 ống kính Leica 50 MP',
        battery: '5000 mAh, sạc nhanh 90W',
        weight: '220 g',
        os: 'Xiaomi HyperOS (Android 14)',
        detail: 'Đỉnh cao nhiếp ảnh di động nhờ sự hợp tác với hãng Leica danh tiếng, trang bị cảm biến ảnh 1 inch lớn nhất và sạc siêu nhanh 90W.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Xiaomi 14T Pro 256GB',
      slug: 'xiaomi-14t-pro-256gb',
      originalPrice: 17990000,
      salePrice: 15990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      brand: 'Xiaomi',
      tags: 'xiaomi, xiaomi 14t pro, leica, 256gb',
      description: JSON.stringify({
        screen: '6.67 inches, AMOLED, 144Hz',
        cpu: 'MediaTek Dimensity 9300+ (4nm)',
        ram: '12 GB',
        storage: '256 GB',
        camera: 'Chính 50 MP (Leica) & Phụ 50 MP, 12 MP',
        battery: '5000 mAh, sạc nhanh 120W',
        weight: '209 g',
        os: 'HyperOS',
        detail: 'Trang bị cấu hình cực khủng với chip Dimensity 9300+, sạc đầy pin chỉ trong 19 phút nhờ củ sạc 120W đi kèm.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Redmi Note 13 Pro 256GB',
      slug: 'redmi-note-13-pro-256gb',
      originalPrice: 8490000,
      salePrice: 7490000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
      brand: 'Xiaomi',
      tags: 'xiaomi, redmi note 13 pro, 256gb, best seller',
      description: JSON.stringify({
        screen: '6.67 inches, AMOLED, 120Hz',
        cpu: 'MediaTek Helio G99-Ultra',
        ram: '8 GB',
        storage: '256 GB',
        camera: 'Chính 200 MP & Phụ 8 MP, 2 MP',
        battery: '5000 mAh, sạc nhanh 67W',
        weight: '188 g',
        os: 'Android 13',
        detail: 'Sở hữu camera độ phân giải khủng 200MP chống rung OIS, bộ nhớ trong lớn 256GB và sạc nhanh 67W.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'Redmi Note 13 128GB',
      slug: 'redmi-note-13-128gb',
      originalPrice: 5390000,
      salePrice: 4990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&auto=format&fit=crop&q=80',
      brand: 'Xiaomi',
      tags: 'xiaomi, redmi note 13, 128gb, gia re',
      description: JSON.stringify({
        screen: '6.67 inches, AMOLED, 120Hz',
        cpu: 'Snapdragon 685',
        ram: '6 GB',
        storage: '128 GB',
        camera: 'Chính 108 MP & Phụ 8 MP, 2 MP',
        battery: '5000 mAh, sạc nhanh 33W',
        weight: '188 g',
        os: 'Android 13',
        detail: 'Điện thoại quốc dân giá rẻ cấu hình ổn định, màn hình AMOLED viền siêu mỏng và camera 108MP sắc nét.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'OPPO Find X8 Pro 256GB',
      slug: 'oppo-find-x8-pro-256gb',
      originalPrice: 25990000,
      salePrice: 23990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1565849906660-4469279a555e?w=800&q=80',
      brand: 'OPPO',
      tags: 'oppo, find x8 pro, hasselblad, flagship, android',
      description: JSON.stringify({
        screen: '6.78 inches, AMOLED, 120Hz',
        cpu: 'MediaTek Dimensity 9400',
        ram: '16 GB',
        storage: '256 GB',
        camera: 'Chính 50 MP & 3 ống kính Hasselblad 50 MP',
        battery: '5910 mAh, sạc nhanh 80W',
        weight: '215 g',
        os: 'ColorOS 15',
        detail: 'Flagship mới nhất từ OPPO sở hữu viên pin Silicon-Carbon dung lượng khủng 5910mAh và hệ thống camera tinh chỉnh bởi Hasselblad.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'OPPO Reno 12 Pro 256GB',
      slug: 'oppo-reno-12-pro-256gb',
      originalPrice: 12990000,
      salePrice: 11990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
      brand: 'OPPO',
      tags: 'oppo, reno 12 pro, chuyen gia chan dung',
      description: JSON.stringify({
        screen: '6.7 inches, AMOLED, 120Hz',
        cpu: 'MediaTek Dimensity 7300-Energy',
        ram: '12 GB',
        storage: '256 GB',
        camera: 'Chính 50 MP & Phụ 50 MP, 8 MP',
        battery: '5000 mAh',
        weight: '180 g',
        os: 'ColorOS 14',
        detail: 'Thiết kế siêu mỏng nhẹ thời trang, camera selfie lên tới 50MP kết hợp công nghệ AI làm đẹp tự nhiên.'
      })
    },
    {
      categoryId: categoriesMap['Điện thoại'],
      name: 'OPPO A3 Pro 256GB',
      slug: 'oppo-a3-pro-256gb',
      originalPrice: 7490000,
      salePrice: 6990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80',
      brand: 'OPPO',
      tags: 'oppo, oppo a3 pro, 256gb, chong nuoc, best seller',
      description: JSON.stringify({
        screen: '6.7 inches, AMOLED, 120Hz',
        cpu: 'MediaTek Dimensity 7050',
        ram: '8 GB',
        storage: '256 GB',
        camera: 'Chính 64 MP & Phụ 2 MP',
        battery: '5000 mAh, sạc nhanh 67W',
        weight: '177 g',
        os: 'ColorOS 14',
        detail: 'Chiếc điện thoại siêu bền bỉ với tiêu chuẩn chống nước bụi IP69 cao nhất hiện nay, thiết kế mỏng nhẹ sang trọng.'
      })
    },

    // --- 2. LAPTOP (12 sản phẩm) ---
    {
      categoryId: categoriesMap['Laptop'],
      name: 'MacBook Pro 16" M4 Pro 24GB/512GB',
      slug: 'macbook-pro-16-inch-m4-pro-24gb-512gb',
      originalPrice: 75990000,
      salePrice: 72990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-m4-pro-spaceblack-select-202411?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'macbook, apple, m4 pro, macbook pro 16, 512gb, work, design',
      description: JSON.stringify({
        screen: '16.2 inches, Liquid Retina XDR, ProMotion 120Hz',
        cpu: 'Apple M4 Pro (14-core CPU, 20-core GPU)',
        ram: '24 GB Unified Memory',
        storage: '512 GB SSD',
        battery: 'Lên đến 24 giờ sử dụng',
        weight: '2.14 kg',
        os: 'macOS Sequoia',
        detail: 'Dòng máy trạm chuyên nghiệp cực khủng của Apple trang bị chip M4 Pro thế hệ mới, màn hình Mini-LED siêu đẹp và thời lượng pin huyền thoại.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'MacBook Pro 14" M4 16GB/512GB',
      slug: 'macbook-pro-14-inch-m4-16gb-512gb',
      originalPrice: 54990000,
      salePrice: 52990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
      brand: 'Apple',
      tags: 'macbook, apple, m4, macbook pro 14, 16gb, 512gb',
      description: JSON.stringify({
        screen: '14.2 inches, Liquid Retina XDR, 120Hz',
        cpu: 'Apple M4 (10-core CPU, 10-core GPU)',
        ram: '16 GB Unified Memory',
        storage: '512 GB SSD',
        battery: 'Lên đến 22 giờ sử dụng',
        weight: '1.55 kg',
        os: 'macOS Sequoia',
        detail: 'Sự cân bằng lý tưởng giữa hiệu năng chuyên nghiệp và kích thước cơ động 14 inch, chip M4 tối ưu hoàn hảo cho các tác vụ lập trình và thiết kế.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'MacBook Air 15" M3 16GB/256GB',
      slug: 'macbook-air-15-inch-m3-16gb-256gb',
      originalPrice: 38990000,
      salePrice: 35990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'macbook, air, m3, macbook air 15, 16gb, best seller',
      description: JSON.stringify({
        screen: '15.3 inches, Liquid Retina, 500 nits',
        cpu: 'Apple M3 (8-core CPU, 10-core GPU)',
        ram: '16 GB Unified Memory',
        storage: '256 GB SSD',
        battery: 'Lên đến 18 giờ sử dụng',
        weight: '1.51 kg',
        os: 'macOS',
        detail: 'MacBook Air màn hình lớn 15.3 inch siêu mỏng nhẹ chỉ 11.5mm, chip M3 mạnh mẽ và quạt tản nhiệt không tiếng ồn.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'MacBook Air 13" M3 8GB/256GB',
      slug: 'macbook-air-13-inch-m3-8gb-256gb',
      originalPrice: 29990000,
      salePrice: 27990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'macbook, air, m3, macbook air 13, best seller',
      description: JSON.stringify({
        screen: '13.6 inches, Liquid Retina, 500 nits',
        cpu: 'Apple M3 (8-core CPU, 8-core GPU)',
        ram: '8 GB Unified Memory',
        storage: '256 GB SSD',
        battery: 'Lên đến 18 giờ',
        weight: '1.24 kg',
        os: 'macOS',
        detail: 'Chiếc laptop siêu di động được yêu thích nhất thế giới được nâng cấp lên chip M3 mạnh mẽ vượt trội.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'Dell XPS 15 i9/32GB/1TB',
      slug: 'dell-xps-15-i9-32gb-1tb',
      originalPrice: 48990000,
      salePrice: 45990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&auto=format&fit=crop&q=80',
      brand: 'Dell',
      tags: 'dell, xps, xps 15, i9, 32gb, 1tb, windows',
      description: JSON.stringify({
        screen: '15.6 inches, OLED 3.5K Touch, 400 nits',
        cpu: 'Intel Core i9-13900H',
        ram: '32 GB DDR5',
        storage: '1 TB PCIe NVMe SSD',
        graphics: 'NVIDIA GeForce RTX 4060 8GB',
        weight: '1.92 kg',
        os: 'Windows 11 Home',
        detail: 'Laptop cao cấp mỏng nhẹ bậc nhất cho giới doanh nhân và thiết kế đồ hoạ với màn hình viền mỏng vô cực OLED 3.5K cảm ứng tuyệt đẹp.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'Dell Inspiron 15 i7/16GB/512GB',
      slug: 'dell-inspiron-15-i7-16gb-512gb',
      originalPrice: 21990000,
      salePrice: 19990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
      brand: 'Dell',
      tags: 'dell, inspiron, i7, 16gb, 512gb, van phong',
      description: JSON.stringify({
        screen: '15.6 inches, Full HD, 120Hz',
        cpu: 'Intel Core i7-1355U',
        ram: '16 GB DDR4',
        storage: '512 GB SSD',
        graphics: 'Intel Iris Xe Graphics',
        weight: '1.65 kg',
        os: 'Windows 11',
        detail: 'Lựa chọn tin cậy cho học sinh sinh viên và văn phòng với thiết kế thanh lịch, bàn phím gõ êm ái và màn hình chống chói.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'Dell Gaming G15 RTX 4060/16GB',
      slug: 'dell-gaming-g15-rtx-4060-16gb',
      originalPrice: 27990000,
      salePrice: 25990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80',
      brand: 'Dell',
      tags: 'dell, gaming, g15, rtx 4060, 16gb, game',
      description: JSON.stringify({
        screen: '15.6 inches, FHD, 165Hz',
        cpu: 'Intel Core i7-13650HX',
        ram: '16 GB DDR5',
        storage: '512 GB SSD',
        graphics: 'NVIDIA GeForce RTX 4060 8GB',
        weight: '2.65 kg',
        os: 'Windows 11',
        detail: 'Chiến thần gaming phân khúc tầm trung với tản nhiệt lấy cảm hứng từ dòng Alienware cao cấp, chip dòng HX cực mạnh.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'ASUS ROG Strix G16 RTX 4070/32GB',
      slug: 'asus-rog-strix-g16-rtx-4070-32gb',
      originalPrice: 48990000,
      salePrice: 45990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
      brand: 'ASUS',
      tags: 'asus, rog, strix g16, rtx 4070, gaming, 32gb, flagship',
      description: JSON.stringify({
        screen: '16 inches, QHD+ Rog Nebula Display, 240Hz',
        cpu: 'Intel Core i9-13980HX',
        ram: '32 GB DDR5',
        storage: '1 TB PCIe NVMe SSD',
        graphics: 'NVIDIA GeForce RTX 4070 8GB',
        weight: '2.50 kg',
        os: 'Windows 11',
        detail: 'Laptop gaming cao cấp sở hữu màn hình Nebula 240Hz đỉnh cao, cấu hình Core i9 kết hợp RTX 4070 giúp gánh mọi tựa game AAA.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'ASUS ZenBook 14 OLED i7/16GB',
      slug: 'asus-zenbook-14-oled-i7-16gb',
      originalPrice: 24990000,
      salePrice: 22990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
      brand: 'ASUS',
      tags: 'asus, zenbook, oled, ultra thin, i7, 16gb',
      description: JSON.stringify({
        screen: '14 inches, OLED 2.8K, 120Hz, 100% DCI-P3',
        cpu: 'Intel Core i7-1360P',
        ram: '16 GB LPDDR5',
        storage: '512 GB SSD',
        graphics: 'Intel Iris Xe Graphics',
        weight: '1.39 kg',
        os: 'Windows 11',
        detail: 'Kiệt tác mỏng nhẹ sang trọng bậc nhất với màn hình OLED 2.8K 120Hz rực rỡ, dung lượng pin bền bỉ ấn tượng.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'ASUS VivoBook 15 i5/8GB/512GB',
      slug: 'asus-vivobook-15-i5-8gb-512gb',
      originalPrice: 16490000,
      salePrice: 14990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
      brand: 'ASUS',
      tags: 'asus, vivobook, i5, 8gb, sinh vien, best seller',
      description: JSON.stringify({
        screen: '15.6 inches, Full HD IPS',
        cpu: 'Intel Core i5-1240P',
        ram: '8 GB DDR4',
        storage: '512 GB SSD',
        weight: '1.70 kg',
        os: 'Windows 11',
        detail: 'Laptop sinh viên bán chạy nhất với thiết kế mỏng, bản lề mở phẳng 180 độ độc đáo và hiệu năng mượt mà.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'HP Spectre x360 i7/16GB/1TB',
      slug: 'hp-spectre-x360-i7-16gb-1tb',
      originalPrice: 38990000,
      salePrice: 35990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
      brand: 'HP',
      tags: 'hp, spectre, x360, xoay gap 360, i7, 16gb, premium',
      description: JSON.stringify({
        screen: '13.5 inches, OLED 3K2K Touch, xoay gập 360 độ',
        cpu: 'Intel Core i7-1355U',
        ram: '16 GB LPDDR5',
        storage: '1 TB SSD',
        weight: '1.36 kg',
        os: 'Windows 11',
        detail: 'Siêu phẩm xoay gập 2-trong-1 sang trọng bậc nhất thế giới, thiết kế cắt vát kim cương độc đáo, kèm bút cảm ứng HP Stylus.'
      })
    },
    {
      categoryId: categoriesMap['Laptop'],
      name: 'HP Pavilion 15 i5/8GB/512GB',
      slug: 'hp-pavilion-15-i5-8gb-512gb',
      originalPrice: 15490000,
      salePrice: 13990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
      brand: 'HP',
      tags: 'hp, pavilion, i5, 8gb, 512gb, gia tot',
      description: JSON.stringify({
        screen: '15.6 inches, Full HD IPS',
        cpu: 'Intel Core i5-1335U',
        ram: '8 GB DDR4',
        storage: '512 GB SSD',
        weight: '1.75 kg',
        os: 'Windows 11',
        detail: 'Chiếc laptop quốc dân thiết kế nhôm bạc thời trang, phục vụ học tập, làm việc văn phòng, xem phim giải trí.'
      })
    },

    // --- 3. TAI NGHE (10 sản phẩm) ---
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'AirPods Pro 2 USB-C',
      slug: 'airpods-pro-2-usb-c',
      originalPrice: 6990000,
      salePrice: 6490000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=800&hei=800&fmt=jpeg&qlt=95',
      brand: 'Apple',
      tags: 'airpods, apple, tai nghe bluetooth, anc, hot',
      description: JSON.stringify({
        type: 'In-ear, True Wireless',
        chip: 'Apple H2',
        anc: 'Chống ồn chủ động thích ứng gấp 2 lần',
        battery: 'Lên đến 6 giờ (kèm hộp sạc lên đến 30 giờ)',
        charging: 'USB-C, MagSafe, sạc không dây Qi',
        waterproof: 'IP54 kháng nước bụi',
        detail: 'Tai nghe chống ồn tốt nhất của Apple nay nâng cấp cổng sạc USB-C và chất âm Spatial Audio sống động.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'AirPods 4 ANC',
      slug: 'airpods-4-anc',
      originalPrice: 4990000,
      salePrice: 4490000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-4-hero-select-202409?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'airpods, apple, airpods 4, anc, best seller',
      description: JSON.stringify({
        type: 'Open-ear, True Wireless',
        chip: 'Apple H2',
        anc: 'Chống ồn chủ động trên thiết kế mở',
        battery: 'Lên đến 5 giờ (kèm hộp sạc lên đến 24 giờ)',
        charging: 'USB-C',
        detail: 'Dòng AirPods tiêu chuẩn đầu tiên được trang bị công nghệ chống ồn chủ động thích ứng trên thiết kế Open-ear thoải mái.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'AirPods Max USB-C',
      slug: 'airpods-max-usb-c',
      originalPrice: 14990000,
      salePrice: 13990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=800&auto=format&fit=crop&q=80',
      brand: 'Apple',
      tags: 'airpods, apple, airpods max, over-ear, usb-c',
      description: JSON.stringify({
        type: 'Over-ear, chụp tai',
        chip: 'Apple H1 trên mỗi tai',
        anc: 'Chống ồn chủ động & Xuyên âm',
        battery: 'Lên đến 20 giờ',
        charging: 'USB-C',
        detail: 'Tai nghe chụp tai hi-end từ Apple mang lại chất âm audiophile đỉnh cao, thiết kế đệm lưới thoáng khí và khung kim loại sang trọng.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'Samsung Galaxy Buds3 Pro',
      slug: 'samsung-galaxy-buds3-pro',
      originalPrice: 5490000,
      salePrice: 4990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2407/gallery/vn-galaxy-buds3-pro-r630-sm-r630nzaaxxv-thumb-542100806?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy buds, buds3 pro, tai nghe bluetooth, best seller',
      description: JSON.stringify({
        type: 'In-ear, True Wireless',
        anc: 'Chống ồn chủ động thông minh với Galaxy AI',
        battery: 'Lên đến 7 giờ (kèm hộp sạc lên đến 30 giờ)',
        charging: 'USB-C, sạc không dây',
        detail: 'Thiết kế mới đột phá với dải đèn Blade Light độc đáo, chất âm Hi-Fi 24-bit sắc nét và chống ồn tối ưu tự động bằng AI.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'Samsung Galaxy Buds3',
      slug: 'samsung-galaxy-buds3',
      originalPrice: 3990000,
      salePrice: 2990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2407/gallery/vn-galaxy-buds3-r530-sm-r530nzaaxxv-thumb-542102072?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, buds3, galaxy buds, open ear',
      description: JSON.stringify({
        type: 'Open-ear, True Wireless',
        anc: 'Có chống ồn chủ động ANC',
        battery: 'Lên đến 5 giờ',
        charging: 'USB-C',
        detail: 'Dòng tai nghe open-ear vừa vặn, thiết kế hiện đại góc cạnh và kết nối mượt mà trong hệ sinh thái Galaxy.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      originalPrice: 8490000,
      salePrice: 7490000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&auto=format&fit=crop&q=80',
      brand: 'Sony',
      tags: 'sony, wh-1000xm5, over-ear, chong on, hot',
      description: JSON.stringify({
        type: 'Over-ear, chụp tai',
        anc: 'Chống ồn dẫn đầu thị trường với 8 micro',
        battery: 'Lên đến 30 giờ (sạc nhanh 3 phút được 3 giờ)',
        charging: 'USB-C',
        weight: '250 g',
        detail: 'Ông vua chống ồn phân khúc tai nghe chụp tai với thiết kế tinh tế mỏng nhẹ, khả năng đàm thoại rõ nét vượt trội.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'Sony WF-1000XM5',
      slug: 'sony-wf-1000xm5',
      originalPrice: 6990000,
      salePrice: 5990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      brand: 'Sony',
      tags: 'sony, wf-1000xm5, in-ear, hi-res audio',
      description: JSON.stringify({
        type: 'In-ear, True Wireless',
        anc: 'Chống ồn chủ động cao cấp',
        battery: 'Lên đến 8 giờ (kèm hộp sạc lên đến 24 giờ)',
        charging: 'USB-C, Qi',
        detail: 'Chất âm Hi-Res Audio xuất sắc, thiết kế nút tai cao su bọt biển độc quyền giúp bám tai chắc chắn và cách âm thụ động cực tốt.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'Bose QuietComfort Ultra',
      slug: 'bose-quietcomfort-ultra',
      originalPrice: 9990000,
      salePrice: 8990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      brand: 'Bose',
      tags: 'bose, quietcomfort, over-ear, am thanh 3d',
      description: JSON.stringify({
        type: 'Over-ear, chụp tai',
        anc: 'Chống ồn chủ động đỉnh cao',
        battery: 'Lên đến 24 giờ',
        charging: 'USB-C',
        detail: 'Mang lại trải nghiệm đeo êm ái hàng đầu thế giới đúng như tên gọi QuietComfort, tích hợp âm thanh không gian Immersive Audio.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'Jabra Elite 10',
      slug: 'jabra-elite-10',
      originalPrice: 5990000,
      salePrice: 4990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      brand: 'Jabra',
      tags: 'jabra, elite 10, the thao, in-ear',
      description: JSON.stringify({
        type: 'In-ear, True Wireless',
        anc: 'Advanced ANC của Jabra',
        battery: 'Lên đến 6 giờ (kèm hộp sạc lên đến 27 giờ)',
        waterproof: 'IP57 chống nước bụi mạnh mẽ',
        detail: 'Thiết kế tối ưu cho đàm thoại công việc và thể thao với chuẩn chống nước IP57 và công nghệ Dolby Atmos chất lượng cao.'
      })
    },
    {
      categoryId: categoriesMap['Tai nghe'],
      name: 'Xiaomi Buds 5 Pro',
      slug: 'xiaomi-buds-5-pro',
      originalPrice: 2990000,
      salePrice: 2490000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
      brand: 'Xiaomi',
      tags: 'xiaomi, buds 5 pro, gia re, best seller',
      description: JSON.stringify({
        type: 'In-ear, True Wireless',
        anc: 'Chống ồn chủ động thông minh 52dB',
        battery: 'Lên đến 6.5 giờ (kèm hộp sạc lên đến 38 giờ)',
        charging: 'USB-C',
        detail: 'Tai nghe phân khúc phổ thông có chống ồn tốt nhất lên tới 52dB, hỗ trợ codec LDAC cho âm thanh độ chi tiết cao.'
      })
    },

    // --- 4. ĐỒNG HỒ (8 sản phẩm) ---
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Apple Watch Series 10 GPS 46mm',
      slug: 'apple-watch-series-10-gps-46mm',
      originalPrice: 12490000,
      salePrice: 11990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s10-hero-202409?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'apple watch, series 10, smartwatch, ios, apple, hot',
      description: JSON.stringify({
        screen: 'OLED Retina Always-On, viền siêu mỏng',
        size: '46 mm',
        material: 'Vỏ Nhôm mạ Anodized / Titan',
        battery: 'Lên đến 18 giờ (sạc nhanh 80% trong 30 phút)',
        sensors: 'Đo nhịp tim, Điện tâm đồ ECG, Đo oxy SpO2, Đo nhiệt độ, Phát hiện ngưng thở khi ngủ',
        waterproof: 'Chống nước 50m (WR50)',
        detail: 'Đồng hồ thông minh mỏng nhất từ trước đến nay của Apple, màn hình lớn hơn cả bản Ultra, hỗ trợ phát hiện chứng ngưng thở khi ngủ.'
      })
    },
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Apple Watch Series 10 GPS 42mm',
      slug: 'apple-watch-series-10-gps-42mm',
      originalPrice: 10990000,
      salePrice: 10490000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s10-hero-202409?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'apple watch, series 10, 42mm, apple',
      description: JSON.stringify({
        screen: 'OLED Retina Always-On',
        size: '42 mm',
        material: 'Vỏ Nhôm',
        battery: 'Lên đến 18 giờ',
        sensors: 'Nhịp tim, ECG, SpO2, Nhiệt độ cơ thể',
        detail: 'Phiên bản nhỏ gọn hơn 42mm phù hợp cho những người có cổ tay nhỏ, sở hữu đầy đủ tính năng sức khỏe cao cấp của dòng Series 10.'
      })
    },
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Apple Watch Ultra 2',
      slug: 'apple-watch-ultra-2',
      originalPrice: 23990000,
      salePrice: 22990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra-2-hero-202309?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'apple watch, ultra 2, smartwatch, premium',
      description: JSON.stringify({
        screen: 'Always-On Retina, độ sáng lên đến 3000 nits',
        size: '49 mm',
        material: 'Vỏ Titan cấp hàng không vũ trụ',
        battery: 'Lên đến 36 giờ (chế độ tiết kiệm pin lên đến 72 giờ)',
        sensors: 'GPS tần số kép, Đo độ sâu, Cảm biến nhiệt độ nước, Nhịp tim, SpO2, ECG',
        waterproof: 'Chống nước 100m, chứng nhận lặn EN13319',
        detail: 'Dành cho các vận động viên thể thao chuyên nghiệp và nhà thám hiểm, thiết kế Titan hầm hố siêu bền, pin trâu và GPS siêu chính xác.'
      })
    },
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Samsung Galaxy Watch 7 44mm',
      slug: 'samsung-galaxy-watch-7-44mm',
      originalPrice: 7990000,
      salePrice: 7490000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2407/gallery/vn-galaxy-watch7-l310-sm-l310nzkaxxv-thumb-542095696?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy watch 7, smartwatch, android, best seller',
      description: JSON.stringify({
        screen: 'Super AMOLED Always-On',
        size: '44 mm',
        material: 'Vỏ nhôm Armor Aluminum',
        battery: 'Lên đến 40 giờ',
        sensors: 'Cảm biến BioActive thế hệ mới, Điện tâm đồ, Đo huyết áp, Phân tích thành phần cơ thể BIA',
        os: 'Wear OS 5',
        detail: 'Tích hợp cảm biến BioActive nâng cấp đo lường chính xác các chỉ số sức khoẻ, hỗ trợ các bài tập thể thao thông minh cùng AI.'
      })
    },
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Samsung Galaxy Watch Ultra',
      slug: 'samsung-galaxy-watch-ultra',
      originalPrice: 13990000,
      salePrice: 12990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2407/gallery/vn-galaxy-watch-ultra-l705-sm-l705fzkaxxv-thumb-542092100?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'samsung, galaxy watch ultra, watch ultra, android, hot',
      description: JSON.stringify({
        screen: 'Super AMOLED 3000 nits',
        size: '47 mm',
        material: 'Vỏ Titan cấp hàng hải',
        battery: 'Lên đến 100 giờ (chế độ tiết kiệm pin)',
        waterproof: '10 ATM (100m) kháng nước biển',
        detail: 'Đối thủ trực tiếp của Apple Watch Ultra từ nhà Samsung với thiết kế viền vuông đệm tròn phá cách, khả năng hoạt động ở các điều kiện khắc nghiệt.'
      })
    },
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Garmin Forerunner 965',
      slug: 'garmin-forerunner-965',
      originalPrice: 16990000,
      salePrice: 15990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
      brand: 'Garmin',
      tags: 'garmin, runner, chay bo, forerunner 965, GPS',
      description: JSON.stringify({
        screen: 'AMOLED sắc nét, viền Titanium',
        size: '47 mm',
        battery: 'Lên đến 23 ngày ở chế độ đồng hồ thông minh (31 giờ chế độ GPS)',
        sensors: 'Bản đồ màu tích hợp, GPS đa băng tần SatIQ, Đo mức độ phục hồi, HRV Status',
        detail: 'Đồng hồ chạy bộ và ba môn phối hợp cao cấp nhất của Garmin, màn hình AMOLED rực rỡ và thời lượng pin cực khủng đo bằng tuần.'
      })
    },
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Xiaomi Watch S3',
      slug: 'xiaomi-watch-s3',
      originalPrice: 3490000,
      salePrice: 2990000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
      brand: 'Xiaomi',
      tags: 'xiaomi, watch s3, gia re, best seller',
      description: JSON.stringify({
        screen: '1.43 inches, AMOLED, 60Hz',
        size: '47 mm',
        battery: 'Lên đến 15 ngày sử dụng',
        os: 'Xiaomi HyperOS',
        detail: 'Thiết kế viền bezel có thể tháo rời và thay thế vô cùng độc đáo, thời lượng pin cực dài và giao diện mượt mà.'
      })
    },
    {
      categoryId: categoriesMap['Đồng hồ'],
      name: 'Amazfit GTR 4',
      slug: 'amazfit-gtr-4',
      originalPrice: 3990000,
      salePrice: 3490000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=800&q=80',
      brand: 'Amazfit',
      tags: 'amazfit, gtr 4, gia tot',
      description: JSON.stringify({
        screen: '1.43 inches, AMOLED',
        size: '46 mm',
        battery: 'Lên đến 14 ngày sử dụng',
        sensors: 'GPS anten phân cực tròn đầu tiên, 150+ chế độ thể thao',
        detail: 'Đồng hồ thông minh thể thao có định vị GPS cực chuẩn, thiết kế cổ điển lịch lãm và pin sử dụng lâu.'
      })
    },

    // --- 5. PHỤ KIỆN (15 sản phẩm) ---
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Sạc Apple 35W Dual USB-C',
      slug: 'sac-apple-35w-dual-usb-c',
      originalPrice: 1290000,
      salePrice: 1190000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MNWP3?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'sac apple, sac 35w, cu sac, apple, dual usb-c, best seller',
      description: JSON.stringify({
        power: '35 W',
        ports: '2 cổng USB-C',
        compatibility: 'iPhone, iPad, MacBook Air, Apple Watch',
        detail: 'Củ sạc chính hãng Apple thiết kế nhỏ gọn với 2 cổng USB-C cho phép sạc song song hai thiết bị vô cùng tiện lợi.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Sạc Samsung 45W Super Fast',
      slug: 'sac-samsung-45w-super-fast',
      originalPrice: 990000,
      salePrice: 890000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/ep-t4510xbegvn/gallery/vn-power-adapter-45w-ep-t4510-ep-t4510xbegvn-thumb-531477793?$344_344_PNG$',
      brand: 'Samsung',
      tags: 'sac samsung, sac 45w, cu sac, fast charging, best seller',
      description: JSON.stringify({
        power: '45 W',
        ports: '1 cổng USB-C (kèm cáp C-to-C 5A)',
        compatibility: 'Các dòng Samsung Galaxy S, Note hỗ trợ Super Fast Charging 2.0',
        detail: 'Sạc nhanh siêu tốc 45W chính hãng Samsung giúp làm đầy pin các dòng điện thoại cao cấp S25 Ultra, S24 Ultra trong thời gian ngắn nhất.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Cáp USB-C Apple 1m',
      slug: 'cap-usb-c-apple-1m',
      originalPrice: 690000,
      salePrice: 590000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQKY3?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'cap apple, cap type c, cap 1m, usb-c',
      description: JSON.stringify({
        length: '1 m',
        material: 'Vỏ dù bện bền bỉ',
        power: 'Hỗ trợ sạc lên đến 60W',
        detail: 'Cáp sạc USB-C chính hãng Apple vỏ ngoài được dệt bằng sợi bện cao cấp tăng khả năng chống đứt gãy, chống rối.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Cáp Anker USB-C 100W',
      slug: 'cap-anker-usb-c-100w',
      originalPrice: 490000,
      salePrice: 390000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
      brand: 'Anker',
      tags: 'cap anker, cap 100w, cap type c, best seller',
      description: JSON.stringify({
        length: '1.8 m',
        power: 'Hỗ trợ sạc nhanh lên đến 100W',
        dataTransfer: '480 Mbps',
        detail: 'Cáp sạc siêu nhanh hỗ trợ sạc các dòng Laptop, MacBook, iPad công suất cao. Thiết kế bọc nilon hai lớp siêu bền.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Pin dự phòng Anker 20000mAh 65W',
      slug: 'pin-du-phong-anker-20000mah-65w',
      originalPrice: 1790000,
      salePrice: 1490000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&q=80',
      brand: 'Anker',
      tags: 'pin du phong, powerbank, anker, 20000mah, 65w, hot',
      description: JSON.stringify({
        capacity: '20.000 mAh',
        power: 'Cổng đơn USB-C tối đa 65W',
        ports: '2 cổng USB-C, 1 cổng USB-A',
        detail: 'Pin dự phòng dung lượng lớn, công suất 65W hỗ trợ sạc cả laptop và MacBook. Có màn hình LED hiển thị % pin.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Ốp MagSafe iPhone 16 Pro Max',
      slug: 'op-magsafe-iphone-16-pro-max',
      originalPrice: 590000,
      salePrice: 490000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MY1Y3?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'op lung, op iphone 16, magsafe, phu kien iphone',
      description: JSON.stringify({
        material: 'Nhựa dẻo TPU cao cấp / Silicon chống bám vân tay',
        magsafe: 'Có tích hợp nam châm MagSafe hít cực chắc',
        compatibility: 'iPhone 16 Pro Max',
        detail: 'Ốp lưng chính hãng Apple bảo vệ toàn diện, tương thích sạc không dây nam châm MagSafe.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Kính cường lực iPhone 16 Pro Max',
      slug: 'kinh-cuong-luc-iphone-16-pro-max',
      originalPrice: 390000,
      salePrice: 290000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&auto=format&fit=crop&q=80',
      brand: 'Mipow',
      tags: 'cuong luc, dan man hinh, phu kien iphone, best seller',
      description: JSON.stringify({
        material: 'Thủy tinh Silicate siêu bền chịu lực 9H',
        thickness: '0.33 mm',
        feature: 'Chống bám vân tay, chống lóa, hạn chế ánh sáng xanh',
        detail: 'Kính cường lực cao cấp Mipow giúp bảo vệ màn hình 6.9 inch đắt đỏ của iPhone 16 Pro Max khỏi va đập, trầy xước.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Ốp Samsung S25 Ultra chính hãng',
      slug: 'op-samsung-s25-ultra-chinh-hang',
      originalPrice: 490000,
      salePrice: 390000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
      brand: 'Samsung',
      tags: 'op lung, op samsung, op s25 ultra',
      description: JSON.stringify({
        material: 'Silicon mềm mịn bảo vệ máy',
        feature: 'Hỗ trợ chân đế gập tiện lợi',
        compatibility: 'Galaxy S25 Ultra',
        detail: 'Ốp lưng tích hợp vòng tay cầm kiêm chân đế dựng điện thoại vô cùng tiện lợi cho việc xem phim, làm việc giải trí.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Magic Keyboard Touch ID',
      slug: 'magic-keyboard-touch-id',
      originalPrice: 3590000,
      salePrice: 3290000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MK2C3?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'ban phim apple, magic keyboard, touch id',
      description: JSON.stringify({
        layout: 'Compact tiêu chuẩn Apple',
        connectivity: 'Bluetooth, sạc qua Lightning / USB-C',
        feature: 'Tích hợp cảm biến vân tay Touch ID mở khóa nhanh',
        compatibility: 'Các dòng Mac chạy chip Apple Silicon',
        detail: 'Bàn phím không dây chính hãng Apple gõ cực êm, tích hợp cảm biến vân tay Touch ID bảo mật cao.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Magic Mouse Apple',
      slug: 'magic-mouse-apple',
      originalPrice: 2390000,
      salePrice: 2190000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MXK53?wid=800&hei=800&fmt=jpeg&qlt=90',
      brand: 'Apple',
      tags: 'chuot apple, magic mouse, bluetooth',
      description: JSON.stringify({
        connectivity: 'Bluetooth, Lightning / USB-C',
        feature: 'Bề mặt cảm ứng đa điểm Multi-Touch cuộn vuốt mượt mà',
        detail: 'Thiết kế tối giản sang trọng đặc trưng của Apple, hỗ trợ cử chỉ vuốt chạm Multi-Touch độc quyền trên macOS.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Logitech MX Keys S',
      slug: 'logitech-mx-keys-s',
      originalPrice: 2790000,
      salePrice: 2490000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80',
      brand: 'Logitech',
      tags: 'ban phim, logitech, mx keys s, ban phim co van phong, hot',
      description: JSON.stringify({
        connectivity: 'Logi Bolt USB, Bluetooth',
        layout: 'Full size, phím lõm ôm tay',
        battery: 'Lên đến 10 ngày bật đèn nền, 5 tháng tắt đèn nền',
        compatibility: 'Windows, macOS, Linux, Android',
        detail: 'Bàn phím văn phòng cao cấp bậc nhất, hỗ trợ gõ cực nhanh, êm ái, đèn nền thông minh tự động sáng khi tay đến gần.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Logitech MX Master 3S',
      slug: 'logitech-mx-master-3s',
      originalPrice: 2490000,
      salePrice: 2190000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
      brand: 'Logitech',
      tags: 'chuot, logitech, mx master 3s, chuot van phong, best seller',
      description: JSON.stringify({
        sensor: 'Darkfield 8000 DPI (di chuột được trên kính)',
        connectivity: 'Bluetooth, Logi Bolt',
        buttons: '7 nút lập trình được, cuộn siêu tốc MagSpeed cuộn 1000 dòng/giây',
        detail: 'Chuột công thái học đỉnh cao của Logitech, nút click siêu êm tĩnh lặng và bánh xe cuộn thép MagSpeed vô song.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'LG UltraWide 34" 2K',
      slug: 'lg-ultrawide-34-inch-2k',
      originalPrice: 13990000,
      salePrice: 12990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
      brand: 'LG',
      tags: 'man hinh lg, lg 34, man hinh cong, ultrawide, hot',
      description: JSON.stringify({
        size: '34 inches, màn hình cong IPS',
        resolution: 'UWQHD (3440 x 1440), tỉ lệ 21:9',
        refreshRate: '160Hz, hỗ trợ HDR10, AMD FreeSync',
        ports: '2x HDMI, DisplayPort, Audio Out',
        detail: 'Màn hình siêu rộng 21:9 mang lại không gian làm việc rộng rãi đa nhiệm và trải nghiệm chơi game vô cùng đắm chìm.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Samsung Smart Monitor 32" 4K',
      slug: 'samsung-smart-monitor-32-inch-4k',
      originalPrice: 10990000,
      salePrice: 9990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
      brand: 'Samsung',
      tags: 'man hinh samsung, smart monitor, 32 inch, 4k',
      description: JSON.stringify({
        size: '32 inches, màn hình phẳng VA',
        resolution: '4K Ultra HD (3840 x 2160)',
        smartFeatures: 'Tích hợp hệ điều hành Tizen, Netflix, YouTube không cần PC, kèm điều khiển từ xa',
        ports: 'HDMI, USB-C (hỗ trợ sạc ngược 65W)',
        detail: 'Vừa là màn hình máy tính vừa là TV thông minh độc lập hỗ trợ giải trí xem phim AirPlay 2 tiện lợi.'
      })
    },
    {
      categoryId: categoriesMap['Phụ kiện'],
      name: 'Giá đỡ điện thoại Belkin',
      slug: 'gia-do-dien-thoai-belkin',
      originalPrice: 590000,
      salePrice: 490000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
      brand: 'Belkin',
      tags: 'phu kien, gia do dien thoai, belkin',
      description: JSON.stringify({
        material: 'Nhôm nguyên khối chắc chắn',
        feature: 'Xoay 360 độ, điều chỉnh độ cao góc nghiêng',
        compatibility: 'Mọi dòng điện thoại thông minh',
        detail: 'Giá đỡ sang trọng chắc chắn giúp giữ điện thoại rảnh tay khi làm việc hoặc gọi video call.'
      })
    },

    // --- 6. LINH KIỆN (10 sản phẩm) ---
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'RAM Kingston 16GB DDR5',
      slug: 'ram-kingston-16gb-ddr5',
      originalPrice: 1490000,
      salePrice: 1290000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1610664921890-5b6e1c0d5b87?w=800&q=80',
      brand: 'Kingston',
      tags: 'ram, ddr5, ram kingston, ram pc, best seller',
      description: JSON.stringify({
        capacity: '16 GB',
        type: 'DDR5 SDRAM PC',
        speed: '5600 MHz (CL40)',
        voltage: '1.25 V',
        detail: 'Dòng RAM DDR5 hiệu năng cao giúp tối ưu băng thông máy tính, hỗ trợ đa nhiệm mượt mà.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'RAM Samsung 32GB DDR5',
      slug: 'ram-samsung-32gb-ddr5',
      originalPrice: 2690000,
      salePrice: 2490000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80',
      brand: 'Samsung',
      tags: 'ram, ddr5, ram samsung, 32gb',
      description: JSON.stringify({
        capacity: '32 GB',
        type: 'DDR5',
        speed: '4800 MHz',
        detail: 'Bộ nhớ RAM dung lượng cao từ nhà sản xuất chip bán dẫn Samsung, cực kỳ bền bỉ và ổn định.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'SSD Samsung 970 EVO Plus 1TB',
      slug: 'ssd-samsung-970-evo-plus-1tb',
      originalPrice: 2490000,
      salePrice: 2190000,
      stock: getRandomStock(),
      status: ProductStatus.BEST_SELLER,
      imageUrl: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&q=80',
      brand: 'Samsung',
      tags: 'ssd, nvme, ssd samsung, 1tb, best seller',
      description: JSON.stringify({
        capacity: '1 TB',
        interface: 'PCIe Gen 3.0 x4, NVMe 1.3',
        readSpeed: 'Lên đến 3500 MB/s',
        writeSpeed: 'Lên đến 3300 MB/s',
        formFactor: 'M.2 2280',
        detail: 'Ổ cứng SSD quốc dân về độ bền và độ ổn định, tốc độ đọc ghi cao giúp khởi động hệ điều hành cực nhanh.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'SSD WD Black SN850X 2TB',
      slug: 'ssd-wd-black-sn850x-2tb',
      originalPrice: 3890000,
      salePrice: 3490000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1628546111815-4ba8c7340b15?w=800&q=80',
      brand: 'Western Digital',
      tags: 'ssd, wd black, sn850x, nvme gen 4, ssd 2tb, hot',
      description: JSON.stringify({
        capacity: '2 TB',
        interface: 'PCIe Gen 4.0 x4, NVMe 1.4',
        readSpeed: 'Lên đến 7300 MB/s',
        writeSpeed: 'Lên đến 6600 MB/s',
        detail: 'SSD chuẩn PCIe Gen 4 siêu tốc phục vụ chuyên sâu cho các game thủ và các công việc xử lý dữ liệu nặng.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'Card đồ họa RTX 4060 8GB',
      slug: 'card-do-hoa-rtx-4060-8gb',
      originalPrice: 10990000,
      salePrice: 9990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80',
      brand: 'ASUS',
      tags: 'card do hoa, vga, rtx 4060, nvidia, linh kien pc, hot',
      description: JSON.stringify({
        chipset: 'NVIDIA GeForce RTX 4060',
        vram: '8 GB GDDR6 (128-bit)',
        cudaCores: '3072',
        features: 'Ray Tracing thế hệ 3, DLSS 3 cực mạnh',
        detail: 'Card đồ họa tối ưu nhất cho cấu hình PC gaming trung cấp, cân mượt mọi game độ phân giải Full HD/2K thiết lập đồ hoạ cao.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'CPU Intel Core i9-14900K',
      slug: 'cpu-intel-core-i9-14900k',
      originalPrice: 13990000,
      salePrice: 12990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80',
      brand: 'Intel',
      tags: 'cpu intel, core i9, i9 14900k, vi xu ly, socket lga1700',
      description: JSON.stringify({
        cores: '24 Cores (8 P-cores & 16 E-cores)',
        threads: '32 Threads',
        maxFrequency: 'Up to 6.0 GHz',
        cache: '36 MB Intel Smart Cache',
        socket: 'LGA1700',
        detail: 'Vi xử lý siêu khủng thế hệ 14 của Intel với xung nhịp chạm mốc 6.0GHz ngay khi xuất xưởng, xử lý render 3D, dựng phim mượt mà.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'CPU AMD Ryzen 9 7950X',
      slug: 'cpu-amd-ryzen-9-7950x',
      originalPrice: 14990000,
      salePrice: 13990000,
      stock: getRandomStock(true),
      status: ProductStatus.HOT,
      imageUrl: 'https://images.unsplash.com/photo-1555617171-a072c97e2ab5?w=800&q=80',
      brand: 'AMD',
      tags: 'cpu amd, ryzen 9, 7950x, socket am5, hot',
      description: JSON.stringify({
        cores: '16 Cores',
        threads: '32 Threads',
        maxFrequency: 'Up to 5.7 GHz',
        socket: 'AM5',
        process: 'TSMC 5nm FinFET',
        detail: 'Bộ vi xử lý đa nhân cực mạnh từ AMD kiến trúc Zen 4, dẫn đầu về hiệu năng trên mỗi watt điện tiêu thụ.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'Mainboard ASUS ROG Z790',
      slug: 'mainboard-asus-rog-z790',
      originalPrice: 9990000,
      salePrice: 8990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      brand: 'ASUS',
      tags: 'bo mach chu, mainboard, z790, rog strix, intel',
      description: JSON.stringify({
        chipset: 'Intel Z790',
        socket: 'LGA1700 (Hỗ trợ Intel Gen 12, 13, 14)',
        ramSupport: '4x DDR5 (Lên đến 192GB, OC 7800+ MHz)',
        formFactor: 'ATX',
        detail: 'Bo mạch chủ phân khúc cao cấp hỗ trợ ép xung cực đỉnh, thiết kế tản nhiệt VRM hầm hố và hệ thống đèn LED RGB cá tính.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'Tản nhiệt Noctua NH-D15',
      slug: 'tan-nhiet-noctua-nh-d15',
      originalPrice: 2290000,
      salePrice: 1990000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
      brand: 'Noctua',
      tags: 'tan nhiet, quat cpu, Noctua, tan khi pc',
      description: JSON.stringify({
        type: 'Tản nhiệt khí tháp đôi',
        fans: '2x NF-A15 PWM 140mm',
        compatibility: 'Intel LGA1700, LGA1200, AMD AM5, AM4',
        noiseLevel: 'Tối đa 24.6 dB(A) siêu êm',
        detail: 'Huyền thoại tản nhiệt khí tốt nhất thế giới, hiệu năng làm mát tương đương tản nhiệt nước AIO 240mm nhưng cực kỳ bền bỉ và yên tĩnh.'
      })
    },
    {
      categoryId: categoriesMap['Linh kiện'],
      name: 'Case Lian Li O11 Dynamic',
      slug: 'case-lian-li-o11-dynamic',
      originalPrice: 3890000,
      salePrice: 3490000,
      stock: getRandomStock(),
      status: ProductStatus.NORMAL,
      imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
      brand: 'Lian Li',
      tags: 'vo case, case may tinh, lian li, o11 dynamic, be ca pc',
      description: JSON.stringify({
        type: 'Mid Tower, buồng kép (Dual Chamber)',
        material: 'Thép, Nhôm, Kính cường lực',
        gpuSupport: 'Tối đa 420mm',
        detail: 'Vỏ case thiết kế bể cá sang trọng làm nổi bật toàn bộ linh kiện bên trong, khả năng hỗ trợ tản nhiệt nước custom cực tốt.'
      })
    }
  ];

  console.log(`Preparing to seed/upsert ${products.length} products...`);

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        originalPrice: product.originalPrice,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        brand: product.brand,
        tags: product.tags,
        description: product.description,
        categoryId: product.categoryId,
      },
      create: product,
    });
  }

  if (!isSafeSeed) {
    // 6. Create Demo Orders, Reviews, Q&As, and Chat history
    console.log('Seeding demo orders, reviews, Q&As, and chats...');
    
    const dbProducts = await prisma.product.findMany();
    const dbUsers = await prisma.user.findMany({
      where: { role: Role.CUSTOMER }
    });

    const orderStatuses = [
      OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
      OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
      OrderStatus.PENDING, OrderStatus.APPROVED, OrderStatus.SHIPPING,
      OrderStatus.CANCELLED, OrderStatus.CANCELLED
    ]; // High delivered rate

    const paymentMethods = [
      PaymentMethod.COD, PaymentMethod.COD, PaymentMethod.COD,
      PaymentMethod.MOMO, PaymentMethod.PAYPAL
    ]; // COD is 60%

    for (let i = 0; i < 25; i++) {
      const user = dbUsers[i % dbUsers.length];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Random date within the last 30 days
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
      orderDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      // Choose 1-3 random products
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const shuffledProducts = [...dbProducts].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffledProducts.slice(0, itemsCount);

      let total = 0;
      const orderItemsData = selectedProducts.map(p => {
        const quantity = Math.floor(Math.random() * 2) + 1;
        const price = p.salePrice;
        total += price * quantity;
        return {
          productId: p.id,
          quantity,
          price
        };
      });

      let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
      let deliveryStaff = null;

      if (status === OrderStatus.DELIVERED) {
        paymentStatus = PaymentStatus.PAID;
        deliveryStaff = 'Nguyễn Văn Shipper';
      } else if (status === OrderStatus.CANCELLED) {
        paymentStatus = PaymentStatus.FAILED;
      } else if (method !== PaymentMethod.COD && status !== OrderStatus.PENDING) {
        paymentStatus = PaymentStatus.PAID;
      }

      const order: any = await prisma.order.create({
        data: {
          userId: user.id,
          customerName: user.fullName,
          customerPhone: user.phone,
          customerEmail: user.email,
          customerAddress: user.address,
          paymentMethod: method,
          paymentStatus,
          orderStatus: status,
          totalAmount: total,
          discountAmount: 0,
          deliveryStaff,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });

      // Create warranty for delivered items
      if (status === OrderStatus.DELIVERED && order.items) {
        for (const item of order.items) {
          const warrantyStart = orderDate;
          const warrantyEnd = new Date(warrantyStart);
          warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1); // 1 year warranty
          
          await prisma.warranty.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              userId: user.id,
              customerName: user.fullName,
              customerPhone: user.phone,
              warrantyCode: `BH-${order.id.substring(0, 8)}-${item.productId.substring(0, 4)}`.toUpperCase(),
              durationMonths: 12,
              startDate: warrantyStart,
              endDate: warrantyEnd,
              status: 'ACTIVE',
              notes: 'Kích hoạt bảo hành điện tử tự động.'
            }
          });
        }
      }
    }

    // Reviews
    const comments = [
      "Sản phẩm dùng cực kỳ ổn định, đóng gói kỹ càng.",
      "Thiết kế rất sang trọng và đẳng cấp, xứng tầm phân khúc.",
      "Giao hàng nhanh trong ngày, nhân viên tư vấn nhiệt tình.",
      "Trải nghiệm tuyệt vời, pin dùng siêu trâu và sạc nhanh.",
      "Camera chụp hình sắc nét dã man, zoom xa vẫn rất rõ chi tiết.",
      "Cấu hình quá mạnh, chiến game AAA mượt mà không bị giật lag.",
      "Chống ồn cực tốt, âm thanh chi tiết, bass lực và sâu.",
      "Màn hình OLED hiển thị siêu đẹp, coi phim cực kỳ đã mắt.",
      "Máy siêu mỏng nhẹ, pin trâu phù hợp làm việc di động.",
      "Đồng hồ thông minh đẹp, pin trâu 3 ngày, theo dõi sức khỏe rất tốt.",
      "Bộ sạc cáp chất lượng cao, sạc mát máy và không bị chập chờn.",
      "TechStore phục vụ rất chu đáo, mình sẽ tiếp tục ủng hộ shop."
    ];

    for (let r = 0; r < comments.length; r++) {
      const user = dbUsers[Math.floor(Math.random() * dbUsers.length)];
      const product = dbProducts[Math.floor(Math.random() * dbProducts.length)];
      await prisma.productReview.create({
        data: {
          userId: user.id,
          productId: product.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: comments[r],
          isApproved: true,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000)
        }
      });
    }

    // QnAs
    const qnaPairs = [
      {
        question: "MacBook bên mình có cài đặt sẵn các phần mềm Office không shop?",
        answer: "Chào bạn, TechStore hỗ trợ cài đặt miễn phí các phần mềm văn phòng cơ bản như Office, Chrome, gõ tiếng Việt... khi bạn mua máy nhé."
      },
      {
        question: "Hạng thành viên Bạch Kim được giảm trực tiếp bao nhiêu khi thanh toán vậy ạ?",
        answer: "Dạ chào bạn, thành viên Bạch Kim sẽ được chiết khấu trực tiếp 5% tổng giá trị đơn hàng khi thanh toán nhé."
      },
      {
        question: "Sản phẩm này có hỗ trợ trả góp qua Home Credit không shop?",
        answer: "Chào bạn, bên mình hỗ trợ trả góp qua cả thẻ tín dụng và công ty tài chính (Home Credit, FE Credit) nhé."
      },
      {
        question: "Chính sách lỗi 1 đổi 1 của shop áp dụng trong bao lâu ạ?",
        answer: "Chào bạn, TechStore áp dụng chính sách 1 đổi 1 trong vòng 30 ngày đầu nếu có lỗi phần cứng từ nhà sản xuất."
      },
      {
        question: "Pin dự phòng Anker có kèm sẵn cáp sạc trong hộp không shop?",
        answer: "Dạ sản phẩm pin dự phòng Anker này có đi kèm sẵn 1 cáp sạc USB-C ngắn bên trong hộp bạn nhé."
      }
    ];

    for (const qna of qnaPairs) {
      const user = dbUsers[Math.floor(Math.random() * dbUsers.length)];
      const product = dbProducts[Math.floor(Math.random() * dbProducts.length)];
      await prisma.productQna.create({
        data: {
          userId: user.id,
          productId: product.id,
          question: qna.question,
          answer: qna.answer,
          isApproved: true,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000)
        }
      });
    }

    // Chats
    const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (adminUser) {
      const chatDialogs = [
        {
          user: dbUsers.find(u => u.email === 'platinum@test.vn') || dbUsers[0],
          messages: [
            { sender: 'user', text: "Chào shop, em cần tư vấn mua sạc Macbook Air M3 ạ." },
            { sender: 'admin', text: "Chào anh/chị, Macbook Air M3 hỗ trợ sạc nhanh, anh/chị có thể tham khảo củ sạc Dual USB-C 35W hoặc các dòng sạc Anker 65W bên em đang có sẵn hàng ạ." },
            { sender: 'user', text: "Loại Dual USB-C sạc cùng lúc iPhone với Macbook có bị chậm không shop?" },
            { sender: 'admin', text: "Dạ củ sạc sẽ tự động chia dòng thông minh, sạc cùng lúc cả hai vẫn rất an toàn và ổn định ạ." }
          ]
        },
        {
          user: dbUsers.find(u => u.email === 'gold@test.vn') || dbUsers[1],
          messages: [
            { sender: 'user', text: "Có bảo hành điện tử chưa shop ơi, mình mới nhận được đơn hàng." },
            { sender: 'admin', text: "Dạ đơn hàng sau khi chuyển trạng thái Đã giao thành công thì hệ thống sẽ tự động kích hoạt bảo hành điện tử trong vòng 5-10 phút ạ." },
            { sender: 'user', text: "Cảm ơn shop nhé, mình thấy hiển thị trong tài khoản rồi." },
            { sender: 'admin', text: "Dạ vâng, cảm ơn anh/chị đã tin tưởng và ủng hộ TechStore ạ!" }
          ]
        }
      ];

      for (const dialog of chatDialogs) {
        if (!dialog.user) continue;
        let timeOffset = 3600000 * 3; // 3 hours ago
        for (const msg of dialog.messages) {
          const senderId = msg.sender === 'user' ? dialog.user.id : adminUser.id;
          const receiverId = msg.sender === 'user' ? adminUser.id : dialog.user.id;
          await prisma.chatMessage.create({
            data: {
              senderId,
              receiverId,
              message: msg.text,
              createdAt: new Date(Date.now() - timeOffset)
            }
          });
          timeOffset -= 15 * 60 * 1000; // 15 mins later
        }
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
