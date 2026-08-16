import { notFound } from "next/navigation";
import products from "@/data/products.json";
import ProductDetailClient from "./ProductDetail";
import type { Metadata } from "next";

interface RawProduct {
  id: number;
  slug: string;
  name: string;
  team: string;
  league: string;
  season: string;
  category: string;
  description: string;
  material: string;
  fitInfo: string;
  regularPriceUGX: number;
  memberPriceUGX: number;
  sizesAvailable: string[];
  stockStatus: string;
  images: string[];
  isBestSeller: boolean;
  unitsSold: number;
  reviewsCount: number;
  avgRating: number;
  customizationAvailable: boolean;
  relatedProducts: string[];
}

const allProducts = products as RawProduct[];

export function generateStaticParams() {
  return allProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = allProducts.find((p) => p.slug === slug);
  if (!product) {
    return { title: "Product Not Found — Darro" };
  }
  return {
    title: `${product.name} — Darro`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = allProducts.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedRawProducts = product.relatedProducts
    .map((rpSlug) => allProducts.find((p) => p.slug === rpSlug))
    .filter((p): p is RawProduct => Boolean(p));

  const relatedFillIns = allProducts
    .filter(
      (p) =>
        p.slug !== product.slug &&
        !relatedRawProducts.some((rp) => rp.slug === p.slug)
    )
    .slice(0, Math.max(0, 4 - relatedRawProducts.length));

  const related = [...relatedRawProducts, ...relatedFillIns];

  return (
    <ProductDetailClient product={product} relatedRawProducts={related} />
  );
}
