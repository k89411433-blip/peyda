import type { ComponentType } from 'react';

declare global {
  var Admin: ComponentType<{ leave: () => void }>;
}

export {};
