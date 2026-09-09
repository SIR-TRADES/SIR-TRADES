# KIU Connect deployment

## GitHub Pages

GitHub Pages hosts static files only. It cannot run the Netlify Function directly. For shared registrations on GitHub Pages:

1. Create a Google Sheet named `Registrations`.
2. Open **Extensions -> Apps Script** and paste the code from `google-apps-script/Code.gs`.
3. Deploy it as a web app with **Execute as: Me** and **Who has access: Anyone**.
4. Copy the web-app URL into `api-config.js` as `window.KIU_API_URL = 'YOUR_WEB_APP_URL';`.
5. Push the whole project to GitHub and enable GitHub Pages from the repository settings.

The GitHub Pages address will then use the Google Sheet as the shared registration store for phone users and the admin panel.

The registration and admin panel share data through the Netlify Function at:

`/.netlify/functions/registrations`

## Deploy with Netlify

1. Put this whole folder in a GitHub repository.
2. In Netlify, choose **Add new site** -> **Import an existing project**.
3. Select the repository and deploy it with these settings:
   - Build command: leave empty
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
4. Redeploy after every change.

## Check the shared server

Open this URL in a browser, replacing the domain:

`https://YOUR-SITE.netlify.app/.netlify/functions/registrations`

A working deployment returns JSON containing `"ok":true` and `"registrations":[]`.

If the URL returns a 404, the `netlify` folder was not deployed. If it returns a 500, check the Netlify deploy log and confirm the dependency in `package.json` installed successfully.

Do not use a file upload containing only `index.html`; that publishes the page but does not reliably deploy the function needed for cross-device registration data.