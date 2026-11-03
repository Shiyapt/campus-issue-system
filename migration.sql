-- Run ONCE on an existing campus_issues database (MySQL 8). Skip if you start from an empty database.
ALTER TABLE issues ADD COLUMN assigned_management VARCHAR(100) NULL;
ALTER TABLE issue_updates ADD COLUMN visibility VARCHAR(10) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE issue_updates MODIFY note VARCHAR(1000);

-- Admin no longer verifies/forwards: old pre-management statuses become "received by management"
UPDATE issues SET status='SENT_TO_MANAGEMENT' WHERE status IN ('AI_VERIFIED','AI_FLAGGED','VERIFIED');
UPDATE issues SET status='STAFF_ASSIGNED' WHERE status='STAFF_REQUESTED';

-- AI bot rows were reporter-visible before; they are internal now
UPDATE issue_updates SET visibility='INTERNAL' WHERE by_name='AI Bot';
