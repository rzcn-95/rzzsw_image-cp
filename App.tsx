import React, { useState, useRef } from 'react';
import Controls from './components/Controls';
import Editor from './components/Editor';
import { Layer, EditorState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<EditorState>({
    backgroundSrc: null,
    backgroundFile: null,
    layers: [],
    selectedLayerId: null,
    canvasScale: 1,
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setState(prev => ({
        ...prev,
        backgroundSrc: url,
        backgroundFile: file
      }));
    }
  };

  const handleUploadForeground = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newLayers: Layer[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            setState(prev => ({
                ...prev,
                layers: [
                    ...prev.layers,
                    {
                        id: Math.random().toString(36).substring(2, 9),
                        src: url,
                        file: file,
                        name: file.name,
                        x: 50, // Default offset
                        y: 50,
                        scale: 1,
                        rotation: 0,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        visible: true
                    }
                ]
            }));
        };
        img.src = url;
      });
    }
  };

  const handleSelectLayer = (id: string | null) => {
    setState(prev => ({ ...prev, selectedLayerId: id }));
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  };

  const handleDeleteLayer = (id: string) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== id),
      selectedLayerId: prev.selectedLayerId === id ? null : prev.selectedLayerId
    }));
  };

  const handleToggleVisibility = (id: string) => {
    setState(prev => ({
        ...prev,
        layers: prev.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    }));
  };

  const handleDownload = () => {
    if (!canvasRef.current || !state.backgroundSrc) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 1. Setup Canvas Size
    const width = canvasRef.current.offsetWidth;
    const height = canvasRef.current.offsetHeight;
    
    canvas.width = width;
    canvas.height = height;

    if (!ctx) return;

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    // 2. Draw Background
    loadImage(state.backgroundSrc).then(async (bg) => {
        ctx.drawImage(bg, 0, 0, width, height);

        // 3. Draw Layers
        for (const layer of state.layers) {
            if (!layer.visible) continue;
            try {
                const img = await loadImage(layer.src);
                
                ctx.save();
                
                // Transform Logic matching Editor.tsx (Transform Origin: Center)
                // 1. Translate to Center Point of the layer
                const cx = layer.x + layer.width / 2;
                const cy = layer.y + layer.height / 2;
                ctx.translate(cx, cy);
                
                // 2. Rotate
                ctx.rotate((layer.rotation * Math.PI) / 180);
                
                // 3. Scale
                ctx.scale(layer.scale, layer.scale);
                
                // 4. Draw Image Centered at Origin (so 0,0 is center)
                ctx.drawImage(
                    img, 
                    -layer.width / 2, 
                    -layer.height / 2, 
                    layer.width, 
                    layer.height
                );
                
                ctx.restore();
            } catch (err) {
                console.error("Failed to draw layer", layer.name, err);
            }
        }

        // 4. Trigger Download
        const link = document.createElement('a');
        link.download = 'comfyui-composite.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">
      <Controls
        backgroundSrc={state.backgroundSrc}
        layers={state.layers}
        selectedLayerId={state.selectedLayerId}
        onUploadBackground={handleUploadBackground}
        onUploadForeground={handleUploadForeground}
        onSelectLayer={handleSelectLayer}
        onDeleteLayer={handleDeleteLayer}
        onToggleVisibility={handleToggleVisibility}
        onUpdateLayer={handleUpdateLayer}
        onDownload={handleDownload}
      />
      <Editor
        backgroundSrc={state.backgroundSrc}
        layers={state.layers}
        selectedLayerId={state.selectedLayerId}
        onUpdateLayer={handleUpdateLayer}
        onSelectLayer={handleSelectLayer}
        canvasRef={canvasRef}
      />
    </div>
  );
};

export default App;