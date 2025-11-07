// SEO utility functions for better search engine optimization
import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = '/og-image.jpg',
    url = process.env.NEXT_PUBLIC_APP_URL,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    noindex = false,
    nofollow = false,
  } = config;

  const siteName = process.env.NEXT_PUBLIC_APP_NAME || 'Shamlai';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      type: type === 'product' ? 'website' : type, // OpenGraph doesn't support 'product', use 'website'
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: author ? `@${author}` : undefined,
    },

    // Robots
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Additional
    alternates: {
      canonical: url,
    },
  };

  return metadata;
}

// Product-specific metadata
export function generateProductMetadata(product: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  brand?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  condition?: 'new' | 'refurbished' | 'used';
}): Metadata {
  const {
    name,
    description = '',
    price,
    currency = 'BDT',
    image = '/og-image.jpg',
    brand = process.env.NEXT_PUBLIC_APP_NAME,
    availability = 'in_stock',
    condition = 'new',
  } = product;

  return generateMetadata({
    title: name,
    description: description.substring(0, 160),
    image,
    type: 'product',
  });
}

// Article/Blog metadata
export function generateArticleMetadata(article: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  modifiedAt?: string;
  image?: string;
  tags?: string[];
}): Metadata {
  return generateMetadata({
    title: article.title,
    description: article.description,
    image: article.image,
    type: 'article',
    author: article.author,
    publishedTime: article.publishedAt,
    modifiedTime: article.modifiedAt,
    keywords: article.tags,
  });
}

// Generate structured data (JSON-LD)
export function generateStructuredData(type: string, data: any): string {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(structuredData);
}

// Product structured data
export function generateProductStructuredData(product: {
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency?: string;
  brand?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition?: 'NewCondition' | 'RefurbishedCondition' | 'UsedCondition';
  rating?: number;
  reviewCount?: number;
}) {
  return generateStructuredData('Product', {
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || process.env.NEXT_PUBLIC_APP_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'BDT',
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      itemCondition: `https://schema.org/${product.condition || 'NewCondition'}`,
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
      },
    }),
  });
}

// Organization structured data
export function generateOrganizationStructuredData(org: {
  name: string;
  url: string;
  logo: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  socialLinks?: string[];
}) {
  return generateStructuredData('Organization', {
    name: org.name,
    url: org.url,
    logo: org.logo,
    description: org.description,
    email: org.email,
    telephone: org.phone,
    ...(org.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: org.address.street,
        addressLocality: org.address.city,
        addressRegion: org.address.state,
        postalCode: org.address.postalCode,
        addressCountry: org.address.country,
      },
    }),
    ...(org.socialLinks && {
      sameAs: org.socialLinks,
    }),
  });
}

// Breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

export default {
  generateMetadata,
  generateProductMetadata,
  generateArticleMetadata,
  generateStructuredData,
  generateProductStructuredData,
  generateOrganizationStructuredData,
  generateBreadcrumbStructuredData,
};

