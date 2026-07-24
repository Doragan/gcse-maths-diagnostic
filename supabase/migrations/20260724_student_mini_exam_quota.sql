-- Monthly mini-exam allowance for students.
--
-- Free students get FREE_MINI_EXAMS_PER_MONTH self-serve mini-exams per calendar
-- month; paid students are unlimited. The counter is stored here and enforced
-- server-side in app/api/exam/quota (service role). It is safe to expose these
-- columns to client reads (the config screen shows "N left"), but they must
-- never be client-writable — UPDATE on students is already REVOKEd from
-- anon/authenticated (the SEC-CRIT-1 lockdown), and a table-level revoke covers
-- new columns too, so no extra grant work is needed here.
--
-- mini_exam_period is the 'YYYY-MM' bucket the count applies to (UK local month).
-- When a generation arrives in a new month the server treats the stored count as
-- zero and rewrites the period — so the reset needs no scheduled job.

alter table students add column if not exists mini_exam_period text;
alter table students add column if not exists mini_exams_used int not null default 0;
