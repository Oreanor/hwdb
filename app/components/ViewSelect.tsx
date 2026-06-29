'use client';

import { t } from '../i18n';
import { ViewMode } from '../hooks/usePersistedView';
import Select from './ui/Select';

// View picker: a dropdown listing the available views and showing the current
// one (Table / Gallery / Years).
export default function ViewSelect({
  view,
  setView,
  modes,
}: {
  view: ViewMode;
  setView: (mode: ViewMode) => void;
  modes: ViewMode[];
}) {
  return (
    <Select
      value={view}
      onValueChange={(v) => setView(v as ViewMode)}
      options={modes.map((m) => ({ value: m, label: t(`view.${m}`) }))}
      ariaLabel={t('view.label')}
    />
  );
}
