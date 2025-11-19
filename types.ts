export interface Layer {
  id: string;
  src: string;
  file: File;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface EditorState {
  backgroundSrc: string | null;
  backgroundFile: File | null;
  layers: Layer[];
  selectedLayerId: string | null;
  canvasScale: number; // For zooming the entire workspace view
}