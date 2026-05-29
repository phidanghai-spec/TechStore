import { Metadata } from 'next';
import ShopClient from './ShopClient';

type Props = {
  searchParams: Promise<{ category?: string; brand?: string; search?: string; status?: string }>;
};

const categoryNames: Record<string, string> = {
  'dien-thoai': 'Điện thoại di động chính hãng',
  'laptop': 'Laptop & Máy tính xách tay giá rẻ',
  'tai-nghe': 'Tai nghe chụp tai & không dây cao cấp',
  'dong-ho': 'Đồng hồ thông minh chính hãng',
  'phu-kien': 'Phụ kiện điện thoại & máy tính',
  'linh-kien': 'Linh kiện PC & Laptop tốt nhất'
};

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const category = resolvedParams.category;
  const brand = resolvedParams.brand;
  const search = resolvedParams.search;

  let title = 'Cửa Hàng TechStore - Điện Thoại, Laptop & Phụ Kiện Giá Rẻ';
  let description = 'Khám phá hàng ngàn sản phẩm công nghệ chính hãng tại TechStore.vn. Điện thoại, laptop, đồng hồ và phụ kiện với giá tốt nhất thị trường, cam kết chính hãng 100%.';

  if (category && categoryNames[category]) {
    title = `${categoryNames[category]} | Cửa Hàng TechStore`;
    description = `Mua ngay các sản phẩm thuộc danh mục ${categoryNames[category]} tại TechStore.vn. Ưu đãi trả góp 0%, bảo hành 12 tháng, giao hàng nhanh chóng toàn quốc.`;
  } else if (brand) {
    title = `Thiết bị công nghệ hãng ${brand} chính hãng | TechStore`;
    description = `Tổng hợp các sản phẩm công nghệ ${brand} bán chạy nhất tại TechStore.vn. Cam kết giá rẻ nhất, đầy đủ hóa đơn chứng từ, bảo hành chính hãng.`;
  } else if (search) {
    title = `Kết quả tìm kiếm "${search}" | TechStore`;
    description = `Xem danh sách sản phẩm khớp với từ khóa tìm kiếm "${search}" tại TechStore.vn. Giao nhanh 2h tại TP.HCM.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://techstore.vercel.app/shop${category ? `?category=${category}` : ''}`,
      siteName: 'TechStore',
      type: 'website',
    }
  };
}

export default function Page() {
  return <ShopClient />;
}
