import { MetadataRoute } from 'next'
import { countries, documents } from '@/lib/seo-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://themilanoseal.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/intake`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/founder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
  
  // Apostille country pages
  const apostillePages: MetadataRoute.Sitemap = countries.map((country) => ({
    url: `${baseUrl}/apostille/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))
  
  // Service pages
  const servicePages: MetadataRoute.Sitemap = documents.map((doc) => ({
    url: `${baseUrl}/services/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
  
  // Document + country combination pages (limited for sitemap size)
  const documentCountryPages: MetadataRoute.Sitemap = []
  for (const doc of documents.slice(0, 10)) {
    for (const country of countries.slice(0, 20)) {
      documentCountryPages.push({
        url: `${baseUrl}/documents/${doc.slug}/${country.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })
    }
  }
  
  return [
    ...staticPages,
    ...apostillePages,
    ...servicePages,
    ...documentCountryPages,
  ]
}
