import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Filter, Search } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useDreamStore } from '../../store/dreamStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { TagPill } from './TagPill';
import { formatDateForInput, useWindowSize } from '../../utils';
import { cn } from '../../utils';
import { useI18n } from '../../hooks/useI18n';
import { getFixedCategoryDefaultName, getFixedCategoryLabelKey, resolveCategoryColorHex, UNCATEGORIZED_CATEGORY_ID } from '../../types/taxonomy';
import type { CategoryColor } from '../../types/taxonomy';

interface GraphNode {
  id: string;
  title: string;
  date: string;
  tags: { id: string; label: string; categoryId: string }[];
  citedDreams: string[];
  citationCount: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
}

export function DreamGraph() {
  console.log('DreamGraph component rendered');
  
  const { t } = useI18n();
  const {
    setCurrentView,
    setSelectedDream,
    getGraphData,
    updateGraphFilters,
    graphFilters,
    getTagColor,
    getAllTagsWithColors,
    categories,
  } = useDreamStore();

  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const graphRef = useRef<any>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  
  // Get window size for responsive design
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  const getCategoryDisplayName = useCallback((categoryId: string): string => {
    if (!categoryId || categoryId === UNCATEGORIZED_CATEGORY_ID) return t('uncategorized');
    const key = getFixedCategoryLabelKey(categoryId);
    if (key) {
      const translated = t(key);
      if (translated !== key) return translated;
      return getFixedCategoryDefaultName(categoryId) || translated;
    }
    return categories.find((category) => category.id === categoryId)?.name || categoryId;
  }, [categories, t]);

  // Calculate responsive graph dimensions
  const graphDimensions = useMemo(() => {
    // Account for sidebar width (approximately 280px) and padding
    const availableWidth = windowWidth - 280 - 48; // sidebar + padding
    
    // Get actual filters panel height
    const filterPanelHeight = showFilters && filtersPanelRef.current 
      ? filtersPanelRef.current.offsetHeight 
      : 0;
    
    const navigationHeight = 80; // Approximate height of navigation bar
    const padding = 48; // Padding around the graph
    const availableHeight = windowHeight - navigationHeight - filterPanelHeight - padding;
    
    // Set minimum and maximum dimensions
    const minWidth = 400;
    const minHeight = 300;
    const maxWidth = 1200;
    const maxHeight = 800;
    
    const graphWidth = Math.max(minWidth, Math.min(maxWidth, availableWidth));
    const graphHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
    
    return { width: graphWidth, height: graphHeight };
  }, [windowWidth, windowHeight, showFilters]);

  // Update graph data when filters change
  useEffect(() => {
    console.log('Getting graph data...');
    const data = getGraphData();
    console.log('Graph data received:', data);
    setGraphData({
      nodes: data.nodes as unknown as GraphNode[],
      links: data.edges as unknown as GraphEdge[]
    });
  }, [getGraphData, graphFilters]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedDream(node.id);
    setCurrentView('dream');
  }, [setSelectedDream, setCurrentView]);

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  // Filter handlers
  const handleTagToggle = (tagName: string) => {
    const newSelectedTags = graphFilters.selectedTags.includes(tagName)
      ? graphFilters.selectedTags.filter(tag => tag !== tagName)
      : [...graphFilters.selectedTags, tagName];
    
    updateGraphFilters({ selectedTags: newSelectedTags });
  };

  const handleShowIsolatedToggle = () => {
    updateGraphFilters({ showIsolated: !graphFilters.showIsolated });
  };

  // Derived node sizing/color helpers
  const getNodeColor = (node: GraphNode) => {
    if (node.tags.length === 0) return '#6b7280';
    const primaryTag = node.tags[0];
    const color = getTagColor(primaryTag.id);
    return resolveCategoryColorHex(color);
  };

  const getNodeSize = (node: GraphNode) => {
    return Math.max(5, Math.min(15, 8 + node.citationCount * 2));
  };

  // Ensure isolated filtering based on current links and enforce circular layout
  const renderedGraphData = useMemo(() => {
    // Filter isolated nodes if requested, based on current links
    let nodes = graphData.nodes;
    let links = graphData.links;

    if (!graphFilters.showIsolated) {
      const connectedIds = new Set<string>();
      links.forEach((l: any) => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        connectedIds.add(String(s));
        connectedIds.add(String(t));
      });
      nodes = nodes.filter(n => connectedIds.has(n.id));
      const validId = new Set(nodes.map(n => n.id));
      links = links.filter((l: any) => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return validId.has(String(s)) && validId.has(String(t));
      });
    }

    // Circular layout positions (responsive to graph size)
    const nodeCount = nodes.length || 1;
    const minRadius = Math.min(graphDimensions.width, graphDimensions.height) * 0.15;
    const maxRadius = Math.min(graphDimensions.width, graphDimensions.height) * 0.35;
    const radius = Math.max(minRadius, Math.min(maxRadius, 50 + nodeCount * 8));
    const angleStep = (2 * Math.PI) / nodeCount;
    const positionedNodes = nodes.map((node, index) => ({
      ...node,
      fx: Math.cos(index * angleStep) * radius,
      fy: Math.sin(index * angleStep) * radius,
    }));

    return { nodes: positionedNodes, links };
  }, [graphData, graphFilters.showIsolated]);

  // Centralize graph view
  const handleCentralizeGraph = () => {
    if (graphRef.current && renderedGraphData.nodes.length > 0) {
      graphRef.current.centerAt(0, 0, 1000);
      const nodeCount = renderedGraphData.nodes.length;
      const baseZoom = Math.min(graphDimensions.width, graphDimensions.height) / 400;
      const zoomFactor = Math.max(0.8, Math.min(2.0, baseZoom * (1 + nodeCount * 0.1)));
      graphRef.current.zoom(zoomFactor, 1000);
    }
  };

  // Search and focus on dream
  const handleSearchDream = (dreamId: string) => {
    const node = renderedGraphData.nodes.find(n => n.id === dreamId);
    if (node && graphRef.current) {
      // Center on the specific node
      graphRef.current.centerAt(node.fx || 0, node.fy || 0, 1000);
      graphRef.current.zoom(2.5, 1000); // Zoom in to focus on the node
    }
  };

  // Filter dreams based on search query
  const filteredDreams = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return renderedGraphData.nodes.filter(node =>
      node.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, renderedGraphData.nodes]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    if (!filteredDreams.length) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchPanelRef.current) return;
      if (!searchPanelRef.current.contains(event.target as Node)) {
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [filteredDreams.length]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredDreams.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredDreams.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredDreams.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredDreams.length) {
          handleSearchDream(filteredDreams[selectedIndex].id);
          setSearchQuery('');
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setSearchQuery('');
        setSelectedIndex(-1);
        break;
    }
  };

  // Center the graph view when data changes or dimensions change
  useEffect(() => {
    if (graphRef.current && renderedGraphData.nodes.length > 0) {
      // Use setTimeout to ensure the graph has rendered
      setTimeout(() => {
        graphRef.current.centerAt(0, 0, 1000);
        // Adjust zoom based on graph size and number of nodes
        const nodeCount = renderedGraphData.nodes.length;
        const baseZoom = Math.min(graphDimensions.width, graphDimensions.height) / 400;
        const zoomFactor = Math.max(0.8, Math.min(2.0, baseZoom * (1 + nodeCount * 0.1)));
        graphRef.current.zoom(zoomFactor, 1000);
      }, 100);
    }
  }, [renderedGraphData.nodes.length, graphDimensions]);

  // Force recalculation when filters panel height changes
  useEffect(() => {
    if (showFilters) {
      // Small delay to ensure the filters panel has rendered
      const timer = setTimeout(() => {
        // Trigger a re-render by updating a state that affects graphDimensions
        setGraphData(prev => ({ ...prev }));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showFilters]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentView('home')} className="flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2",
                  showFilters && "bg-purple-500/20 text-purple-300 border-purple-400/30"
                )}
                aria-label={t('filters')}
                title={t('filters')}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div ref={filtersPanelRef} className="px-6 py-4 border-b border-white/10 relative z-10">
          <Card variant="glass" className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  {t('categories')}
                </label>
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                  {[{ id: UNCATEGORIZED_CATEGORY_ID, color: 'violet' as CategoryColor }, ...categories].map((meta) => (
                    <button
                      key={meta.id}
                      onClick={() => handleTagToggle(`category:${meta.id}`)}
                      className="cursor-pointer"
                      title={getCategoryDisplayName(meta.id)}
                    >
                      <TagPill
                        tag={getCategoryDisplayName(meta.id)}
                        size="sm"
                        variant={graphFilters.selectedTags.includes(`category:${meta.id}`) ? "gradient" : "default"}
                        color={meta.color}
                      />
                    </button>
                  ))}
                  {getAllTagsWithColors().map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className="cursor-pointer"
                    >
                      <TagPill
                        tag={tag.label}
                        size="sm"
                        variant={graphFilters.selectedTags.includes(tag.id) ? "gradient" : "default"}
                        color={tag.color}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Dreams */}
              <div ref={searchPanelRef} className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  {t('searchDreams')}
                </label>
                <div className="space-y-2">
                  <Input
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('searchDreamTitles')}
                    variant="transparent"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                  {filteredDreams.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-black/95 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl max-h-48 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {filteredDreams.slice(0, 8).map((dream, index) => (
                          <button
                            key={dream.id}
                            onClick={() => {
                              handleSearchDream(dream.id);
                              setSearchQuery('');
                              setSelectedIndex(-1);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                              "w-full text-left p-2 rounded transition-colors text-sm",
                              selectedIndex === index 
                                ? "bg-purple-500/20 text-purple-200 border border-purple-400/30" 
                                : "bg-white/5 hover:bg-white/10 text-white"
                            )}
                          >
                            <div className="font-medium truncate">{dream.title}</div>
                            <div className="text-xs text-gray-400">{formatDateForInput(dream.date)}</div>
                          </button>
                        ))}
                        {filteredDreams.length > 8 && (
                          <div className="text-xs text-gray-400 text-center py-1">
                            {t('moreResults', { count: filteredDreams.length - 8 })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  {t('controls')}
                </label>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCentralizeGraph}
                    className="flex items-center gap-2 text-purple-300 hover:text-purple-200 hover:glass hover:bg-purple-500/10"
                  >
                    {t('centerView')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowIsolatedToggle}
                    className={cn(
                      "flex items-center gap-2",
                      graphFilters.showIsolated ? "text-purple-300" : undefined
                    )}
                  >
                    {graphFilters.showIsolated ? t('hideIsolated') : t('showIsolated')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Graph Container */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          {renderedGraphData.nodes.length === 0 ? (
            <div className="flex items-center justify-center">
              <Card variant="glass" className="text-center p-12 relative overflow-hidden group">
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  
                  <h2 className="text-2xl font-semibold text-white/90 mb-4">{t('noDreamsToDisplay')}</h2>
                  <p className="text-white/60 mb-6">
                    {graphFilters.selectedTags.length > 0
                      ? t('tryAdjustingFilters')
                      : t('createDreamsAndCitations')}
                  </p>
                  <Button 
                    onClick={() => setCurrentView('home')} 
                    variant="ghost"
                    className="h-12 text-base rounded-xl relative overflow-hidden group cursor-pointer glass text-white/90 font-medium shadow-inner-lg border border-white/20 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20"
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 flex items-center">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t('backToDreams')}
                    </span>
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div 
              className="relative bg-white/5 rounded-lg border border-white/10 overflow-hidden shadow-lg"
              style={{
                width: `${graphDimensions.width}px`,
                height: `${graphDimensions.height}px`,
                maxWidth: '100%',
                maxHeight: '100%',
                zIndex: 1,
              }}
            >
                          <ForceGraph2D
              ref={graphRef}
              graphData={renderedGraphData}
              width={graphDimensions.width}
              height={graphDimensions.height}
              nodeLabel={(node: GraphNode) => `
                <div class="bg-black/90 p-3 rounded-lg border border-white/20">
                  <div class="font-semibold text-white">${node.title}</div>
                  <div class="text-gray-300 text-sm">${formatDateForInput(node.date)}</div>
                  <div class="text-gray-400 text-xs mt-1">${t('citations')}: ${node.citationCount}</div>
                  ${node.tags.length > 0 ? `<div class=\"text-gray-400 text-xs mt-1\">${t('tags')}: ${node.tags.map(t => t.label).join(', ')}</div>` : ''}
                </div>
              `}
              nodeColor={getNodeColor}
              nodeVal={getNodeSize}
              nodeRelSize={6}
              linkColor={() => '#ffffff40'}
              linkWidth={1}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              cooldownTicks={0}
              backgroundColor="transparent"
              enableNodeDrag={false}
              enableZoomInteraction={true}
              enablePanInteraction={true}
            />
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      {hoveredNode && (
        <div className="absolute top-4 right-4 z-10">
          <Card variant="glass" className="p-4 max-w-xs">
            <h3 className="font-semibold text-white mb-2">{hoveredNode.title}</h3>
            <p className="text-sm text-gray-300 mb-2">{formatDateForInput(hoveredNode.date)}</p>
            <p className="text-xs text-gray-400 mb-2">{t('citations')}: {hoveredNode.citationCount}</p>
            {hoveredNode.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hoveredNode.tags.slice(0, 3).map((tag) => (
                  <TagPill
                    key={tag.id}
                    tag={tag.label}
                    size="sm"
                    variant="gradient"
                    color={getTagColor(tag.id)}
                  />
                ))}
                {hoveredNode.tags.length > 3 && (
                  <span className="text-xs text-gray-400">{t('moreResults', { count: hoveredNode.tags.length - 3 })}</span>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card variant="glass" className="p-3">
          <div className="text-sm text-gray-300">
            <div>{t('nodes')}: {renderedGraphData.nodes.length}</div>
            <div>{t('connections')}: {renderedGraphData.links.length}</div>
            <div className="text-xs text-gray-400 mt-1">
              {t('size')}: {Math.round(graphDimensions.width)}×{Math.round(graphDimensions.height)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
