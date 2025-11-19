import React, { useState, useEffect, useRef } from 'react';
import { Layer, CanvasDimensions } from '../types';
import { RotateCw } from 'lucide-react';

interface EditorProps {
  backgroundSrc: string | null;
  layers: Layer[];
  selectedLayerId: string | null;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onSelectLayer: (id: string | null) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

type DragMode = 'move' | 'resize' | 'rotate';
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

interface DragState {
    mode: DragMode;
    handle?: ResizeHandle;
    startX: number;
    startY: number;
    // Snapshot of the layer state at the start of the drag
    startLayerState: {
        x: number;
        y: number;
        width: number;
        height: number;
        scale: number;
        rotation: number;
    };
    // World coordinates of the center at drag start
    centerWorldStart: { x: number; y: number };
    // World coordinates of the fixed pivot (opposite corner) for resizing
    pivotWorld?: { x: number; y: number };
    // Initial distance/angle for calculations
    startDist?: number;
    startAngle?: number;
}

// Helper: Convert degrees to radians
const toRad = (deg: number) => deg * Math.PI / 180;

// Helper: Rotate a point (x,y) around center (cx, cy)
const rotatePointAroundCenter = (x: number, y: number, cx: number, cy: number, rad: number) => {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
    const ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
    return { x: nx, y: ny };
};

const Editor: React.FC<EditorProps> = ({
  backgroundSrc,
  layers,
  selectedLayerId,
  onUpdateLayer,
  onSelectLayer,
  canvasRef
}) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [bgSize, setBgSize] = useState<CanvasDimensions>({ width: 800, height: 600 });
  
