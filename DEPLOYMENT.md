# Deploying Rubber PWA to Vercel

Since your project uses **Next.js** and **MySQL**, Vercel is a great hosting choice. However, because Vercel is a cloud platform, **it cannot access your local XAMPP database**.

You must move your database to the cloud first.

## Step 1: Get a Cloud MySQL Database (Free)
You need a MySQL database accessible from the internet. The best free/cheap options compatible with your current code are:
1.  **TiDB Cloud** (Serverless MySQL, generous free tier).
2.  **PlanetScale** (Excellent, but requires minor URL config changes).
3.  **Aiven for MySQL** (Free tier available).
4.  **Railway.app** (Offers MySQL, heavily used with Vercel).

**Recommendation:** Sign up for **TiDB Cloud** or **Railway** and create a MySQL database.
*   Copy the connection details: `Host`, `User`, `Password`, `Database Name`.
*   Note: PlanetScale requires SSL paths which might need extra config, standard MySQL (TiDB/Railway) is easier for your current `mysql2` setup.

## Step 2: Push Your Code to GitHub
1.  Initialize Git if you haven't:
    ```bash
    git init
    git add .
    git commit -m "Ready for deployment"
    ```
2.  Create a new repository on **GitHub**.
3.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
    git branch -M main
    git push -u origin main
    ```

## Step 3: Deploy on Vercel
1.  Go to [Vercel.com](https://vercel.com) and sign up with GitHub.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `Rubber_Web_App` repository.
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (Default).
    *   **Root Directory**: `src` (or leave default if `package.json` is in root. Your logs show it is in root `c:/xampp/.../Rubber_Web_App`, so leave this empty/default).
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add the following (using your **Cloud Database** details, NOT localhost):
        *   `MYSQL_HOST`: (e.g., `gateway01...tidbcloud.com`)
        *   `MYSQL_USER`: (e.g., `2.root`)
        *   `MYSQL_PASSWORD`: (your cloud db password)
        *   `MYSQL_DATABASE`: (e.g., `rubber_db`)
6.  Click **Deploy**.

## Step 4: Finalize
*   Vercel will build your app.
*   Once done, it will give you a URL (e.g., `rubber-pwa.vercel.app`).
*   Open that URL on your phone.
*   **Important**: The first time you sync, the code inside `/api/sync/route.ts` will automatically create the tables in your new cloud database!

---

### ⚠️ Important Note About XAMPP
Your `localhost` XAMPP database only exists on your computer. Vercel **cannot** connect to it.
*   If you deploy to Vercel without changing the database host to a cloud provider, the App will load, but **Sync will fail**.
*   The "Offline" mode will still work fine, but data won't save to the server until you fix the database connection.
