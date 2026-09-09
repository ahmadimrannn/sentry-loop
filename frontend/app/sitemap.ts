import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sentryloop.vercel.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  ]
}
