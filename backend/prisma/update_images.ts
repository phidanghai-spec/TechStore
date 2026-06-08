import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting manual product image updates...');

  const updates = [
    {
      id: 'd101a90e-a2ae-4a92-a30c-f3d65eb22f37',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202402?wid=800&hei=800&fmt=jpeg&qlt=90'
    },
    {
      id: '8292e450-44fb-44cc-be0f-06a2635749fa',
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/sm-a366blbdxxv/gallery/vn-galaxy-a36-5g-sm-a366-sm-a366blbdxxv-thumb-544399432?$344_344_PNG$'
    },
    {
      id: 'd006279f-def6-47cf-8cd2-67f0ec548996',
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/vn/sm-a566blbdxxv/gallery/vn-galaxy-a56-5g-sm-a566-sm-a566blbdxxv-thumb-544399432?$344_344_PNG$'
    },
    {
      id: '1daca246-796e-4b4b-9291-234397559a90',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s10-hero-202409-aluminum-pink-sport-band-pink?wid=800&hei=800&fmt=jpeg&qlt=90'
    },
    {
      id: 'd2c7c7c9-4378-4cd2-a888-ac52b3b2f0be',
      imageUrl: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/b/e/belkin-phone-stand_1.jpg'
    }
  ];

  for (const update of updates) {
    try {
      const product = await prisma.product.update({
        where: { id: update.id },
        data: { imageUrl: update.imageUrl }
      });
      console.log(`Updated product ${product.name} (ID: ${product.id}) image URL successfully.`);
    } catch (error: any) {
      console.error(`Failed to update product with ID ${update.id}:`, error.message);
    }
  }

  console.log('Updates finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
