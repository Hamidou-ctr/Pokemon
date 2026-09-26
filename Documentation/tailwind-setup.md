# Adding Tailwind CSS to This Project

This project is currently a plain HTML/CSS/JS site (`index.html`, `style.css`,
`script.js`) without build tools and without a `package.json`. There are two ways to add
Tailwind: a quick one (CDN, no installation) and a clean one (CLI build,
recommended). Both are described below.

---

## Option A — Quick start via CDN (no Node.js needed)

Ideal for trying things out, **not** meant for the finished/production site (Tailwind
itself warns against using the CDN script in production — it is slower and loads
the entire framework in the browser).

1. Open `index.html`.
2. In the `<head>`, **before** your own `<link rel="stylesheet" href="style.css">`,
   add the following line:

   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   ```

3. Done. From now on you can use Tailwind classes on any HTML element, e.g.:

   ```html
   <button class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
     More Pokémon
   </button>
   ```

   Your existing `style.css` stays active as well — both systems can
   coexist as long as class names don't conflict.

**Drawbacks:** no tree-shaking (the whole library is generated in the browser),
no clean way to manage your own Tailwind configuration (colors, fonts),
not recommended for the live version on GitHub Pages.

---

## Option B — Proper installation with the Tailwind CLI (recommended)

This gives you a single, small, optimized CSS file that you include via `<link>` just like
your `style.css`. Node.js is already installed on this machine
(`node -v` → v24), so you don't need to install anything extra.

### 1. Initialize the project as an npm project

In the terminal, in the project folder `Pokemon/`:

```bash
npm init -y
```

This creates a `package.json` (which manages the project's dependencies).

### 2. Install Tailwind

```bash
npm install tailwindcss @tailwindcss/cli
```

### 3. Create the input CSS file

Tailwind needs its own "source file" from which it builds the final CSS file.
Create `src/input.css` with the following content:

```css
@import "tailwindcss";
```

> Tip: You can either convert your existing code from `style.css` entirely into
> Tailwind classes in the HTML, or you can additionally import your old `style.css`
> into `src/input.css`:
> ```css
> @import "tailwindcss";
> @import "../style.css";
> ```
> That way you lose nothing of your previous design and can gradually switch to
> Tailwind classes.

### 4. Set up build scripts in `package.json`

Open the generated `package.json` and add the following in the `"scripts"` section:

```json
"scripts": {
  "build:css": "tailwindcss -i ./src/input.css -o ./style.css --minify",
  "watch:css": "tailwindcss -i ./src/input.css -o ./style.css --watch"
}
```

* `build:css` generates the finished, minified `style.css` once.
* `watch:css` watches your files and rebuilds automatically while you
  develop.

### 5. Run Tailwind during development

```bash
npm run watch:css
```

Keep the terminal open while you work on `index.html` / `script.js`.
Every saved change is automatically picked up in `style.css`.

### 6. Use Tailwind classes in the HTML

`style.css` stays included via the existing link as usual — you don't
have to change anything there:

```html
<link rel="stylesheet" href="style.css">
```

Now simply use Tailwind classes in `index.html`, e.g.:

```html
<header class="flex items-center justify-between gap-4 bg-gray-900 p-4">
  <img class="pokedex-logo h-12 w-12" src="images/pokemon.webp" alt="Pokémon">
  <input
    class="icon-search rounded-full border border-gray-300 px-4 py-2"
    type="search" placeholder="Search" aria-label="Search Pokémon" id="search"
    oninput="startSearch()">
</header>
```

### 7. Before publishing (production build)

Before you push with `up.sh` (your existing deploy script), generate the
production build once:

```bash
npm run build:css
```

Since this project has **no** CI/build system (the site is presumably served directly as a
static file via GitHub Pages), the built `style.css` has to be
committed and pushed as well — do not add it to `.gitignore`.

### 8. Extend `.gitignore`

The `node_modules` folder should **not** go into the Git repo:

```
node_modules/
```

Create a `.gitignore` file in the project root (if it doesn't exist yet)
and add the line.

---

## Quick overview: Which option to choose?

| | Option A (CDN) | Option B (CLI) |
|---|---|---|
| Setup effort | 1 line of HTML | npm project + build script |
| Suited for | Quick experiments | Finished/production site |
| Performance | Worse (full framework in the browser) | Good (only used classes in the CSS) |
| Custom configuration (colors, fonts) | Limited | Fully possible |
| Recommendation for this project | For testing | ✅ For the final version |

---

## Useful links

* Official docs: https://tailwindcss.com/docs/installation
* Class reference ("Utility Classes"): https://tailwindcss.com/docs/styling-with-utility-classes
