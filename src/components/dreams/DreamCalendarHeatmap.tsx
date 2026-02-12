import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDreamStore } from '../../store/dreamStore';
import { useI18n } from '../../hooks/useI18n';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type TooltipState = {
  left: number;
  top: number;
  placeLeft: boolean;
  text: string;
  color: string;
};

const CELL_SIZE = 12;
const CELL_GAP = 3;
const GRID_COLUMNS = 53;
const GRID_ROWS = 7;
const TOOLTIP_HORIZONTAL_OFFSET = 10;
const TOOLTIP_VERTICAL_OFFSET = 10;
const TOOLTIP_EDGE_PADDING = 8;

const HEATMAP_COLORS = [
  'rgba(255, 255, 255, 0.06)',
  '#ffb088',
  '#ff8c66',
  '#ff6b4a',
  '#e8453c',
];

const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDreamDate = (dateString: string): Date | null => {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts.map(Number);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const getHeatLevel = (count: number): number => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
};

export function DreamCalendarHeatmap() {
  const dreams = useDreamStore((state) => state.dreams);
  const { t, language } = useI18n();
  const currentYear = new Date().getFullYear();

  const allDreamYears = useMemo(() => {
    const years = dreams
      .map((dream) => parseDreamDate(dream.date))
      .filter((date): date is Date => date !== null)
      .map((date) => date.getFullYear());

    const unique = Array.from(new Set(years)).sort((a, b) => a - b);
    return unique.length > 0 ? unique : [currentYear];
  }, [dreams, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const minYear = allDreamYears[0];
  const maxYear = allDreamYears[allDreamYears.length - 1];
  const showYearSelector = allDreamYears.length > 1;

  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>();

    dreams.forEach((dream) => {
      const date = parseDreamDate(dream.date);
      if (!date || date.getFullYear() !== selectedYear) {
        return;
      }

      const key = getDateKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [dreams, selectedYear]);

  const totalDreamsInYear = useMemo(
    () => Array.from(countsByDate.values()).reduce((sum, value) => sum + value, 0),
    [countsByDate]
  );

  const gridData = useMemo(() => {
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);
    const gridStart = new Date(startOfYear);
    gridStart.setDate(startOfYear.getDate() - startOfYear.getDay());

    const cells: Array<{
      date: Date;
      key: string;
      count: number;
      level: number;
      weekIndex: number;
      dayIndex: number;
      isInSelectedYear: boolean;
    }> = [];

    for (let weekIndex = 0; weekIndex < GRID_COLUMNS; weekIndex += 1) {
      for (let dayIndex = 0; dayIndex < GRID_ROWS; dayIndex += 1) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
        const key = getDateKey(date);
        const count = countsByDate.get(key) ?? 0;

        cells.push({
          date,
          key,
          count,
          level: getHeatLevel(count),
          weekIndex,
          dayIndex,
          isInSelectedYear: date >= startOfYear && date <= endOfYear,
        });
      }
    }

    const monthStarts = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(selectedYear, monthIndex, 1);
      const diffDays = Math.floor((monthStart.getTime() - gridStart.getTime()) / 86400000);
      return {
        monthIndex,
        weekIndex: Math.floor(diffDays / 7),
      };
    }).filter((item) => item.weekIndex >= 0 && item.weekIndex < GRID_COLUMNS);

    return { cells, monthStarts };
  }, [selectedYear, countsByDate]);

  const monthLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { month: 'short' }),
    [language]
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [language]
  );

  const weekdayLabels = useMemo(() => {
    const baseDate = new Date(2026, 0, 4); // Sunday baseline for stable ordering
    return Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(language, { weekday: 'short' }).format(
        new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i)
      )
    );
  }, [language]);

  const heatmapWidth = GRID_COLUMNS * CELL_SIZE + (GRID_COLUMNS - 1) * CELL_GAP;

  const handleMouseEnter = (
    event: React.MouseEvent<HTMLDivElement>,
    cell: { count: number; date: Date; level: number; isInSelectedYear: boolean }
  ) => {
    if (!cell.isInSelectedYear) {
      return;
    }

    const formattedDate = dateFormatter.format(cell.date);
    const text =
      cell.count > 0
        ? t('dreamsOnDate', { count: cell.count, date: formattedDate })
        : t('noDreamsOnDate', { date: formattedDate });

    const estimatedTooltipWidth = Math.min(360, Math.max(170, text.length * 7 + 26));
    const maxRight = window.innerWidth - TOOLTIP_EDGE_PADDING;
    const maxBottom = window.innerHeight - TOOLTIP_EDGE_PADDING;
    const placeLeft = event.clientX + TOOLTIP_HORIZONTAL_OFFSET + estimatedTooltipWidth > maxRight;

    const left = placeLeft
      ? event.clientX - TOOLTIP_HORIZONTAL_OFFSET
      : event.clientX + TOOLTIP_HORIZONTAL_OFFSET;
    const unclampedTop = event.clientY - TOOLTIP_VERTICAL_OFFSET;
    const top = Math.max(34, Math.min(unclampedTop, maxBottom));

    setTooltip({
      left,
      top,
      placeLeft,
      text,
      color: HEATMAP_COLORS[cell.level],
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white/80">{t('dreamCalendar')}</h3>
            <p className="text-xs text-white/50">
              {totalDreamsInYear} {totalDreamsInYear === 1 ? t('dream') : t('dreams')} - {selectedYear}
            </p>
          </div>

          {showYearSelector && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white/70 hover:text-white/90"
                onClick={() => setSelectedYear((prev) => Math.max(minYear, prev - 1))}
                disabled={selectedYear <= minYear}
                aria-label={`Previous year (${selectedYear - 1})`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white/75 min-w-[56px] text-center">{selectedYear}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white/70 hover:text-white/90"
                onClick={() => setSelectedYear((prev) => Math.min(maxYear, prev + 1))}
                disabled={selectedYear >= maxYear}
                aria-label={`Next year (${selectedYear + 1})`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="w-full flex justify-center">
            <div className="relative min-w-fit">
            <div className="flex gap-2">
              <div
                className="text-[10px] text-white/45 mt-6"
                style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
                  rowGap: `${CELL_GAP}px`,
                  width: 26,
                }}
              >
                {weekdayLabels.map((label, dayIndex) => (
                  <div key={label} className="leading-3">
                    {dayIndex === 1 || dayIndex === 3 || dayIndex === 5 ? label : ''}
                  </div>
                ))}
              </div>

              <div>
                <div className="relative mb-2 h-4" style={{ width: heatmapWidth }}>
                  {gridData.monthStarts.map((month) => (
                    <span
                      key={`${selectedYear}-${month.monthIndex}`}
                      className="absolute text-[10px] text-white/45"
                      style={{ left: month.weekIndex * (CELL_SIZE + CELL_GAP) }}
                    >
                      {monthLabelFormatter.format(new Date(selectedYear, month.monthIndex, 1))}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${CELL_SIZE}px)`,
                    gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
                    gap: `${CELL_GAP}px`,
                    width: heatmapWidth,
                  }}
                >
                  {gridData.cells.map((cell) => (
                    <div
                      key={cell.key}
                      className="rounded-[3px] transition-all duration-150"
                      style={{
                        gridColumnStart: cell.weekIndex + 1,
                        gridRowStart: cell.dayIndex + 1,
                        backgroundColor: cell.isInSelectedYear
                          ? HEATMAP_COLORS[cell.level]
                          : 'rgba(255, 255, 255, 0.03)',
                        border: cell.isInSelectedYear
                          ? '1px solid rgba(255,255,255,0.08)'
                          : '1px solid rgba(255,255,255,0.04)',
                      }}
                      onMouseEnter={(event) => handleMouseEnter(event, cell)}
                      onMouseMove={(event) => handleMouseEnter(event, cell)}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              </div>
            </div>

            </div>
          </div>
        </div>

        {tooltip &&
          createPortal(
            <div
              className="fixed pointer-events-none px-2.5 py-1.5 text-[11px] rounded-md border border-white/15 text-white/90 glass z-[200] whitespace-nowrap"
              style={{
                left: tooltip.left,
                top: tooltip.top,
                transform: `${tooltip.placeLeft ? 'translateX(-100%) ' : ''}translateY(-100%)`,
                boxShadow: `0 0 0 1px ${tooltip.color}33, 0 8px 24px rgba(0,0,0,0.35)`,
              }}
            >
              {tooltip.text}
            </div>,
            document.body
          )}

        <div className="flex justify-end items-center mt-3 text-[11px] text-white/50 gap-2">
          <span>{t('less')}</span>
          {HEATMAP_COLORS.map((color, index) => (
            <span
              key={`legend-${index}`}
              className="w-3 h-3 rounded-[3px] border border-white/15 inline-block"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>{t('more')}</span>
        </div>
      </Card>
    </motion.div>
  );
}
