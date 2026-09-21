# ImageStitch

ImageStitch is a lightweight browser-based tool for combining multiple images into one vertical or horizontal composition. Everything runs locally in the browser: images are never uploaded to a server, and no account is required.

## Features

- Stitch images vertically or horizontally
- Reorder images before export
- Set a shared width or height
- Adjust image gaps and canvas padding
- Choose a background color or use transparency with PNG
- Export as PNG or JPEG with adjustable JPEG quality
- Merge the current composition and continue stitching
- Undo editing actions with the interface or `Ctrl+Z`
- Use the interface in Simplified Chinese, English, Japanese, or Russian
- Process all source images locally on the device

## Supported formats

ImageStitch accepts JPEG, PNG, and WebP files. Finished compositions can be exported as PNG or JPEG.

The app applies browser-friendly limits to large files and canvases:

- Maximum file size: 40 MB per image
- Maximum combined input size: 200 MB
- Maximum output edge: 16,000 pixels
- Maximum output area: 80 million pixels

Actual memory capacity still depends on the browser and device. Large compositions may require a desktop browser with sufficient available memory.

## Privacy

Reading, previewing, stitching, and exporting happen inside the current browser session. ImageStitch does not send source images to an application server or retain them after the page is refreshed or closed.

## Tech stack

- React 19
- TypeScript
- Vite
- Vitest
- HTML Canvas

## Local development

Requirements:

- Node.js 24.x recommended
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Vite will print the local development URL in the terminal.

## Validation

Run the automated tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The generated static site is written to `dist`.

## Deployment

ImageStitch is a static Vite application and can be deployed to Vercel, Cloudflare Pages, or another static hosting service.

Use the following build settings:

| Setting | Value |
| --- | --- |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Recommended Node.js version | `24.x` |

### SEO configuration

Set `SITE_URL` to the final public origin in the deployment environment:

```text
SITE_URL=https://example.com
```

When `SITE_URL` is available, the build adds the canonical URL and absolute social-sharing metadata, then generates `sitemap.xml` and a matching sitemap entry in `robots.txt`.

If the variable is omitted, the build deliberately skips canonical and sitemap generation instead of publishing a placeholder domain.

### Vercel

Import the repository into Vercel, select the Vite framework preset, apply the settings above, and add `SITE_URL` to the Production environment variables. No serverless functions, database, or storage service are required.

### Cloudflare Pages

Connect the repository to Cloudflare Pages, use `npm run build` as the build command, and set `dist` as the output directory. Add the same `SITE_URL` environment variable for production builds.

## Project structure

```text
src/
├── app/          Application shell and editor workflow
├── components/   Upload, settings, image list, and preview UI
├── config/       Browser and canvas safety limits
├── editor/       Editor state, history, and errors
├── engine/       Layout, rendering, and export logic
├── i18n/         Locale provider and translations
├── images/       Image decoding and in-memory resources
└── styles/       Global responsive styles

public/           Static metadata and brand assets
scripts/          Build-time SEO generation
```
