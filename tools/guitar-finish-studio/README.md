# Guitar Finish Studio

A dependency-free browser tool for designing original guitar finishes. Images are processed locally in the browser and are never uploaded.

## Use it

Open `index.html` in a current browser, or run the repository's local preview command. Import a transparent PNG or WebP, use the Protect brush on hardware, adjust the paint layers, and export a transparent PNG.

The built-in samples are deliberately simple demonstrations. Users are responsible for having permission to modify and redistribute imported artwork.

## itch.io release

Run `npm run guitars:studio:package` on Windows. Upload `dist-itch/guitar-finish-studio.zip` as an HTML project. The archive contains `index.html` at its root and only uses relative paths.

Recommended itch.io settings:

- Kind: HTML
- Embed: Click to launch in fullscreen
- Mobile friendly: enabled
- Orientation: any

## Controls

- Preview: disables mask painting.
- Protect: removes areas from the paint mask.
- Paint: restores areas to the paint mask.
- Ctrl/Cmd+Z: undo the latest mask stroke.
- Recipes store colors, finishes, pattern, scale, intensity, and seed. They intentionally exclude source artwork and masks.

## Browser support

The studio uses Canvas 2D, `createImageBitmap`, pointer events, and `canvas.toBlob`. Current Chrome, Edge, Firefox, and Safari are recommended.
