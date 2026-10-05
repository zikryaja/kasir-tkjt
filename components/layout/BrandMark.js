import Image from "next/image";
import { BRAND } from "@/lib/brand";

// Logo di dalam kotak putih, supaya terbaca di latar gelap maupun terang.
// alt kosong karena nama aplikasi selalu ditulis di sebelahnya.
export default function BrandMark({ size = 36 }) {
  const inner = Math.round(size * 0.78);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-white"
      style={{ width: size, height: size }}
    >
      <Image
        src={BRAND.logo}
        alt=""
        width={inner}
        height={inner}
        unoptimized
        className="object-contain"
      />
    </span>
  );
}