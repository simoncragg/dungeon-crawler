import { useState } from 'react';
import { getInitialAssets, preloadAssets } from '../utils/assetLoader';

export const useAssetLoader = () => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const startLoading = () => {
    if (loading || loaded) return;

    setLoading(true);
    const assets = getInitialAssets();

    if (assets.length === 0) {
      setProgress(100);
      setLoaded(true);
      return;
    }

    preloadAssets(assets, (p) => {
      setProgress(p);
    }).then(() => {
      setLoaded(true);
    });
  };

  return { progress, loaded, startLoading };
};
