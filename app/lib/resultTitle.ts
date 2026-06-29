import { t } from '../i18n';
import { ResultTitle } from '../types';

export const formatResultTitle = (rt: ResultTitle): string =>
  'text' in rt ? rt.text : `${t(`search.fields.${rt.field}`)}: ${rt.query}`;
