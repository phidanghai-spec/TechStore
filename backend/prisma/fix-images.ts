import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixImages() {
  console.log('🔧 Fixing broken image URLs in database...');

  // Fix 1: iPhone 16 Pro Max - Apple CDN bị chặn CORS
  const iphone = await prisma.product.updateMany({
    where: { slug: 'iphone-16-pro-max-256gb' },
    data: {
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    },
  });
  console.log(`✅ iPhone 16 Pro Max: updated ${iphone.count} record(s)`);

  // Fix 2: AirPods Pro 2 - Apple CDN bị chặn CORS
  const airpods = await prisma.product.updateMany({
    where: { slug: 'airpods-pro-2-usb-c' },
    data: {
      imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80',
    },
  });
  console.log(`✅ AirPods Pro 2: updated ${airpods.count} record(s)`);

  console.log('\n🎉 All image URLs fixed successfully!');
}

fixImages()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