  // To prevent selecting the background when just finishing a drag
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (backgroundSrc) {
      const img = new Image();
      img.onload = () => {
        setBgSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = backgroundSrc;
    }
  }, [backgroundSrc]);

  const getLocalCoords = (e: React.PointerEvent | PointerEvent) => {
      if (!canvasRef.current) return { x: e.clientX, y: e.clientY };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
  };

  const handlePointerDown = (e: React.PointerEvent, layerId: string, mode: DragMode, handle?: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Immediate selection
    if (selectedLayerId !== layerId) {
        onSelectLayer(layerId);
    }
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const { x: mouseX, y: mouseY } = getLocalCoords(e);
    
    // Calculate current center in World Space
    // Since transform-origin is center, visual center is at x + w/2, y + h/2 (if we ignore scale for a moment?)
    // No, with transform-origin: center:
    // The div is positioned at (x, y) with size (w, h).
    // The center is at (x + w/2, y + h/2).
    // Rotation and Scale happen around this point.
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;

    const state: DragState = {
        mode,
        handle,
        startX: mouseX,
        startY: mouseY,
        startLayerState: { ...layer },
        centerWorldStart: { x: cx, y: cy }
    };

    if (mode === 'resize' && handle) {
        // Determine pivot (opposite corner) in UNROTATED local space relative to top-left
        let px = 0, py = 0;
        // If dragging NW, pivot is SE (w, h)
        switch (handle) {
            case 'nw': px = layer.width; py = layer.height; break;
            case 'ne': px = 0; py = layer.height; break;
            case 'sw': px = layer.width; py = 0; break;
            case 'se': px = 0; py = 0; break;
        }

        // Convert this unscaled local point to offset from center
        // Local center is (w/2, h/2)
        const dx = (px - layer.width / 2) * layer.scale;
        const dy = (py - layer.height / 2) * layer.scale;

        // Rotate this offset
        const rad = toRad(layer.rotation);
        const rotatedOffX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const rotatedOffY = dx * Math.sin(rad) + dy * Math.cos(rad);

        // Pivot World Position
        state.pivotWorld = {
            x: cx + rotatedOffX,
            y: cy + rotatedOffY
        };
        
        // Distance from Pivot to Mouse (for scaling ratio)
        // We use the midpoint of mouse and pivot as new center
        state.startDist = Math.hypot(mouseX - state.pivotWorld.x, mouseY - state.pivotWorld.y);
    } else if (mode === 'rotate') {
        state.startAngle = Math.atan2(mouseY - cy, mouseX - cx);
    }

    setDragState(state);
    isDraggingRef.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || !selectedLayerId) return;
    isDraggingRef.current = true;

    const { x: currX, y: currY } = getLocalCoords(e);
    const { startX, startY, startLayerState, centerWorldStart } = dragState;
    
    if (dragState.mode === 'move') {
        const dx = currX - startX;
        const dy = currY - startY;
        onUpdateLayer(selectedLayerId, {
            x: startLayerState.x + dx,
            y: startLayerState.y + dy
        });
    } 
    else if (dragState.mode === 'rotate' && dragState.startAngle !== undefined) {
        const currAngle = Math.atan2(currY - centerWorldStart.y, currX - centerWorldStart.x);
        const degDelta = (currAngle - dragState.startAngle) * 180 / Math.PI;
        onUpdateLayer(selectedLayerId, {
            rotation: startLayerState.rotation + degDelta
        });
    }
    else if (dragState.mode === 'resize' && dragState.pivotWorld && dragState.startDist) {
        // 1. Calculate current distance from pivot to mouse
        const currDist = Math.hypot(currX - dragState.pivotWorld.x, currY - dragState.pivotWorld.y);
        
        if (currDist < 1) return; // Avoid divide by zero
        
        // 2. New scale
        let newScale = startLayerState.scale * (currDist / dragState.startDist);
        newScale = Math.max(0.05, newScale);

        // 3. New Center Calculation
        // The new center is the midpoint between the Pivot (fixed) and the Mouse (approximate new corner)
        // Technically, if we want to maintain aspect ratio perfectly, we should project the mouse onto the diagonal vector.
        // But simply taking distance ratio usually works for centered-scaling UI feels if we update center.
        
        // Correct approach for center-based resize:
        // The Pivot stays fixed.
        // The dragged handle moves along the diagonal.
        // The Center moves to the midpoint of Pivot and New Handle Position.
        
        // Let's find the new "Handle" position in world space. 
        // Since we constrain aspect ratio, the handle must lie on the line defined by Pivot and angle.
        // But calculating strictly based on distance is easier and intuitive enough.
        
        // Find the unit vector from Pivot to StartHandle
        // Actually, we can just find the new Center by moving from Pivot half-way towards the new diagonal length?
        // Vector Pivot -> Center (New) = Vector Pivot -> Center (Old) * (NewScale / OldScale)
        
        const pivotToCenterX = centerWorldStart.x - dragState.pivotWorld.x;
        const pivotToCenterY = centerWorldStart.y - dragState.pivotWorld.y;
        
        const scaleRatio = newScale / startLayerState.scale;
        
        const newCenterX = dragState.pivotWorld.x + pivotToCenterX * scaleRatio;
        const newCenterY = dragState.pivotWorld.y + pivotToCenterY * scaleRatio;

        // 4. Convert New Center back to Top-Left (x,y)
        // x = CenterX - width/2
        // y = CenterY - height/2
        const newX = newCenterX - startLayerState.width / 2;
        const newY = newCenterY - startLayerState.height / 2;

        onUpdateLayer(selectedLayerId, {
            x: newX,
            y: newY,
            scale: newScale
        });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      setDragState(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const handleBackgroundClick = () => {
    if (!isDraggingRef.current) {
        onSelectLayer(null);
    }
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (selectedLayerId) {
        e.preventDefault();
        const layer = layers.find(l => l.id === selectedLayerId);
        if (layer) {
            const zoomSensitivity = 0.001;
            const newScale = Math.max(0.1, Math.min(5, layer.scale - e.deltaY * zoomSensitivity));
            onUpdateLayer(selectedLayerId, { scale: newScale });
        }
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f19] overflow-auto relative flex items-center justify-center p-8 custom-grid-bg h-full">
      <div 
        ref={canvasRef}
        className="relative shadow-2xl bg-slate-800 border border-slate-700 overflow-hidden transition-all duration-300 ease-out"
        style={{
          width: backgroundSrc ? bgSize.width : 800,
          height: backgroundSrc ? bgSize.height : 600,
          backgroundImage: !backgroundSrc ? 'radial-gradient(circle, #334155 1px, transparent 1px)' : 'none',
          backgroundSize: '20px 20px'
        }}
        onClick={handleBackgroundClick}
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {!backgroundSrc && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-500 text-lg font-medium">Waiting for background image...</p>
            </div>
        )}

        {backgroundSrc && (
          <img 
            src={backgroundSrc} 
            alt="Background" 
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none select-none"
            style={{ objectFit: 'contain' }} 
          />
        )}

        {layers.map((layer) => (
          layer.visible && (
            <div
                key={layer.id}
                className={`absolute select-none ${selectedLayerId === layer.id ? 'z-50' : 'z-10'}`}
                style={{
                    // Use translate to position the element's top-left corner at x,y
                    // Use transform-origin center to rotate/scale around the center
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                    transformOrigin: 'center center', 
                    willChange: 'transform, left, top',
                    cursor: dragState?.mode === 'move' ? 'grabbing' : 'grab'
                }}
                onPointerDown={(e) => handlePointerDown(e, layer.id, 'move')}
            >
                {/* Selection Ring & Image */}
                <div className={`relative w-full h-full ${selectedLayerId === layer.id ? 'ring-2 ring-indigo-500' : ''}`}>
                    <img 
                        src={layer.src} 
                        alt={layer.name} 
                        className="w-full h-full pointer-events-none block" 
                        draggable={false}
                    />
                    
                    {/* Controls (Only if selected) */}
                    {selectedLayerId === layer.id && (
                        <>
                            {/* Rotate Handle (Top Center Lollipop) - Scaled inverse to keep size consistent? No, just let it scale for now or it gets complex. */}
                            <div 
                                className="absolute left-1/2 -top-12 w-0.5 h-12 bg-indigo-500 -translate-x-1/2 flex flex-col items-center justify-start origin-bottom"
                            >
                                <div 
                                    className="w-6 h-6 bg-indigo-500 rounded-full cursor-alias shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                    onPointerDown={(e) => handlePointerDown(e, layer.id, 'rotate')}
                                >
                                    <RotateCw className="w-3.5 h-3.5 text-white" />
                                </div>
                            </div>

                            {/* Resize Handles */}
                            {/* Helper to create handle styles */}
                            {([
                                { pos: 'nw', cursor: 'nw-resize', style: { top: -6, left: -6 } },
                                { pos: 'ne', cursor: 'ne-resize', style: { top: -6, right: -6 } },
                                { pos: 'sw', cursor: 'sw-resize', style: { bottom: -6, left: -6 } },
                                { pos: 'se', cursor: 'se-resize', style: { bottom: -6, right: -6 } },
                            ] as const).map(({ pos, cursor, style }) => (
                                <div 
                                    key={pos}
                                    className={`absolute w-3 h-3 bg-white border-2 border-indigo-500 rounded-full hover:scale-125 transition-transform z-10`}
                                    style={{ ...style, cursor }}
                                    onPointerDown={(e) => handlePointerDown(e, layer.id, 'resize', pos as ResizeHandle)}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
          )
        ))}
      </div>
      
      {!backgroundSrc && layers.length === 0 && (
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 text-slate-400 text-sm pointer-events-none">
            Start by uploading a background image from the sidebar.
         </div>
      )}
    </div>
  );
};

export default Editor;