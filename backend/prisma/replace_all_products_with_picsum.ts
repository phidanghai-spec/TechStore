import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Querying all products in the database...');
  
  const products = await prisma.product.findMany({});

  console.log(`Found ${products.length} products to update.`);

  let updatedCount = 0;

  for (const product of products) {
    // Generate a unique seed based on the product slug
    const seededUrl = `https://picsum.photos/seed/${product.slug}/600/600`;

    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: seededUrl }
    });
    
    console.log(`Updated: "${product.name}" -> ${seededUrl}`);
    updatedCount++;
  }

  console.log(`\nSuccessfully updated all ${updatedCount} products to seeded Picsum images!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
