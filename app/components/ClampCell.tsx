'use client';

import { useState } from 'react';

// On mobile, clamps long cell text to 4 lines with an ellipsis; tap to
// expand/collapse. On sm+ screens it shows in full (no clamp).
export default function ClampCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      className={`cursor-pointer sm:cursor-auto ${expanded ? '' : 'line-clamp-4 sm:line-clamp-none'}`}
    >
      {text}
    </div>
  );
}
