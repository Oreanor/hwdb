import { CarDataItem, CastingTags } from './types';
import { brandOf } from './lib/brands';

// The one image host for every brand: an images/-shaped tree at NEXT_IMG_BASE.
//   {base}/{brand}/{id}.webp           full size
//   {base}/{brand}/preview/{id}.webp   ~320px preview for lists and grids
// Either an absolute URL (the home server, https://homeserver.../hwdb) or
// "/localimg" — this app serving the local images/ folder, the default.
export const IMG_BASE = process.env.NEXT_IMG_BASE || '/localimg';

// Only variants flagged `p: 't'` have a photo.
export const hasImage = (item: CarDataItem): boolean => item.p === 't' && !!item.id;

const imageUrl = (item: CarDataItem, preview: boolean): string | undefined =>
  hasImage(item) ? `${IMG_BASE}/${brandOf(item)}/${preview ? 'preview/' : ''}${item.id}.webp` : undefined;

export const getImageUrl = (item: CarDataItem) => imageUrl(item, false);
export const getPreviewUrl = (item: CarDataItem) => imageUrl(item, true);

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

// The real car's model year, "≈1967" when it is an estimate; '' when unknown.
export const formatModelYear = (tags?: CastingTags): string =>
  tags?.yr ? `${tags.ye ? '≈' : ''}${tags.yr}` : '';

const HTML_ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'" };

export const decodeHtmlEntities = (text: string): string =>
  text.replace(/&(?:amp|lt|gt|quot|#039);/g, (m) => HTML_ENTITIES[m]);

// Text typed with the Russian keyboard layout by mistake -> the Latin keys it
// was meant to be ("ащкв" -> "ford").
const RU_KEYS = 'йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,';
const EN_KEYS = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?';

export const convertKeyboardLayout = (text: string): string =>
  Array.from(text, (ch) => {
    const i = RU_KEYS.indexOf(ch);
    return i === -1 ? ch : EN_KEYS[i];
  }).join('');
