import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      imageUrl: {
        contains: 'cellphones.com.vn'
      }
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      brand: true
    }
  });

  console.log(`Found ${products.length} products with cellphones.com.vn image URLs:`);
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
