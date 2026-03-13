import { useEffect } from 'react';
import AppRoutes from './routes';
import useGlobalStore from './state/globalStore';

export default function App() {
  const theme = useGlobalStore(state => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initial sync
  useEffect(() => {
    const init = useGlobalStore.getState().theme;
    if (init === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  return <AppRoutes />;
}
