export async function onRequest() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://ammararabic.onrender.com/</loc>
    <lastmod>2026-11-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://ammararabic.onrender.com/og-image.png</image:loc>
      <image:title>Ammar Arabic | عمار للتعريب – تعريب الألعاب</image:title>
      <image:caption>المنصة الرائدة في تعريب وترجمة ألعاب الفيديو للكمبيوتر والهواتف</image:caption>
    </image:image>
  </url>
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
