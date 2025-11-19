import React from 'react';
import { Upload, Image as ImageIcon, Layers, Trash2, Eye, EyeOff, ZoomIn, ZoomOut, Move, Download, RotateCw } from 'lucide-react';
import { Layer } from '../types';

interface ControlsProps {
  backgroundSrc: string | null;
  layers: Layer[];
  selectedLayerId: string | null;
  onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadForeground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onDownload: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  backgroundSrc,
  layers,
  selectedLayerId,
  onUploadBackground,
  onUploadForeground,
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility,
  onUpdateLayer,
  onDownload,
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div className="w-80 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden shadow-xl z-10">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950">
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          ComfyUI Node
        </h1>
        <p className="text-xs text-slate-500 mt-1">Image Composite & Overlay</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Background Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> Background
          </h2>
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              onChange={onUploadBackground}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${backgroundSrc ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}>
              {backgroundSrc ? (
                <div className="flex items-center justify-center gap-2 text-indigo-300">
                  <span className="text-sm font-medium">Change Background</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Upload Base Image</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Foreground Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Layers className="w-3 h-3" /> Foregrounds
          </h2>
          
          {/* Upload Button */}
          <div className="relative mb-4">
             <input
              type="file"
              accept="image/*"
              multiple
              onChange={onUploadForeground}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Add Overlay Images
            </button>
          </div>

          {/* Layer List */}
          <div className="space-y-2">
            {layers.length === 0 && (
              <div className="text-center py-4 text-slate-600 text-xs italic">
                No foreground layers added.
              </div>
            )}
            {layers.slice().reverse().map((layer) => (
              <div
                key={layer.id}
                className={`group flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-all ${
                  selectedLayerId === layer.id
                    ? 'bg-indigo-900/30 border-indigo-500/50 ring-1 ring-indigo-500/20'
                    : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => onSelectLayer(layer.id)}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded bg-slate-950 border border-slate-700 overflow-hidden flex-shrink-0">
                    <img src={layer.src} alt="thumbnail" className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{layer.name}</div>
                    <div className="text-xs text-slate-500 flex gap-2">
                        <span>{layer.scale.toFixed(2)}x</span>
                        <span>{Math.round(layer.rotation)}°</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(layer.id);
                        }}
                        className={`p-1.5 rounded hover:bg-slate-700 ${layer.visible ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                        {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLayer(layer.id);
                        }}
                        className="p-1.5 rounded hover:bg-red-900/30 text-slate-500 hover:text-red-400"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Selected Layer Properties */}
        {selectedLayer && (
          <section className="pt-4 border-t border-slate-800">
             <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                <Move className="w-3 h-3" /> Active Layer Props
            </h2>
            <div className="space-y-4">
                {/* Scale */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs text-slate-400">Scale</label>
                        <span className="text-xs text-slate-300">{selectedLayer.scale.toFixed(2)}x</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ZoomOut className="w-3 h-3 text-slate-500" />
                        <input
                            type="range"
                            min="0.1"
                            max="3.0"
                            step="0.01"
                            value={selectedLayer.scale}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { scale: parseFloat(e.target.value) })}
                            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <ZoomIn className="w-3 h-3 text-slate-500" />
                    </div>
                </div>

                {/* Rotation */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs text-slate-400">Rotation</label>
                        <span className="text-xs text-slate-300">{Math.round(selectedLayer.rotation)}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <RotateCw className="w-3 h-3 text-slate-500" />
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            step="1"
                            value={selectedLayer.rotation}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })}
                            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>
                
                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Pos X</label>
                        <input
                            type="number"
                            value={Math.round(selectedLayer.x)}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { x: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Pos Y</label>
                        <input
                            type="number"
                            value={Math.round(selectedLayer.y)}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { y: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onDownload}
            disabled={!backgroundSrc}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-2.5 rounded-md font-semibold text-sm transition-all shadow-lg shadow-indigo-900/20"
          >
              <Download className="w-4 h-4" />
              Download Composite
          </button>
      </div>
    </div>
  );
};

export default Controls;