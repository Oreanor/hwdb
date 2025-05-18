import { FANDOM_BASE_URL, FANDOM_IMAGE_BASE_URL } from './consts';
import { CarDataItem } from './types';

export const getFandomUrl = (path: string) => {
    return `${FANDOM_BASE_URL}${path}`;
};



export const getImageUrl = (item: CarDataItem): string | undefined => {
    const path = item.p;
    if (path && !path.includes('Image_Not_Available')) {
        let fullUrl;
        if (path.startsWith('http')) {
            // If it's already a full URL, use it as is
            fullUrl = path;
        } else {
            // Otherwise construct the full URL
            fullUrl = `${FANDOM_IMAGE_BASE_URL}${path}/revision/latest/scale-to-width-down/400`;
        }
        
        // Return proxied URL
        return `/api/image?url=${encodeURIComponent(fullUrl)}`;
    }
    return undefined;
  };

export const formatCarName = (name: string) => {
    return decodeURIComponent(name.replace(/_/g, ' '));
}; 

export const decodeHtmlEntities = (text: string | undefined): string => {
    if (!text) return '-';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ');
};

// Конвертация раскладки клавиатуры
const RUSSIAN_LAYOUT = 'йцукенгшщзхъфывапролджэячсмитьбюё';
const ENGLISH_LAYOUT = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`';

export const convertKeyboardLayout = (text: string): string => {
  const isRussian = /[а-яА-ЯёЁ]/.test(text);
  const sourceLayout = isRussian ? RUSSIAN_LAYOUT : ENGLISH_LAYOUT;
  const targetLayout = isRussian ? ENGLISH_LAYOUT : RUSSIAN_LAYOUT;
  
  return text.split('').map(char => {
    const lowerChar = char.toLowerCase();
    const index = sourceLayout.indexOf(lowerChar);
    if (index === -1) return char;
    
    const converted = targetLayout[index];
    return char === lowerChar ? converted : converted.toUpperCase();
  }).join('');
};