import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const imageMapping: Record<string, string> = {
  // --- Điện thoại (iPhone) ---
  'iphone-16-pro-max-256gb': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
  'iphone-16-pro-128gb': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
  'iphone-16-plus-256gb': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
  'iphone-16-128gb': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
  'iphone-15-pro-max-256gb': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
  'iphone-15-128gb': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',

  // --- Điện thoại (Samsung) ---
  'samsung-galaxy-s25-ultra-512gb': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-s25-plus-256gb': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-s25-256gb': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-a56-5g-128gb': 'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-a36-5g-128gb': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-z-fold-6-512gb': 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-z-flip-6-256gb': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',

  // --- Điện thoại (Khác) ---
  'xiaomi-14-ultra-512gb': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
  'xiaomi-14t-pro-256gb': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
  'redmi-note-13-pro-256gb': 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&auto=format&fit=crop&q=80',
  'redmi-note-13-128gb': 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80',
  'oppo-find-x8-pro-256gb': 'https://images.unsplash.com/photo-1574755393849-623942496936?w=800&auto=format&fit=crop&q=80',
  'oppo-reno-12-pro-256gb': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
  'oppo-a3-pro-256gb': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',

  // --- Laptop ---
  'macbook-pro-16-inch-m4-pro-24gb-512gb': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
  'macbook-pro-14-inch-m4-16gb-512gb': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80',
  'macbook-air-15-inch-m3-16gb-256gb': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
  'macbook-air-13-inch-m3-8gb-256gb': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80',
  'asus-rog-strix-g16-rtx-4070-32gb': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80',
  'asus-zenbook-14-oled-i7-16gb': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80',
  'asus-vivobook-15-i5-8gb-512gb': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
  'dell-gaming-g15-rtx-4060-16gb': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
  'dell-xps-15-i9-32gb-1tb': 'https://images.unsplash.com/photo-1593642532400-2682810df593?w=800&auto=format&fit=crop&q=80',
  'dell-inspiron-15-i7-16gb-512gb': 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
  'hp-spectre-x360-i7-16gb-1tb': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80',
  'hp-pavilion-15-i5-8gb-512gb': 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',

  // --- Đồng hồ ---
  'apple-watch-ultra-2': 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&auto=format&fit=crop&q=80',
  'apple-watch-series-10-gps-46mm': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
  'apple-watch-series-10-gps-42mm': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-watch-ultra': 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-watch-7-44mm': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
  'garmin-forerunner-965': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  'xiaomi-watch-s3': 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&auto=format&fit=crop&q=80',
  'amazfit-gtr-4': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',

  // --- Tai nghe ---
  'airpods-max-usb-c': 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=800&auto=format&fit=crop&q=80',
  'airpods-pro-2-usb-c': 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
  'airpods-4-anc': 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?w=800&auto=format&fit=crop&q=80',
  'sony-wh-1000xm5': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
  'sony-wf-1000xm5': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
  'bose-quietcomfort-ultra': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-buds3-pro': 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80',
  'samsung-galaxy-buds3': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
  'xiaomi-buds-5-pro': 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800&auto=format&fit=crop&q=80',
  'jabra-elite-10': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',

  // --- Phụ kiện ---
  'magic-keyboard-touch-id': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
  'magic-mouse-apple': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
  'logitech-mx-master-3s': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
  'logitech-mx-keys-s': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
  'samsung-smart-monitor-32-inch-4k': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  'lg-ultrawide-34-inch-2k': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  'pin-du-phong-anker-20000mah-65w': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
  'sac-anker-usb-c-100w': 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=800&auto=format&fit=crop&q=80',
  'sac-samsung-45w-super-fast': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
  'sac-apple-35w-dual-usb-c': 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&auto=format&fit=crop&q=80',
  'cap-usb-c-apple-1m': 'https://images.unsplash.com/photo-1557853197-aefb550b6fdc?w=800&auto=format&fit=crop&q=80',
  'cap-anker-usb-c-100w': 'https://images.unsplash.com/photo-1557853197-aefb550b6fdc?w=800&auto=format&fit=crop&q=80',
  'op-magsafe-iphone-16-pro-max': 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800&auto=format&fit=crop&q=80',
  'op-samsung-s25-ultra-chinh-hang': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80',
  'kinh-cuong-luc-iphone-16-pro-max': 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800&auto=format&fit=crop&q=80',
  'gia-do-dien-thoai-belkin': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80',

  // --- Linh kiện ---
  'cpu-intel-core-i9-14900k': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'cpu-amd-ryzen-9-7950x': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80',
  'mainboard-asus-rog-z790': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'card-do-hoa-rtx-4060-8gb': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80',
  'ram-samsung-32gb-ddr5': 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80',
  'ram-kingston-16gb-ddr5': 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80',
  'ssd-wd-black-sn850x-2tb': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
  'ssd-samsung-970-evo-plus-1tb': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
  'tan-nhiet-noctua-nh-d15': 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800&auto=format&fit=crop&q=80',
  'case-lian-li-o11-dynamic': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
};

async function main() {
  console.log('Querying all products in the database...');
  const products = await prisma.product.findMany({});
  console.log(`Found ${products.length} products to check for individual images.`);

  let updatedCount = 0;
  for (const product of products) {
    const slug = product.slug;
    const targetImageUrl = imageMapping[slug];

    if (targetImageUrl) {
      if (product.imageUrl !== targetImageUrl) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: targetImageUrl },
        });
        console.log(`Updated: "${product.name}" (${slug}) -> ${targetImageUrl}`);
        updatedCount++;
      } else {
        console.log(`Skipped (already correct): "${product.name}"`);
      }
    } else {
      console.warn(`⚠️ Warning: No specific mapping found for product slug: "${slug}"`);
    }
  }

  console.log(`\n🎉 Done! Updated ${updatedCount} products with distinct individual images.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
