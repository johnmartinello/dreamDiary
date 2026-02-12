import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Suspense, lazy } from 'react';
import { useDreamStore } from '../../store/dreamStore';
import { DreamList } from '../dreams/DreamList';
import { DreamEditor } from '../dreams/DreamEditor.tsx';

const DreamGraph = lazy(() => import('../dreams/DreamGraph').then((module) => ({ default: module.DreamGraph })));
const CategoryInsights = lazy(() =>
  import('../dreams/CategoryInsights').then((module) => ({ default: module.CategoryInsights }))
);

export function MainPanel() {
  const currentView = useDreamStore((state) => state.currentView);
  const prefersReducedMotion = useReducedMotion();
  

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <DreamList />;
      case 'dream':
        return <DreamEditor />;
      case 'graph':
        return (
          <Suspense fallback={<div className="h-full w-full" />}>
            <DreamGraph />
          </Suspense>
        );
      case 'insights':
        return (
          <Suspense fallback={<div className="h-full w-full" />}>
            <CategoryInsights />
          </Suspense>
        );
      default:
        return <DreamList />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden relative">
      
      <div className="h-full relative z-10">
        <AnimatePresence mode="sync">
          <motion.div
            key={currentView}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -14 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
