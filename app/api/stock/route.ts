import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface StockItem {
  id: string;
  title: string;
  thumb: string;
  full?: string;
  assetUrl?: string;
  mimeType: string;
  provider: string;
  author?: string;
}

/* ── Pexels — high-quality stock photos (API key in .env) ── */
async function pexelsPhotos(query: string, page: number): Promise<StockItem[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const endpoint = query
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=24&page=${page}`
      : `https://api.pexels.com/v1/curated?per_page=24&page=${page}`;

    const res = await fetch(endpoint, {
      headers: { Authorization: apiKey },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.photos ?? []).map((p: {
      id: number;
      alt: string;
      src: { tiny: string; small: string; large: string; original: string };
      photographer: string;
    }) => ({
      id: `pexels-${p.id}`,
      title: p.alt || `Photo by ${p.photographer}`,
      thumb: p.src.small,
      full: p.src.large,
      mimeType: "image/jpeg",
      provider: "pexels",
      author: p.photographer,
    }));
  } catch (_) {
    return [];
  }
}

/* ── Pixabay — free images, illustrations & vectors (API key in .env) ── */
async function pixabayImages(
  query: string,
  page: number,
  category: "photos" | "elements" | "background",
): Promise<StockItem[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return [];

  const imageTypes: Record<string, string> = {
    photos: "photo",
    elements: "illustration",
    background: "photo",
  };

  const defaultQueries: Record<string, string> = {
    photos: "nature landscape",
    elements: "pattern design graphic",
    background: "abstract wallpaper texture",
  };

  try {
    const q = query || defaultQueries[category] || "nature";
    const res = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(q)}` +
      `&image_type=${imageTypes[category]}&per_page=24&page=${page}&safesearch=true`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.hits ?? []).map((h: {
      id: number;
      tags: string;
      user: string;
      webformatURL: string;
      largeImageURL: string;
      previewURL: string;
    }) => ({
      id: `pixabay-${h.id}`,
      title: h.tags || `Image by ${h.user}`,
      thumb: h.previewURL || h.webformatURL,
      full: h.largeImageURL,
      mimeType: "image/jpeg",
      provider: "pixabay",
      author: h.user,
    }));
  } catch (_) {
    return [];
  }
}

/* ── Lorem Picsum — fallback free stock photos, no API key ── */
async function picsumPhotos(page: number): Promise<StockItem[]> {
  try {
    const res = await fetch(
      `https://picsum.photos/v2/list?page=${page}&limit=24`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      id: string;
      author?: string;
    }>;
    return data.map((p) => ({
      id: `picsum-${p.id}`,
      title: p.author ? `Photo by ${p.author}` : "Stock photo",
      thumb: `https://picsum.photos/id/${p.id}/300/300`,
      full: `https://picsum.photos/id/${p.id}/1600/1200`,
      mimeType: "image/jpeg",
      provider: "picsum",
      author: p.author,
    }));
  } catch (_) {
    return [];
  }
}

/* ── Wikimedia Commons — free searchable images, no API key ── */
async function wikimediaImages(query: string): Promise<StockItem[]> {
  try {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
      `&generator=search&gsrnamespace=6&gsrlimit=24` +
      `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${query}`)}` +
      `&prop=imageinfo&iiprop=url|mime&iiurlwidth=300`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    const pages: Array<{
      title?: string;
      imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string }>;
    }> = json?.query?.pages ? Object.values(json.query.pages) : [];

    return pages
      .map((page) => {
        const info = page.imageinfo?.[0];
        return {
          id: `wikimedia-${page.title ?? Math.random()}`,
          title: (page.title ?? "Image").replace(/^File:/, ""),
          thumb: info?.thumburl ?? info?.url ?? "",
          full: info?.url ?? "",
          mimeType: info?.mime ?? "image/jpeg",
          provider: "wikimedia",
        };
      })
      .filter(
        (item) =>
          item.thumb &&
          /^image\/(jpeg|png|webp|gif)$/.test(item.mimeType),
      );
  } catch (_) {
    return [];
  }
}

/* ── Pexels Videos — high-quality stock videos (API key in .env) ── */
async function pexelsVideos(query: string, page: number): Promise<StockItem[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query || "nature")}&per_page=24&page=${page}`,
      { headers: { Authorization: apiKey }, cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.videos ?? []).map((v: {
      id: number;
      url?: string;
      image?: string;
      video_files?: Array<{ link?: string; file_type?: string; width?: number }>;
      video_pictures?: Array<{ picture?: string }>;
      user?: { name?: string };
    }) => {
      const mp4s = (v.video_files ?? []).filter((f) => f.file_type === "video/mp4");
      const file = mp4s.find((f) => (f.width ?? 9999) <= 1280) ?? mp4s[0];
      return {
        id: `pexels-video-${v.id}`,
        title: `Video by ${v.user?.name ?? "Pexels"}`,
        thumb: v.video_pictures?.[0]?.picture ?? v.image ?? "",
        full: file?.link,
        mimeType: "video/mp4",
        provider: "pexels",
        author: v.user?.name,
      };
    }).filter((item: StockItem) => item.full);
  } catch (_) {
    return [];
  }
}

/* ── NASA Image & Video Library — free stock videos, no API key ── */
async function nasaVideos(query: string): Promise<StockItem[]> {
  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=video`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const collection: Array<{
      data?: Array<{ nasa_id?: string; title?: string }>;
      links?: Array<{ href?: string }>;
    }> = json?.collection?.items ?? (Array.isArray(json?.collection) ? json.collection : []);

    return collection
      .filter((item) => item.data?.[0]?.nasa_id)
      .map((item) => ({
        id: `nasa-${item.data![0].nasa_id}`,
        title: item.data![0].title ?? "NASA video",
        thumb: item.links?.[0]?.href ?? "",
        assetUrl: `https://images-api.nasa.gov/asset/${item.data![0].nasa_id}`,
        mimeType: "video/mp4",
        provider: "nasa",
      }));
  } catch (_) {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "photos";
  const query = (searchParams.get("q") ?? "").trim();
  const page = Number(searchParams.get("page") ?? 1);

  let items: StockItem[] = [];

  switch (category) {
    case "photos":
      // Try Pexels first (best quality), fall back to Picsum
      items = await pexelsPhotos(query, page);
      if (items.length === 0) {
        items = query ? await wikimediaImages(query) : await picsumPhotos(page);
      }
      break;
    case "background":
      items = await pixabayImages(query, page, "background");
      if (items.length === 0) {
        items = await wikimediaImages(query || "landscape wallpaper");
      }
      break;
    case "elements":
      items = await pixabayImages(query, page, "elements");
      if (items.length === 0) {
        items = await wikimediaImages(query || "pattern design");
      }
      break;
    case "videos":
      items = await pexelsVideos(query, page);
      if (items.length === 0) {
        items = await nasaVideos(query || "earth");
      }
      break;
    default:
      items = [];
  }

  return NextResponse.json({ items });
}
