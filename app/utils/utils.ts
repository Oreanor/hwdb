import { FANDOM_BASE_URL, FANDOM_IMAGE_BASE_URL } from '../consts';
import { CarDataItem } from '../types';

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