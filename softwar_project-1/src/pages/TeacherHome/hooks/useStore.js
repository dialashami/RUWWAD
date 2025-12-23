import { useEffect, useState } from 'react';
import { store } from '../lib/store';

export function useStore() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    return store.subscribe(() => {
      forceUpdate({});
    });
  }, []);

  return store;
}
