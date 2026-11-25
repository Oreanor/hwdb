import { CarDataItem } from './types';
import { supabase } from './lib/supabase';

const brandDir = (brand?: string) => brand || 'hw';

// Two image hosts in production (Cloudinary's free tier can't fit everything):
//   Hot Wheels  -> Supabase storage, legacy flat layout webp2/{id}.webp
//   MB/MJ/Welly -> Cloudinary,        {brand}/{id}.webp (+ on-the-fly preview)
// NEXT_PUBLIC_IMG_BASE, when set, overrides both and serves every brand from one
// images/-shaped tree: {base}/{brand}/{id}.webp and {base}/{brand}/preview/{id}.webp.
// It is either "/localimg" (this app reads the local images/ folder) or an absolute
// URL such as the home server (https://homeserver.../hwdb).
const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE;
const CLD_BASE = process.env.NEXT_PUBLIC_CLOUDINARY_BASE;
const supaUrl = (relPath: string) => supabase.storage.from('images').getPublicUrl(relPath).data.publicUrl;

export const getImageUrl = (item: CarDataItem): string | undefined => {
    if (!item.id) return undefined;
    const b = brandDir(item.brand);
    if (IMG_BASE) return `${IMG_BASE}/${b}/${item.id}.webp`;
    if (b === 'hw') return supaUrl(`webp2/${item.id}.webp`);
    return `${CLD_BASE}/${b}/${item.id}.webp`;
};

// Small preview (~320px) for list/grid thumbnails. Cloudinary generates it as a
// width transform of the full image; local/Supabase use the pre-made webp.
export const getPreviewUrl = (item: CarDataItem): string | undefined => {
    if (!item.id) return undefined;
    const b = brandDir(item.brand);
    if (IMG_BASE) return `${IMG_BASE}/${b}/preview/${item.id}.webp`;
    if (b === 'hw') return supaUrl(`webp2/preview/${item.id}.webp`);
    return `${CLD_BASE}/c_limit,w_320,q_auto,f_auto/${b}/${item.id}.webp`;
};

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
    if (!text) return '-';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
};

export const convertKeyboardLayout = (text: string) => {
    const en = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?';
    const ru = 'йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,';
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const ruIndex = ru.indexOf(char);
        if (ruIndex !== -1) {
            result += en[ruIndex];
        } else {
            result += char;
        }
    }
    return result;
};