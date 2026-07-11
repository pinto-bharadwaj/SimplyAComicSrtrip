# Simply Comical Portfolio & Dynamic CMS
A premium, highly polished digital showcase and illustration portfolio for **Preetham Bharadwaj** (`bharadwajpreetham@gmail.com`). 

This full-stack application includes customized galleries, slice-of-life comedy series comic builders, administrative logins, a dynamic verification system, live client lead inquiry capture forms, and moderation dashboards.

---

## 🚀 Deployment & Hosting Guide

Depending on your production requirements, you can host this application under two different styles:
1.  **Option A (Static Only - completely FREE)**: Deploy the compiled client directly to **GitHub Pages** or **Cloudflare Pages**.
2.  **Option B (Full-Stack - RECOMMENDED & FREE)**: Deploy the entire application (both frontend and backend Express serverless API) to **Vercel**. This is 100% free under the Hobby plan, avoids paid subscriptions, and preserves 100% of the live CMS, comments, and email inquiry forwarding.


---

## 🖥️ Option A: Deploying on GitHub Pages (Static Mode)

GitHub Pages acts as a super-stable static server. If hosted in static-only mode:
*   Your galleries, brand stories, categories, and reviews load as standard **read-only content** compiled from local databases.
*   CMS uploads, changes, and contact notifications are handled on your machine locally or require option B.

### Step-by-Step GitHub Pages Setup:

#### 1. Push to GitHub
1.  Initialize git if not already done:
    ```bash
    git init
    git add .
    git commit -m "feat: migrate and prepare for github pages"
    ```
2.  Create a blank repository on [GitHub](https://github.com) named `simply-comical-portfolio` (do not add any README or license).
3.  Link and push your local copy:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/simply-comical-portfolio.git
    git branch -M main
    git push -u origin main
    ```

#### 2. Auto-Deploy via GitHub Actions (Highly Recommended)
We have added an automated deployment recipe inside `.github/workflows/deploy.yml`. When you push updates to GitHub, the action compiles the React app and publishes it within 1 minute!
1.  On GitHub, navigate to your repository settings (**Settings** > **Pages**).
2.  Under **Build and deployment** > **Source**, change from **Deploy from a branch** to **GitHub Actions**.
3.  Go to the **Actions** tab of your repository to view the build pipeline. Your live link will look like: 
    `https://YOUR_USERNAME.github.io/simply-comical-portfolio/`

---

## ⚡ Option B: Unified Full-Stack Hosting on Vercel (100% FREE - RECOMMENDED)

You can host both the frontend and backend together on **Vercel** completely for free under the Hobby plan. Vercel automatically runs the React frontend and handles the Express backend (under `/api/*`) as free serverless functions.

### Step-by-Step Vercel Setup:
1.  Log in to [Vercel](https://vercel.com) using your GitHub account.
2.  Click **Add New** > **Project** and import your `SimplyAComicSrtrip` repository.
3.  Vercel will auto-detect the Vite framework. Keep the default settings.
4.  If using Sanity.io or Email features, add your environment variables in Vercel's **Environment Variables** tab:
    *   `SANITY_PROJECT_ID` (Your Sanity Project ID)
    *   `SANITY_API_TOKEN` (Your Sanity API Token)
    *   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (Optional, for email inquiries)
    *   `JWT_SECRET` (A custom random string to secure administrator tokens)
5.  Click **Deploy**. Vercel will host your entire portfolio and provide a free secure URL like `https://preetham-bharadwaj.vercel.app`.
6.  *(Optional)* Link your custom domain (`preethambharadwaj.com`) under project settings (**Settings** > **Domains**) for free.

Since both the frontend and backend are hosted on the same domain, you **do not need** to configure `VITE_API_URL`! The application will automatically route API requests relatively to `/api/*`.

---

## ⚡ Option C: Split Deployment (GitHub Pages Frontend + Vercel Backend)

If you prefer to keep your frontend hosted on **GitHub Pages** (free) and only host your Express backend on **Vercel** (free):
1.  Deploy the project to **Vercel** as described above to get your free backend API URL (e.g. `https://preetham-bharadwaj.vercel.app`).
2.  In your GitHub repository settings, navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Create a **Repository secret** named `VITE_API_URL` and set its value to your Vercel deployment URL (e.g., `https://preetham-bharadwaj.vercel.app`).
4.  Redeploy the static client! The React app on GitHub Pages will now dynamically route logins, edits, and contact forms to your free Vercel backend.


---

## 🌐 Linking a Custom Domain (GoDaddy Steps)

To point a custom domain like `preethambharadwaj.com` to your new host, follow these precise GoDaddy DNS layout directions:

### Step 1: Tell your Hosting Provider
*   **For GitHub Pages**: Go to **Settings** > **Pages** > **Custom Domain** box, type `preethambharadwaj.com` (or `www.preethambharadwaj.com`), and hit **Save**.
*   **For Cloudflare Pages**: Go to **Pages** > **Custom Domains** > **Set up a Custom Domain**, type your domain, and continue.

### Step 2: Configure Domain Registries inside GoDaddy
1.  Log into your **GoDaddy Control Center**, search for your domain `preethambharadwaj.com`, and click **DNS Manage** / **DNS Templates**.
2.  Look for any old placeholder **A Records** (e.g. `34.102.136.193` or GoDaddy's parking IP) and **DELETE** them to prevent domain hijacking or conflicting redirects.
3.  Add the target routing records in the records table:

#### For GitHub Pages Apex Routing:
Click **Add New Record** and complete the following A-records:

| Type | Name (Host) | Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `185.199.108.153` | `1 Hour` (or Default) |
| **A** | `@` | `185.199.109.153` | `1 Hour` |
| **A** | `@` | `185.199.110.153` | `1 Hour` |
| **A** | `@` | `185.199.111.153` | `1 Hour` |

#### For WWW CNAME Redirects:
Ensure your `www` subdomain connects smoothly to your GitHub username:

| Type | Name (Host) | Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `www` | `YOUR_USERNAME.github.io.` | `1 Hour` |

*(Note the trailing dot at the end of the CNAME target value! Some registrars require it, others add it automatically)*

4.  Wait 15–30 minutes for DNS servers to propagate the change internationally. You can check search propagation status at [dnschecker.org](https://dnschecker.org).

---

## 🛠️ Local Development & Operations

To test both client-side design layers and fullstack synchronizations on your workstation:

```bash
# 1. Install all dependencies
npm install

# 2. Boot dev environment (Runs Vite dev proxy and express port 3000)
npm run dev

# 3. Clean files and generate standard production package
npm run build
```
