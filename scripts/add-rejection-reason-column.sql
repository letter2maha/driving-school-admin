-- Add rejection reason column to verification_status table
-- This allows storing detailed rejection reasons when applications are rejected

ALTER TABLE verification_status 
ADD COLUMN profile_rejection_reason TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN verification_status.profile_rejection_reason IS 'Detailed reason for rejection when profile_approved is false';
