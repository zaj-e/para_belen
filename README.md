# El sueño de Belén — editable source

This is the complete standalone source and artwork of the playable pixel-cat birthday game. The application files are unchanged from the deployed snapshot at commit `6f77d0e3ac549b55633c7c9dc7d0da43517ddb4c`. This export adds documentation and collaboration instructions only; it does not update the hosted site.

## Files to edit

| File | Purpose |
| --- | --- |
| `dist/app.js` | Cat phrases, sprite animation, sound, interactions, letter editor and link encoding |
| `dist/physics.js` | Movement, gravity, jump strength, furniture collision surfaces and letter proximity |
| `dist/style.css` | Layout, colors, typography, speech bubbles and full-screen letter appearance |
| `dist/index.html` | Page text, controls, editor fields and document metadata |
| `dist/room.png` | Original generated pixel-art room background |
| `dist/belen-sprites.png` | Original generated 4-column × 3-row cat animation sheet, with transparency |
| `vite.config.js` | Optional local development server configuration |

Despite its name, `dist/` contains the actual editable source, not compiled or minified build output. There is no separate build step.

## Change what Belén says

Open `dist/app.js` and search for `const thoughts=` (line 7 in this snapshot). Edit, add or remove strings in that array. Keep at least one phrase. You can reformat that declaration like this:

```js
const thoughts = [
  'prrr…',
  '¿Estoy… soñando?',
  'Tengo patitas… ♡',
  'Qué calientito está aquí.',
  'Ese brillo… ¿es para mí?',
  'Podría quedarme un ratito más…',
];
let thoughtIndex = 0;
```

These lines cycle in order. The next recurring phrase appears after 10–16 seconds, and a speech bubble normally lasts 3.8 seconds. Adjust `nextSpeech=elapsed+10+Math.random()*6` and `function say(text,duration=3.8)` to change those timings.

Other lines are tied to events. Search for `say(` to find the opening thought, approaching the letter, returning from the letter, and the fullscreen fallback message. The initial speech text also appears in `dist/index.html`.

Use short phrases so the bubble fits on small screens. Keep quotes balanced; use double quotes if your phrase contains an apostrophe, or escape it.

## Run locally

Option A — Python 3, no package installation:

```sh
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000` in your browser. Refresh after editing files. On Windows, `py -m http.server 8000 --directory dist` is an alternative if the Python launcher is installed. This server is for local preview, not production hosting.

Option B — Vite, with automatic reload:

Use Node.js 22.12 or newer (the locked Vite version also accepts Node.js 20.19+ on the 20.x line).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To check JavaScript syntax:

```sh
npm run check
```

Serve through HTTP rather than double-clicking `index.html`: browser ES modules do not reliably load from `file://`.

## Host it yourself

The production application is static. Upload **the contents of `dist/`** to your web server's public directory, or set your static host's publish directory to `dist`. Set the host's build step to none/skip if it asks. No Node process, database, API key, or ChatGPT connection is needed in production.

The six files to publish are:

- `index.html`
- `app.js`
- `physics.js`
- `style.css`
- `room.png`
- `belen-sprites.png`

Keep them together, and serve JavaScript with an appropriate JavaScript MIME type. All application and image references are relative, so a subdirectory deployment is supported. Use HTTPS for production, including reliable clipboard support. The app has a manual-copy fallback if clipboard access is unavailable.

The only external asset dependency is Google Fonts, imported at the start of `style.css`. System fonts are configured as fallbacks. For a fully offline/self-contained version, remove the font import or self-host those fonts in accordance with their licenses.

The original ChatGPT-hosted site's private-access setting is not included in this export. Your own host determines who can visit the game. No hosting credentials, `.git` history, `.openai` project identifiers, installed packages, or sample personal letter are included.

## Write and preserve your letter

1. Open the game on your chosen host.
2. Click the pencil / “Tu carta”.
3. Enter the greeting, message and signature.
4. Save, then reopen the editor and copy the recipient link.
5. Keep the full generated link: it contains the letter after `#c=`.

The letter is encoded in the URL fragment, not saved to a database. Encoding is not encryption: someone with the full link can read it. The fragment is not sent as part of the HTTP request to the server. The editor URL includes `?edit=1`; the copied recipient URL omits that parameter and hides writing controls. This is presentation behavior, not authentication or tamper protection.

Writing a new letter changes that browser's URL; it does not overwrite other generated letter links. Opening only the base site URL does not recover a previous letter. If you move to another host, generate the link there, or preserve its entire fragment when changing the origin/path.

## Keep versions you like

After extracting, create your own Git repository:

```sh
git init
git add .
git commit -m "Preserve the original playable dream"
git tag birthday-baseline
git switch -c experiment/cat-phrases
```

Preview changes locally before deploying. Use `git diff` to review changes. Keep the baseline tag so you can always inspect the original version. Push to your own remote repository if you want an additional backup.

## Working with an assistant

Suggestions and questions are discussion only. Ask explicitly to implement a change when you want files modified. Ask explicitly to deploy when you want hosting updated. The included `AGENTS.md` records this preference for compatible coding assistants.

## Controls

- Arrow keys / A and D: walk.
- Space / up arrow / W: jump.
- E, or the nearby “Leer la carta” button: read when standing near the letter on the table.
- Touch controls are shown on devices with a coarse pointer.

The route is floor → footstool → table. The sofa is also jumpable. There are separate idle, walking, airborne and landing poses.
