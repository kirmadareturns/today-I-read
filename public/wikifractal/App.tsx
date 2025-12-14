import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WikiNode, PanZoomState, SearchResult } from './types';
import RecursiveTree from './components/RecursiveTree';
import { fetchSuggestions, fetchWikiPage } from './services/wikiService';
import gsap from 'gsap';

// Constants
const INITIAL_SCALE = 1;

const App: React.FC = () => {
  // --- Refs for High Performance Animation ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Use a Ref for pan/zoom state to avoid React render cycle on every frame
  const transformState = useRef<PanZoomState>({ x: 0, y: 0, scale: INITIAL_SCALE });
  
  // Interaction Refs
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const touchStartDist = useRef<number>(0);
  const touchStartScale = useRef<number>(1);
  const lastDragTime = useRef<number>(0);
  const velocity = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // --- React State ---
  const [tree, setTree] = useState<WikiNode | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [zoomLevelDisplay, setZoomLevelDisplay] = useState(INITIAL_SCALE);

  // --- Initialization & Layout ---

  useEffect(() => {
    // Initial Node
    createRootNode("Internet");
    
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && transformState.current.scale === INITIAL_SCALE && transformState.current.x === 0) {
        // Optional: specific init logic for mobile
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Center initially
    centerView();

    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update DOM transform
  const updateTransform = useCallback(() => {
    if (!worldRef.current) return;
    const { x, y, scale } = transformState.current;
    
    // Round pixels for sharper text rendering
    const rx = Math.round(x);
    const ry = Math.round(y);
    
    worldRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`;
    setZoomLevelDisplay(scale);
  }, []);

  // --- Tree Management ---

  const createRootNode = async (title: string) => {
    const newNode: WikiNode = {
      id: uuidv4(),
      title,
      content: null,
      loading: true,
      error: null,
      children: []
    };
    setTree(newNode);
    fetchNodeContent(newNode.id, title);
  };

  const fetchNodeContent = async (nodeId: string, title: string) => {
    try {
      const data = await fetchWikiPage(title);
      updateNodeInTree(nodeId, (node) => ({
        ...node,
        title: data.title, // Update title with proper capitalization from API
        content: data.html,
        loading: false
      }));
    } catch (err: any) {
      updateNodeInTree(nodeId, (node) => ({
        ...node,
        loading: false,
        error: err.message || 'Failed to load'
      }));
    }
  };

  // Helper to deep update the tree
  const updateNodeInTree = (targetId: string, updateFn: (n: WikiNode) => WikiNode) => {
    setTree((prevTree) => {
      if (!prevTree) return null;

      const traverse = (node: WikiNode): WikiNode => {
        if (node.id === targetId) {
          return updateFn(node);
        }
        return {
          ...node,
          children: node.children.map(traverse)
        };
      };

      return traverse(prevTree);
    });
  };

  const handleAddChild = (title: string, parentId: string) => {
    // Check if child already exists to prevent dupes (optional, but good UX)
    // For now, allow multiple instances as user might want different paths
    
    const newNode: WikiNode = {
      id: uuidv4(),
      title,
      content: null,
      loading: true,
      error: null,
      children: [],
      parentId
    };

    updateNodeInTree(parentId, (node) => ({
      ...node,
      children: [...node.children, newNode]
    }));

    fetchNodeContent(newNode.id, title);
  };

  const handleRemoveNode = (id: string) => {
    setTree((prevTree) => {
      if (!prevTree) return null;
      if (prevTree.id === id) return null; // Can't really remove root, but safe check

      const traverse = (node: WikiNode): WikiNode => {
        return {
          ...node,
          children: node.children.filter(c => c.id !== id).map(traverse)
        };
      };
      return traverse(prevTree);
    });
  };

  // --- Interactions (Pan & Zoom) ---

  const centerView = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Approximate centering: width of card is 340-450.
    // Start slightly left of center so root is visible
    const cardWidth = isMobile ? 340 : 450;
    const startX = (vw / 2) - (cardWidth / 2);
    const startY = (vh / 2) - 300; // Half of card height roughly

    gsap.to(transformState.current, {
      x: startX,
      y: startY,
      scale: 1,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: updateTransform
    });
  };

  const handleZoom = (delta: number) => {
    const { scale, x, y } = transformState.current;
    const newScale = Math.min(Math.max(0.2, scale + delta), 3);
    
    // Zoom towards center of viewport
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    // Calculate world position of center
    const wx = (cx - x) / scale;
    const wy = (cy - y) / scale;
    
    const newX = cx - (wx * newScale);
    const newY = cy - (wy * newScale);

    gsap.to(transformState.current, {
        scale: newScale,
        x: newX,
        y: newY,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: updateTransform
    });
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in search
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      // Cancel existing animations
      gsap.killTweensOf(transformState.current);

      const PAN_AMOUNT = e.shiftKey ? 200 : 100;
      const DURATION = 0.2;
      const EASE = "power2.out";

      let newX = transformState.current.x;
      let newY = transformState.current.y;
      let shouldAnimate = false;

      switch (e.key) {
        case 'ArrowUp':
          newY += PAN_AMOUNT;
          shouldAnimate = true;
          break;
        case 'ArrowDown':
          newY -= PAN_AMOUNT;
          shouldAnimate = true;
          break;
        case 'ArrowLeft':
          newX += PAN_AMOUNT;
          shouldAnimate = true;
          break;
        case 'ArrowRight':
          newX -= PAN_AMOUNT;
          shouldAnimate = true;
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoom(0.2);
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoom(-0.2);
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
             e.preventDefault();
             centerView();
          }
          break;
      }

      if (shouldAnimate) {
        gsap.to(transformState.current, {
          x: newX,
          y: newY,
          duration: DURATION,
          ease: EASE,
          onUpdate: updateTransform
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateTransform]); // handleZoom/centerView are stable closures

  // --- Event Handlers (Mouse & Touch) ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-body') || 
        (e.target as HTMLElement).closest('input') || 
        (e.target as HTMLElement).closest('button')) return;

    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    lastDragTime.current = Date.now();
    
    // Kill momentum
    if (rafId.current) cancelAnimationFrame(rafId.current);
    gsap.killTweensOf(transformState.current);
    
    if (viewportRef.current) viewportRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    const dt = Date.now() - lastDragTime.current;

    transformState.current.x += dx;
    transformState.current.y += dy;
    updateTransform();

    // Calculate velocity
    if (dt > 0) {
      velocity.current = { x: dx / dt, y: dy / dt };
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
    lastDragTime.current = Date.now();
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (viewportRef.current) viewportRef.current.style.cursor = 'grab';

    // Apply momentum
    applyMomentum();
  };

  const applyMomentum = () => {
    const { x, y } = velocity.current;
    const magnitude = Math.sqrt(x * x + y * y);
    
    if (magnitude > 0.1) {
      const momentumX = x * 300; // factor
      const momentumY = y * 300;
      
      gsap.to(transformState.current, {
        x: transformState.current.x + momentumX,
        y: transformState.current.y + momentumY,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: updateTransform
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // If Ctrl is pressed, zoom
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.002;
        handleZoom(delta);
    } else {
        // Pan
        if ((e.target as HTMLElement).closest('.card-body')) return; // Allow internal scroll
        
        transformState.current.x -= e.deltaX;
        transformState.current.y -= e.deltaY;
        updateTransform();
    }
  };

  // --- Touch Logic (Passive listeners must be added via ref in useEffect) ---
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
        if ((e.target as HTMLElement).closest('.card-body') || 
            (e.target as HTMLElement).closest('input') || 
            (e.target as HTMLElement).closest('button')) return;
        
        // e.preventDefault(); // Prevent default if we want full control, but might block card scroll
        // Strategy: Only prevent default if 2 fingers or touching background
        if (e.touches.length === 2 || !(e.target as HTMLElement).closest('.card-body')) {
             e.preventDefault();
        }

        isDragging.current = true;
        
        if (e.touches.length === 1) {
            lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            velocity.current = { x: 0, y: 0 };
            lastDragTime.current = Date.now();
            gsap.killTweensOf(transformState.current);
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchStartDist.current = Math.hypot(dx, dy);
            touchStartScale.current = transformState.current.scale;
        }
    };

    const onTouchMove = (e: TouchEvent) => {
        if (!isDragging.current) return;
        
         if (e.touches.length === 2 || !(e.target as HTMLElement).closest('.card-body')) {
             e.preventDefault();
        }

        if (e.touches.length === 1) {
            const clientX = e.touches[0].clientX;
            const clientY = e.touches[0].clientY;
            
            const dx = clientX - lastMousePos.current.x;
            const dy = clientY - lastMousePos.current.y;
            const dt = Date.now() - lastDragTime.current;

            transformState.current.x += dx;
            transformState.current.y += dy;
            updateTransform();

            if (dt > 0) {
                 velocity.current = { x: dx / dt, y: dy / dt };
            }
            lastMousePos.current = { x: clientX, y: clientY };
            lastDragTime.current = Date.now();

        } else if (e.touches.length === 2) {
            // Pinch Zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            
            if (touchStartDist.current > 0) {
                const scaleFactor = dist / touchStartDist.current;
                const newScale = touchStartScale.current * scaleFactor;
                // Clamp
                transformState.current.scale = Math.min(Math.max(0.2, newScale), 3);
                
                updateTransform();
            }
        }
    };

    const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length === 0) {
            isDragging.current = false;
            applyMomentum();
        }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    
    return () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTransform]); // updateTransform is stable via useCallback

  // --- Search Logic ---
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsSearching(true);
        try {
          const results = await fetchSuggestions(searchQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const selectSuggestion = (title: string) => {
    createRootNode(title);
    setSearchQuery('');
    setShowSuggestions(false);
    centerView();
  };

  return (
    <div className="w-full h-screen bg-[#050508] relative overflow-hidden text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* --- Search UI --- */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[420px]">
        <div className="relative group">
            <div className={`absolute inset-0 bg-blue-500/20 rounded-xl blur-lg transition-opacity duration-300 ${showSuggestions ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
            <div className="relative bg-[#18181b]/90 backdrop-blur-xl border border-[#27272a] rounded-xl flex items-center px-4 py-3 shadow-2xl transition-colors focus-within:border-blue-500/50">
                <i className="ri-search-line text-slate-400 mr-3 text-lg"></i>
                <input 
                    ref={searchInputRef}
                    type="text" 
                    className="bg-transparent border-none outline-none text-white placeholder-slate-500 flex-1 text-base"
                    placeholder="Search Wikipedia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if(suggestions.length) setShowSuggestions(true); }}
                />
                {isSearching && <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>}
            </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden z-50">
                {suggestions.map((s, i) => (
                    <div 
                        key={i}
                        className="px-4 py-3 hover:bg-[#27272a] cursor-pointer flex justify-between items-center group transition-colors"
                        onClick={() => selectSuggestion(s.title)}
                    >
                        <span className="font-medium text-slate-200 group-hover:text-white">{s.title}</span>
                        <span className="text-xs text-slate-500 truncate max-w-[40%]">{s.description}</span>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- Controls --- */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button 
            onClick={() => handleZoom(0.2)}
            className="w-12 h-12 bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-xl text-slate-400 hover:text-white hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center text-xl shadow-lg"
            title="Zoom In"
        >
            <i className="ri-add-line"></i>
        </button>
        <div className="bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-xl px-2 py-1 text-center min-w-[3rem]">
            <span className="text-xs font-mono text-blue-400">{zoomLevelDisplay.toFixed(1)}x</span>
        </div>
        <button 
             onClick={() => handleZoom(-0.2)}
             className="w-12 h-12 bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-xl text-slate-400 hover:text-white hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center text-xl shadow-lg"
             title="Zoom Out"
        >
            <i className="ri-subtract-line"></i>
        </button>
        <button 
            onClick={centerView}
            className="w-12 h-12 bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-xl text-slate-400 hover:text-white hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center text-xl shadow-lg mt-2"
            title="Reset View"
        >
            <i className="ri-focus-3-line"></i>
        </button>
      </div>

      {/* --- Main Viewport --- */}
      <div 
        id="viewport"
        ref={viewportRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
            id="world"
            ref={worldRef}
            className="absolute origin-top-left will-change-transform"
            style={{ 
                // Initial transform
                transform: `translate3d(0px, 0px, 0px) scale(${INITIAL_SCALE})`
            }}
        >
            {tree && (
                <RecursiveTree 
                    node={tree} 
                    isMobile={isMobile}
                    onClose={handleRemoveNode}
                    onLinkClick={handleAddChild}
                />
            )}
        </div>
      </div>

      {/* Intro / Empty State */}
      {!tree && !isSearching && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-center opacity-30">
                <i className="ri-share-line text-6xl mb-4 block"></i>
                <p className="text-xl font-light tracking-wide">Enter a topic to begin exploration</p>
             </div>
        </div>
      )}

    </div>
  );
};

export default App;