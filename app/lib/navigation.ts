// View state stored in browser history + mapped to a shareable URL.
export type ViewState = {
  view?: string;
  model?: string;
  series?: string;
  searchQuery?: string;
  selectedField?: string;
  year?: string;
  tag?: string;
};

// Map a view-state object to a shareable URL (query params on `/`).
export function buildViewUrl(state: ViewState | null): string {
  const p = new URLSearchParams();
  switch (state?.view) {
    case 'model':
      if (state.model) p.set('model', state.model);
      break;
    case 'series':
      if (state.series) p.set('series', state.series);
      break;
    case 'year':
      if (state.year) p.set('year', state.year);
      break;
    case 'collection':
      p.set('view', 'collection');
      break;
    case 'grid':
      if (state.tag) {
        p.set('tag', state.tag);
        break;
      }
      if (state.searchQuery) p.set('q', state.searchQuery);
      if (state.selectedField && state.selectedField !== 'name') p.set('field', state.selectedField);
      if (state.year) p.set('year', state.year);
      break;
  }
  const qs = p.toString();
  return qs ? `?${qs}` : '/';
}

export const pushUrl = (state: ViewState) => window.history.pushState(state, '', buildViewUrl(state));
export const replaceUrl = (state: ViewState) => window.history.replaceState(state, '', buildViewUrl(state));
