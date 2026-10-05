# MEMORIES — Personal Visual Archive

A static, cinematic personal memories gallery for GitHub Pages, designed around Google Drive as the original media store.

## What is included

- Cinematic home page and scroll experience
- Demo mode with local SVG artwork
- Google Drive OAuth path
- Drive folder scanning, including nested folders
- Photos, videos and audio discovery
- Automatic first-pass memory grouping by timeline
- Custom memory/category model
- Search
- Timeline
- Full-screen memory story modal
- Responsive gallery and masonry archive
- Browser-side UI persistence
- Google Drive `appDataFolder` metadata persistence when OAuth is configured

## Important architecture

GitHub Pages is static. This project therefore does not use a server or database.

- Google Drive stores originals.
- GitHub Pages serves HTML/CSS/JS.
- The browser performs Drive API calls after the user authorizes Google.
- Application metadata is saved in Drive's private `appDataFolder`.

## Google Cloud setup

1. Open Google Cloud Console.
2. Create a project.
3. Enable **Google Drive API**.
4. Configure the OAuth consent screen.
5. Create an **OAuth 2.0 Client ID** for a Web application.
6. Add your development URL, e.g. `http://localhost:5500`.
7. Add your GitHub Pages origin, e.g. `https://YOUR-USERNAME.github.io`.
8. Later add your custom domain origin, e.g. `https://yourdomain.com`.
9. Copy the Web client ID into `js/config.js`:

```js
export const CONFIG = {
  googleClientId: "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com",
  ...
};
```

Do not add a client secret to this repository.

## Run locally

Because browser OAuth is origin-sensitive, use a local static server instead of opening `index.html` directly.

Python example:

```bash
python -m http.server 5500
```

Then open:

`http://localhost:5500`

## Deploy to GitHub Pages

Push the repository to GitHub and enable Pages from the repository settings.

The site is already designed to work as a project site and later with a custom domain.

## Current product boundary

The first version intentionally avoids a paid backend and paid AI APIs. Advanced AI features can be added later as browser-side modules if they can be implemented without compromising privacy or requiring paid infrastructure.
