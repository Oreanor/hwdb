import { LoaderCircle } from 'lucide-react';
import { t } from '../i18n';

export default function Spinner() {
  return (
    <div role="status" className="flex h-full min-h-40 w-full items-center justify-center gap-2 text-sm text-gray-400">
      <LoaderCircle className="w-4 h-4 animate-spin" />
      {t('common.loading')}
    </div>
  );
}
