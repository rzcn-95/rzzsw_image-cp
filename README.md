# ComfyUI Visual Compositor

A React-based standalone tool for visually layering, rotating, and scaling foreground images onto a background image. Designed to assist in creating compositions for ComfyUI workflows.

## Features
- **Visual Editor**: Drag, drop, scale, and rotate images directly on the canvas.
- **Layer Management**: Reorder, hide, or delete layers.
- **Real-time Preview**: Immediate feedback on your composition.
- **Export**: Downloads the final composition as a generic PNG.

## 🛠 Installation & Development

This project uses Vite + React.

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open your browser to the local URL provided (usually `http://localhost:5173`).

3. **Build for Production**
   ```bash
   npm run build
   ```
   This will generate a `dist/` folder with static HTML/JS/CSS files.

## 🚀 How to Publish to GitHub

Open your terminal in this project folder:

1. **Initialize Git**
   ```bash
   git init
   ```

2. **Add Files**
   ```bash
   git add .
   ```

3. **Commit Changes**
   ```bash
   git commit -m "Initial commit: ComfyUI Visual Compositor"
   ```

4. **Link to GitHub**
   *Go to GitHub.com, create a new repository, and copy the URL.*
   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```

## 🎨 How to Use with ComfyUI

Since this is a standalone visual editor, the workflow is **External Tool -> ComfyUI**:

1. **Run this tool** (locally via `npm run dev` or deploy it to Vercel/Netlify).
2. Upload your **Background** and **Foreground** images.
3. Adjust positions, rotation, and scale visually.
4. Click **Download Composite**.
5. Open **ComfyUI**.
6. Add a **Load Image** node.
7. Upload the composite image you just downloaded.
8. Connect it to your workflow (e.g., Image-to-Image, ControlNet, etc.).

### Why not a native node?
Native ComfyUI nodes are backend Python scripts. While you can embed web interfaces, React requires a build step. This tool is designed to give you maximum UI flexibility as a helper utility.
