export const FANDOM_BASE_URL = 'https://hotwheels.fandom.com/wiki/';
export const FANDOM_IMAGE_BASE_URL = 'https://static.wikia.nocookie.net/hotwheels/images/';

export const getFandomUrl = (path: string) => {
    return `${FANDOM_BASE_URL}${path}`;
};

export const getImageUrl = (path: string) => {
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
}; 