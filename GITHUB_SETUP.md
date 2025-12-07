# GitHub Authentication Setup Guide

## Step-by-Step: Set Up GitHub Push Access

### Step 1: Create a Personal Access Token (PAT)

1. **Go to GitHub Settings:**
   - Open your browser
   - Go to: https://github.com/settings/tokens
   - Or navigate: GitHub Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Give it a name: `ContactChronicle-Local`
   - Set expiration (recommend 90 days or longer)
   - Select scopes: Check **`repo`** (this gives full repository access)
   - Scroll down and click **"Generate token"**

3. **Copy the Token:**
   - **IMPORTANT:** Copy the token immediately (it starts with `ghp_`)
   - You won't be able to see it again!
   - Save it somewhere safe temporarily

### Step 2: Update Git Credentials

We'll update your git remote to use the token for authentication.

**After you have your token, run this command (replace YOUR_TOKEN with your actual token):**

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/iana2025-mtl/contactchronicle.git
```

**Or better yet, we'll configure git credential helper to store it securely!**

