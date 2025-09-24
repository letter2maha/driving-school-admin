# 🔐 RLS Policy Update Guide

This guide will help you update the Row Level Security (RLS) policies in your Supabase database to allow the admin dashboard to access the `profiles` table and display the correct user names.

## 📋 **Step-by-Step Instructions**

### **Step 1: Access Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `parriuibqsfakwlmbdac`

### **Step 2: Open SQL Editor**
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"** to create a new SQL script

### **Step 3: Run the RLS Policy Update Script**
1. Copy the contents of `scripts/update-rls-policies.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script

### **Step 4: Verify the Changes**
1. Go to **"Authentication"** → **"Policies"** in the left sidebar
2. Check that the following tables now have policies:
   - `profiles` (should have 4 policies: select, insert, update, delete)
   - `instructor_profiles` (should have 4 policies)
   - `verification_status` (should have 4 policies)

### **Step 5: Test the Connection**
1. Open your terminal in the project directory
2. Run the test script:
   ```bash
   node scripts/test-connection.js
   ```

### **Step 6: Refresh Your Dashboard**
1. Go to your admin dashboard at `http://localhost:3000/admin/dashboard`
2. Refresh the page
3. You should now see the correct names from the `profiles` table instead of the bio data

## 🎯 **Expected Results**

After updating the RLS policies, your dashboard should display:

### **Before (Current)**
- Names: "jdjkd", "jjdke", "jejd", "Jdjdj", "Instructor", "Experienced driving instructor"
- Phone: "N/A"
- Email: "N/A"

### **After (Expected)**
- Names: "test30", "Maha raja test", "Maha Raja", "Maha raja test", "Test04", "Test User Updated", "test 20"
- Phone: "+447630852741", "+447894561230", "+447145280369", etc.
- Email: Actual email addresses from the profiles table

## 🔧 **What the Script Does**

The RLS policy update script:

1. **Removes existing restrictive policies** that prevent access to the tables
2. **Creates new permissive policies** that allow:
   - `SELECT` (read) access for authenticated users
   - `INSERT` (create) access for authenticated users
   - `UPDATE` (modify) access for authenticated users
   - `DELETE` (remove) access for authenticated users

3. **Applies to all three tables**:
   - `profiles` (main user data)
   - `instructor_profiles` (instructor-specific data)
   - `verification_status` (approval tracking)

## 🚨 **Security Note**

The new policies allow access to authenticated users. Since your admin dashboard uses the anonymous key, you might need to:

1. **Option A**: Use the service role key for admin operations (more secure)
2. **Option B**: Create a specific admin user and authenticate with that user
3. **Option C**: Keep the current policies but add more specific conditions

## 🐛 **Troubleshooting**

### **If the test script fails:**
1. Check that the SQL script ran successfully
2. Verify the policies were created in the Supabase dashboard
3. Make sure you're using the correct project

### **If names still don't show correctly:**
1. Check the browser console for any errors
2. Verify that the profiles table has data
3. Ensure the join between profiles and instructor_profiles is working

### **If you get permission errors:**
1. The RLS policies might not have been applied correctly
2. Try running the SQL script again
3. Check that you have the correct permissions in Supabase

## 📞 **Need Help?**

If you encounter any issues:
1. Check the browser console for error messages
2. Run the test script to see which tables are accessible
3. Verify the RLS policies in the Supabase dashboard

The dashboard is designed to automatically fallback to the instructor_profiles table if the profiles table is not accessible, so it will continue to work even if there are issues with the RLS policies.
