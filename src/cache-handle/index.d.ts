import "./cache-handle";

export as namespace cacheHandle;

export const resetWorkers: (config?: {
  noMessage?: boolean;
  customMessage?: string;
}) => void;
