import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const unsplashImages = {
  cpu: 'https://images.unsplash.com/photo-1591405351990-4726e33df58d?w=600&q=80',
  gpu: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
  ram: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&q=80',
  ssd: 'https://images.unsplash.com/photo-1628546024251-2425b9cd48a8?w=600&q=80',
  motherboard: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  cooler: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=600&q=80',
  laptop_gaming: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80',
  laptop_premium: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80',
  laptop_normal: 'https://images.unsplash.com/photo-1496181130204-7552cc14b1e0?w=600&q=80',
  phone: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80',
  watch: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80',
  earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
  mouse: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  cable: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=600&q=80',
  powerbank: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=600&q=80',
  case: 'https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=600&q=80',
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80'
};

async function main() {
  console.log('Querying products with cellphones.com.vn URLs...');
  
  const products = await prisma.product.findMany({
    where: {
      imageUrl: {
        contains: 'cellphones.com.vn'
      }
    }
  });

  console.log(`Found ${products.length} products to update.`);

  let updatedCount = 0;

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    let selectedUrl = '';

    if (nameLower.includes('cpu') || nameLower.includes('ryzen') || nameLower.includes('core i')) {
      selectedUrl = unsplashImages.cpu;
    } else if (nameLower.includes('card đồ họa') || nameLower.includes('rtx')) {
      selectedUrl = unsplashImages.gpu;
    } else if (nameLower.includes('ram')) {
      selectedUrl = unsplashImages.ram;
    } else if (nameLower.includes('ssd')) {
      selectedUrl = unsplashImages.ssd;
    } else if (nameLower.includes('mainboard') || nameLower.includes('bo mạch')) {
      selectedUrl = unsplashImages.motherboard;
    } else if (nameLower.includes('tản nhiệt') || nameLower.includes('noctua') || nameLower.includes('cooler')) {
      selectedUrl = unsplashImages.cooler;
    } else if (nameLower.includes('gaming') || nameLower.includes('g15')) {
      selectedUrl = unsplashImages.laptop_gaming;
    } else if (nameLower.includes('xps') || nameLower.includes('zenbook')) {
      selectedUrl = unsplashImages.laptop_premium;
    } else if (nameLower.includes('inspiron') || nameLower.includes('pavilion') || nameLower.includes('latitude') || nameLower.includes('laptop')) {
      selectedUrl = unsplashImages.laptop_normal;
    } else if (nameLower.includes('buds') || nameLower.includes('elite') || nameLower.includes('quietcomfort') || nameLower.includes('tai nghe') || nameLower.includes('headphone') || nameLower.includes('airpods')) {
      selectedUrl = unsplashImages.earbuds;
    } else if (nameLower.includes('forerunner') || nameLower.includes('gtr') || nameLower.includes('watch') || nameLower.includes('đồng hồ')) {
      selectedUrl = unsplashImages.watch;
    } else if (nameLower.includes('master') || nameLower.includes('mouse') || nameLower.includes('chuột')) {
      selectedUrl = unsplashImages.mouse;
    } else if (nameLower.includes('ultrawide') || nameLower.includes('màn hình') || nameLower.includes('monitor')) {
      selectedUrl = unsplashImages.monitor;
    } else if (nameLower.includes('cáp') || nameLower.includes('cable') || nameLower.includes('sạc usb-c')) {
      selectedUrl = unsplashImages.cable;
    } else if (nameLower.includes('pin dự phòng') || nameLower.includes('sạc dự phòng') || nameLower.includes('powerbank')) {
      selectedUrl = unsplashImages.powerbank;
    } else if (nameLower.includes('ốp') || nameLower.includes('bao da') || nameLower.includes('case')) {
      selectedUrl = unsplashImages.case;
    } else if (nameLower.includes('bàn phím') || nameLower.includes('keys') || nameLower.includes('keyboard')) {
      selectedUrl = unsplashImages.keyboard;
    } else if (nameLower.includes('reno') || nameLower.includes('find x') || nameLower.includes('galaxy a') || nameLower.includes('galaxy s') || nameLower.includes('xiaomi') || nameLower.includes('oppo') || nameLower.includes('iphone') || nameLower.includes('redmi')) {
      selectedUrl = unsplashImages.phone;
    } else {
      // Fallback to general tech category
      selectedUrl = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80';
    }

    if (selectedUrl) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: selectedUrl }
      });
      console.log(`Updated "${product.name}" -> ${selectedUrl}`);
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} products to high-quality Unsplash image URLs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
