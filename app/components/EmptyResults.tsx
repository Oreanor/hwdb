import { t } from '../i18n';

// "No results" — or, for the user's own collection, how to add to it.
export default function EmptyResults({ isCollection = false }: { isCollection?: boolean }) {
  return (
    <div className="text-center text-gray-600 dark:text-gray-400 py-8">
      <p className="mb-2">{isCollection ? t('collection.empty') : t('common.noResults')}</p>
      {isCollection && <p className="text-sm">{t('collection.howToAdd')}</p>}
    </div>
  );
}
