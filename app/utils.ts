import { CarDataItem } from './types';
import { supabase } from './lib/supabase';

// Images live in webp2/{id}.webp for Hot Wheels (the original base) and in a
// per-brand subfolder for the others (webp2/mb/{id}.webp, webp2/mj/{id}.webp).
const brandSub = (brand?: string) => (brand && brand !== 'hw' ? `${brand}/` : '');

export const getImageUrl = (item: CarDataItem): string | undefined => {
    if (item.id) {
        return supabase.storage
            .from('images')
            .getPublicUrl(`webp2/${brandSub(item.brand)}${item.id}.webp`).data.publicUrl;
    }
    return undefined;
};

// Small JPEG/WebP preview (~256px) for list/grid thumbnails; falls back to the
// full image if a preview hasn't been generated/uploaded yet (see Thumbnail).
export const getPreviewUrl = (item: CarDataItem): string | undefined => {
    if (item.id) {
        return supabase.storage
            .from('images')
            .getPublicUrl(`webp2/preview/${brandSub(item.brand)}${item.id}.webp`).data.publicUrl;
    }
    return undefined;
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