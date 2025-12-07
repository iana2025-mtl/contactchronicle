# Fix GitHub Token Issue

## Problem
The push is failing with a 403 error, which means the token might not have the correct permissions.

## Solution: Verify Token Permissions

1. **Go to your token settings:**
   https://github.com/settings/tokens

2. **Find your token** (ContactChronicle-Local or similar)

3. **Check that it has the `repo` scope checked:**
   - `repo` - Full control of private repositories
   - This is required for push access

4. **If the scope is missing:**
   - Delete the old token
   - Create a new token with the `repo` scope checked
   - Copy the new token

5. **Try pushing again with the new token**

## Alternative: Use SSH Instead

If token issues persist, we can switch to SSH authentication:

1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add SSH key to GitHub:
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste and save

3. Change remote to SSH:
   ```bash
   git remote set-url origin git@github.com:iana2025-mtl/contactchronicle.git
   git push origin main
   ```

