import { FANDOM_BASE_URL } from './consts';
import { CarDataItem } from './types';
import { supabase } from './services/supabase';

export const getFandomUrl = (path: string) => {
    return `${FANDOM_BASE_URL}${path}`;
};

export const getImageUrl = (item: CarDataItem): string | undefined => {
    if (item.id) {
        return supabase.storage
            .from('images')
            .getPublicUrl(`webp2/${item.id}.webp`).data.publicUrl;
    }
    return undefined;
};

export const formatCarName = (name: string) => {
    return decodeURIComponent(name.replace(/_/g, ' '));
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