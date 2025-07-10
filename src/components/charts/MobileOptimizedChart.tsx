'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Info,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { usePinchGesture, useLongPress } from '@/hooks/useMobileGestures';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MobileOptimizedChartProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  onExport?: () => void;
  onShare?: () => void;
  className?: string;
  enableZoom?: boolean;
  enableSwipe?: boolean;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
}

export function MobileOptimizedChart({
  children,
  title,
  description,
  onExport,
  onShare,
  className = '',
  enableZoom = true,
  enableSwipe = false,
  chartType = 'line',
}: MobileOptimizedChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  // Pinch to zoom
  const { isPinching } = usePinchGesture((pinchScale) => {
    if (enableZoom) {
      const newScale = Math.max(0.5, Math.min(3, pinchScale));
      setScale(newScale);
    }
  });

  // Long press for tooltip
  const longPressProps = useLongPress(() => {
    setShowTooltip(true);
  }, 500);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Touch-optimized controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  // Mobile-specific chart optimizations
  const getChartHeight = () => {
    if (isFullscreen) return '100vh';
    if (isMobile) {
      switch (chartType) {
        case 'pie': return '300px';
        case 'bar': return '250px';
        default: return '200px';
      }
    }
    return '400px';
  };

  return (
    <Card className={`relative overflow-hidden ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
              {title}
            </h3>
            {description && (
              <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {description}
              </p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isMobile && enableZoom && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(scale * 100)}%
              </Badge>
            )}
            
            {!isMobile && (
              <>
                {onShare && (
                  <Button variant="ghost" size="sm" onClick={onShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                {onExport && (
                  <Button variant="ghost" size="sm" onClick={onExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="touch-manipulation"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartRef}
        className="relative overflow-auto"
        style={{ height: getChartHeight() }}
        {...(isMobile ? longPressProps : {})}
      >
        <motion.div
          className="w-full h-full"
          style={{ scale }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.div>

        {/* Touch Tooltip */}
        {showTooltip && tooltipData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10"
            onTouchEnd={() => setShowTooltip(false)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTooltip(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="text-sm space-y-1">
              {/* Tooltip content would be populated by chart library */}
              <p>Touch and hold to see details</p>
            </div>
          </motion.div>
        )}

        {/* Pinch indicator */}
        {isPinching && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {Math.round(scale * 100)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      {isMobile && (
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            {/* Zoom controls */}
            {enableZoom && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="touch-manipulation"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetZoom}
                  className="touch-manipulation px-3"
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  disabled={scale >= 3}
                  className="touch-manipulation"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex items-center gap-2">
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="touch-manipulation"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="touch-manipulation"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              {enableZoom && 'Pinch to zoom • '}
              Long press for details
              {enableSwipe && ' • Swipe to navigate'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

// Chart Legend optimized for mobile
interface MobileChartLegendProps {
  items: {
    name: string;
    color: string;
    value?: string | number;
  }[];
  orientation?: 'horizontal' | 'vertical';
}

export function MobileChartLegend({ 
  items, 
  orientation = 'horizontal' 
}: MobileChartLegendProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = isMobile ? 3 : 6;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = items.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (orientation === 'vertical' || !isMobile) {
    return (
      <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-wrap'} gap-2`}>
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">{item.name}</span>
            {item.value && (
              <span className="text-sm font-medium ml-1">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Mobile paginated legend
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="h-6 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3 overflow-x-auto">
          {paginatedItems.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
              {item.value && (
                <span className="text-xs font-medium">{item.value}</span>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          disabled={currentPage >= totalPages - 1}
          className="h-6 px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }).map((_, index) => (
            <div
              key={index}
              className={`h-1 w-1 rounded-full transition-colors ${
                index === currentPage ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}