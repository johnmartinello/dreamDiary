import { AppLayout } from './components/layout/AppLayout';
import { LockScreen } from './components/auth/LockScreen';
import { usePasswordStore } from './store/passwordStore';
import { useActivityTracker } from './hooks/useActivityTracker';
import { useHorizontalWheelScroll } from './hooks/useHorizontalWheelScroll';

function App() {
  const isLocked = usePasswordStore((state) => state.isLocked);
  const isFirstLaunch = usePasswordStore((state) => state.isFirstLaunch);
  
  // Track user activity for auto-lock
  useActivityTracker();
  useHorizontalWheelScroll();

  // Show lock screen if app is locked or if it's first launch
  if (isLocked || isFirstLaunch) {
    return <LockScreen isFirstLaunch={isFirstLaunch} />;
  }

  return <AppLayout />;
}

export default App;
