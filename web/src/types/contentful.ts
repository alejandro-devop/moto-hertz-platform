// Tipos base de Contentful
export interface ContentfulSys {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  environment?: {
    sys: {
      id: string;
      type: string;
    };
  };
  contentType: {
    sys: {
      id: string;
      type: string;
    };
  };
}

// Generic Contentful Component type for dynamic rendering
export interface ContentfulComponent {
  metadata?: {
    tags: any[];
    concepts: any[];
  };
  sys: {
    id: string;
    type: string;
    contentType: {
      sys: {
        id: string;
        type?: string;
        linkType?: string;
      };
    };
    [key: string]: any;
  };
  fields: {
    [key: string]: any;
  };
}

export interface ContentfulAsset {
  sys: ContentfulSys;
  fields: {
    title: string;
    description?: string;
    file: {
      url: string;
      details: {
        size: number;
        image?: {
          width: number;
          height: number;
        };
      };
      fileName: string;
      contentType: string;
    };
  };
}

// Tipos específicos para el contenido de la home
export interface BannerData {
  sys: ContentfulSys;
  fields: {
    title: string;
    subtitle?: string;
    backgroundImage: ContentfulAsset;
    ctaText?: string;
    ctaLink?: string;
    order?: number;
  };
}

export interface CardData {
  sys: ContentfulSys;
  fields: {
    title: string;
    description: string;
    image?: ContentfulAsset;
    link?: string;
    category?: string;
    order?: number;
  };
}

export interface NewsData {
  sys: ContentfulSys;
  fields: {
    title: string;
    excerpt: string;
    content: string;
    featuredImage?: ContentfulAsset;
    publishedDate: string;
    author?: string;
    category?: string;
    slug: string;
  };
}

export interface SecondBannerData {
  sys: ContentfulSys;
  fields: {
    title: string;
    subtitle?: string;
    description?: string;
    backgroundImage: ContentfulAsset;
    ctaText?: string;
    ctaLink?: string;
  };
}

// Tipo para la respuesta completa de la home
export interface HomePageData {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    contentType: {
      sys: {
        id: string;
        type: string;
      };
    };
    [key: string]: any;
  };
  fields: {
    entryId: string;
    title: string;
    slug: string;
    layout: Array<{
      sys: {
        id: string;
        type: string;
        contentType: {
          sys: {
            id: string;
          };
        };
        [key: string]: any;
      };
      fields: {
        [key: string]: any;
      };
    }>;
  };
  metadata?: {
    tags: any[];
    concepts: any[];
  };
}

// Tipo para la respuesta de GraphQL de Contentful
export interface ContentfulResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

// Tipo para las queries de la colección
export interface ContentfulCollection<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// Tipo para la respuesta completa de la home desde Contentful
export interface ContentfulHomeResponse {
  bannerCollection: ContentfulCollection<BannerData>;
  cardCollection: ContentfulCollection<CardData>;
  newsCollection: ContentfulCollection<NewsData>;
  secondBannerCollection: ContentfulCollection<SecondBannerData>;
}
