import { CarDataItem } from './types';
import { getSupabase } from './lib/supabase';
import { brandOf } from './lib/brands';
import { LOCAL_BACKEND, LOCAL_IMG_BASE } from './consts';

// Two image hosts in production (Cloudinary's free tier can't fit everything):
//   Hot Wheels  -> Supabase storage, legacy flat layout webp2/{id}.webp
//   MB/MJ/Welly -> Cloudinary,        {brand}/{id}.webp (+ on-the-fly preview)
// Locally there is no cloud at all: every brand is served from images/ through
// the /localimg route. NEXT_PUBLIC_IMG_BASE overrides the base (the Cloudinary
// upload script points it at a cloud prefix to test that layout).
const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE || (LOCAL_BACKEND ? LOCAL_IMG_BASE : undefined);
const CLD_BASE = process.env.NEXT_PUBLIC_CLOUDINARY_BASE;
const supaUrl = (relPath: string) => getSupabase().storage.from('images').getPublicUrl(relPath).data.publicUrl;

export const getImageUrl = (item: CarDataItem): string | undefined => {
    if (!item.id) return undefined;
    const b = brandOf(item);
    if (IMG_BASE) return `${IMG_BASE}/${b}/${item.id}.webp`;
    if (b === 'hw') return supaUrl(`webp2/${item.id}.webp`);
    return `${CLD_BASE}/${b}/${item.id}.webp`;
};

// Small preview (~320px) for list/grid thumbnails. Cloudinary generates it as a
// width transform of the full image; local/Supabase use the pre-made webp.
export const getPreviewUrl = (item: CarDataItem): string | undefined => {
    if (!item.id) return undefined;
    const b = brandOf(item);
    if (IMG_BASE) return `${IMG_BASE}/${b}/preview/${item.id}.webp`;
    if (b === 'hw') return supaUrl(`webp2/preview/${item.id}.webp`);
    return `${CLD_BASE}/c_limit,w_320,q_auto,f_auto/${b}/${item.id}.webp`;
};

// `p: 't'` marks a variant that has a photo.
export const hasImage = (item: CarDataItem): boolean => item.p === 't';

// Full-size + preview URLs of a variant's photo (both undefined without one).
export const getVariantImages = (item?: CarDataItem): { full?: string; preview?: string } =>
    item && hasImage(item) ? { full: getImageUrl(item), preview: getPreviewUrl(item) } : {};

export const formatCarName = (name: string) => {
    const spaced = name.replace(/_/g, ' ');
    // Some wiki slugs contain a bare '%' that isn't valid percent-encoding,
    // which makes decodeURIComponent throw — fall back to the raw text.
    try {
        return decodeURIComponent(spaced);
    } catch {
        return spaced;
    }
};

export const decodeHtmlEntities = (text: string) => {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
};

// A query typed with a Russian keyboard layout active ("ьгыефтп" for
// "mustang") is remapped key-for-key to the Latin layout. Only text containing
// Cyrillic is touched, and only letters are mapped, so punctuation in a normal
// query ("St. Louis") is never rewritten.
const RU_KEYS = 'йцукенгшщзхъфывапролджэячсмитьбюёЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮЁ';
const EN_KEYS = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>~";
const RU_TO_EN = new Map([...RU_KEYS].map((ch, i) => [ch, EN_KEYS[i]]));

export const convertKeyboardLayout = (text: string): string =>
    /[а-яё]/i.test(text) ? [...text].map((ch) => RU_TO_EN.get(ch) ?? ch).join('') : text;
