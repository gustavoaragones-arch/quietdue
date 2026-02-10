# QuietDue

A privacy-first early pregnancy calculator.

## Purpose

QuietDue helps people in early or uncertain pregnancy get clarity without creating a data trail. The tool runs entirely in the browser. No accounts, no tracking, no data persistence.

## Privacy-First Philosophy

- No user data is collected or stored
- Everything runs locally in your browser
- Nothing is sent to any server
- Works offline once loaded

## Local Development

Open `index.html` in a browser. No build step or server required.

## GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quietdue.git
git push -u origin main
```

Commit static files only. Use the default branch `main`.

## Cloudflare Pages Deployment

1. Push the repo to GitHub (see above).
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project** → **Connect to Git**.
3. Select the `quietdue` repository.
4. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Output directory:** `/`
5. Deploy.

**Static hosting only.** No server logic. No environment variables. Cloudflare serves the files as-is.

## Contact Form Setup

The contact form uses [Formspree](https://formspree.io) to receive messages without a backend. To enable it:

1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form and copy your form ID
3. In `contact/index.html`, replace `YOUR_FORM_ID` in the form `action` with your form ID

Until configured, the form will not submit. Users can still email directly at `contact@quietdue.com`.

## License

© QuietDue
