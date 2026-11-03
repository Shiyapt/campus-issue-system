# Campus Issue System (v2 - agreed workflow)

| Role | What they can do |
|---|---|
| Student / College staff | Report an issue, track ONLY their own issues by tracking ID (public updates only). No dashboard. |
| Admin | Read-only, college-wide dashboard: all issues, status, reporter, responsible management, reports, full history. |
| Management | Receives issues directly. Reviews, approves/rejects, records assigned staff and their work, adds public/internal remarks, resolves. |

Issue lifecycle (enforced in ManagementController):
SENT_TO_MANAGEMENT -> UNDER_REVIEW -> APPROVED / REJECTED / ON_HOLD -> STAFF_ASSIGNED -> IN_PROGRESS -> STAFF_COMPLETED -> UNDER_VERIFICATION -> RESOLVED
(ON_HOLD can resume; UNDER_VERIFICATION can reopen work.)

## Setup
1. MySQL 8 running; edit credentials in backend/src/main/resources/application.properties.
2. EXISTING database: run migration.sql once. NEW database: nothing to do (schema.sql runs on start).
3. Backend: cd backend && mvn spring-boot:run   (port 8080)
4. Frontend: cd frontend && npm install && npm run dev   (port 5173)

Demo logins: student 1AB21CS001 / Demo Student / 2003-05-10 / QR-STU-001, staff EMP001 / Demo Faculty / QR-EMP-001,
admin / admin123, management mgmt1 / mgmt123
