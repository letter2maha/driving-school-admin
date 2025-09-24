# Quick Fix for Profile Names Issue

## Problem
The dashboard is showing generic names instead of actual profile names because:
1. The `profiles` table has RLS policies that block anonymous access
2. The dashboard falls back to `instructor_profiles` table which only has bio data

## Solution
Update RLS policies in Supabase dashboard to allow read access to the `profiles` table.

## Steps to Fix

### 1. Go to Supabase Dashboard
- Open your Supabase project dashboard
- Navigate to **Authentication** → **Policies**

### 2. Update Profiles Table Policies
- Find the `profiles` table
- Click on **RLS policies**
- Add or update the following policy:

**Policy Name:** `profiles_select_policy`
**Operation:** `SELECT`
**Target roles:** `anon, authenticated`
**Policy definition:** `true`

### 3. Alternative: Disable RLS Temporarily
If you want to quickly test, you can temporarily disable RLS:
- Go to **Table Editor** → **profiles** table
- Click on **Settings** (gear icon)
- Toggle off **Enable Row Level Security**

### 4. Test the Fix
After updating the policies:
1. Refresh your dashboard
2. You should now see actual profile names like "test30", "Maha raja test", etc.
3. The dashboard should show proper statistics

## Expected Result
- Dashboard shows: "Total Applications: 8"
- Profile names: "test30", "Maha raja test", "Maha Raja", etc.
- All sections should show proper counts instead of 0

## If Still Not Working
1. Check browser console for any errors
2. Verify the RLS policy was applied correctly
3. Try a hard refresh (Ctrl+F5)
4. Check if the profiles table is accessible via API

## Long-term Solution
Consider implementing proper authentication and role-based access control instead of allowing anonymous access to all data.
