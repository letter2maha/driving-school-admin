# User Deletion Functionality

This document describes the comprehensive user deletion system implemented in the admin dashboard, including both soft delete and hard delete options.

## 🗑️ Overview

The deletion system provides two types of user deletion:

1. **Soft Delete**: Marks users as deleted but preserves all data
2. **Hard Delete**: Permanently removes all user data from the database

## 🏗️ Database Schema Changes

### New Columns Added

The following columns have been added to all relevant tables:

```sql
-- Added to: profiles, verification_status, instructor_profiles, student_profiles
deleted_at TIMESTAMPTZ,        -- When the record was deleted
deleted_by UUID,               -- Who deleted the record (admin ID)
deletion_reason TEXT           -- Optional reason for deletion
```

### Database Functions

Three PostgreSQL functions have been created:

#### 1. `soft_delete_user(user_id, admin_id, reason)`
- Sets `deleted_at` timestamp on all related tables
- Records who deleted the user and why
- Creates a notification for the user
- **Data is preserved** and can be restored

#### 2. `hard_delete_user(user_id, admin_id, reason)`
- **Permanently deletes** all user data from:
  - `notifications`
  - `lessons`
  - `working_hours`
  - `date_overrides`
  - `verification_status`
  - `instructor_profiles` or `student_profiles`
  - `profiles`
- **Cannot be undone**

#### 3. `restore_soft_deleted_user(user_id, admin_id)`
- Restores a soft-deleted user by clearing deletion fields
- Creates a restoration notification

## 🎨 UI Components

### DeleteConfirmationModal

A comprehensive modal component that:
- Shows different warnings for soft vs hard delete
- Requires typing confirmation text (e.g., "HARD DELETE")
- Allows optional reason input
- Prevents accidental deletions

### Application Detail Page

Added delete buttons to the application detail page:
- **Soft Delete** (Orange button with ArchiveBox icon)
- **Hard Delete** (Red button with Trash icon)
- Always available regardless of application status

## 🔧 Implementation Details

### Admin Actions (`src/lib/admin-actions.ts`)

```typescript
// Soft delete with optional reason
export async function softDeleteUser(userId: string, adminId: string, reason?: string)

// Hard delete with optional reason  
export async function hardDeleteUser(userId: string, adminId: string, reason?: string)

// Restore soft-deleted user
export async function restoreSoftDeletedUser(userId: string, adminId: string)
```

### Query Filtering

All queries now filter out soft-deleted users:

```typescript
// Example: Applications page
const { data: verificationData } = await supabaseAdmin
  .from('verification_status')
  .select('*')
  .is('deleted_at', null)  // Exclude soft-deleted
  .order('created_at', { ascending: false })
```

### TypeScript Types

Updated interfaces to include deletion fields:

```typescript
export interface Profile {
  // ... existing fields
  deleted_at?: string | null
  deleted_by?: string | null
  deletion_reason?: string | null
}
```

## 🚀 Setup Instructions

### 1. Run Database Migration

Execute the SQL script to add deletion functionality:

```bash
# Run the SQL script in your Supabase SQL editor
psql -f scripts/delete-user-functions.sql
```

### 2. Test the Functions

Run the test script to verify everything works:

```bash
node scripts/test-delete-functions.js
```

### 3. Deploy the Application

The UI components and admin actions are already integrated into the application.

## 🎯 Usage Guide

### For Administrators

1. **Navigate to Application Detail Page**
   - Go to `/admin/applications`
   - Click on any user to view details

2. **Soft Delete a User**
   - Click the orange "Soft Delete" button
   - Type "SOFT DELETE" to confirm
   - Optionally add a reason
   - Click "Soft Delete User"

3. **Hard Delete a User**
   - Click the red "Hard Delete" button
   - Type "HARD DELETE" to confirm
   - Optionally add a reason
   - Click "Hard Delete User"

### What Happens After Deletion

#### Soft Delete:
- User disappears from applications list
- User disappears from dashboard
- All data is preserved in database
- User can be restored later
- User receives notification about deletion

#### Hard Delete:
- User is permanently removed from all tables
- User disappears from applications list
- User disappears from dashboard
- **Cannot be restored**
- All related data is permanently lost

## 🔒 Security Considerations

### Row Level Security (RLS)

Updated RLS policies to exclude soft-deleted users:

```sql
-- Example policy
CREATE POLICY "Admin can view all profiles" ON profiles 
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') 
  AND deleted_at IS NULL  -- Exclude soft-deleted
);
```

### Admin-Only Access

- Only authenticated admin users can perform deletions
- All deletion actions are logged with admin ID
- Service role key is used for database operations

## 📊 Monitoring & Logging

### Deletion Tracking

Every deletion is tracked with:
- **Who**: Admin user ID
- **When**: Timestamp
- **Why**: Optional reason
- **What**: User ID and deletion type

### Notifications

Users receive notifications for:
- Account soft deletion
- Account restoration
- Account hard deletion (if they still have access)

## 🧪 Testing

### Test Script Features

The test script (`scripts/test-delete-functions.js`) tests:

1. **Soft Delete**: Marks user as deleted
2. **Verification**: Confirms soft delete worked
3. **Restore**: Restores soft-deleted user
4. **Verification**: Confirms restore worked
5. **Hard Delete**: Permanently deletes user (with confirmation)
6. **Verification**: Confirms hard delete worked

### Manual Testing

1. Create a test user
2. Soft delete the user
3. Verify user disappears from lists
4. Restore the user
5. Verify user reappears
6. Hard delete the user
7. Verify user is permanently gone

## 🚨 Important Notes

### Soft Delete Benefits
- ✅ Data preservation
- ✅ Reversible action
- ✅ Audit trail maintained
- ✅ User can be restored

### Hard Delete Risks
- ⚠️ **Permanent data loss**
- ⚠️ **Cannot be undone**
- ⚠️ **Affects all related records**
- ⚠️ **Use with extreme caution**

### Best Practices
1. **Always try soft delete first**
2. **Only hard delete when absolutely necessary**
3. **Always provide a reason for deletion**
4. **Test deletion functions before production use**
5. **Keep backups of critical data**

## 🔄 Restore Process

To restore a soft-deleted user:

1. **Database Method**: Use the `restore_soft_deleted_user` function
2. **Admin UI**: Could be extended to show soft-deleted users with restore option
3. **Manual**: Update `deleted_at`, `deleted_by`, `deletion_reason` to NULL

## 📝 Future Enhancements

Potential improvements:
- [ ] Admin UI to view soft-deleted users
- [ ] Bulk delete operations
- [ ] Deletion scheduling (delete after X days)
- [ ] Export user data before hard delete
- [ ] Deletion audit log page
- [ ] Email notifications for deletions

## 🆘 Troubleshooting

### Common Issues

1. **"Function not found" error**
   - Ensure SQL script was run successfully
   - Check function permissions

2. **"RLS policy violation" error**
   - Ensure admin user has correct role
   - Check RLS policies are updated

3. **"User still appears after soft delete"**
   - Check queries include `.is('deleted_at', null)`
   - Verify soft delete actually set the timestamp

4. **"Hard delete failed"**
   - Check foreign key constraints
   - Ensure all related data can be deleted
   - Verify admin permissions

### Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify database functions exist and have correct permissions
3. Test with the provided test script
4. Check RLS policies are correctly configured
