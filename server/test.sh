#!/usr/bin/env bash
# =============================================================================
# SmartClass Backend – Shell-script API tests
# =============================================================================
# Usage:
#   1.  Start the server:   npm start  (or  npm run dev)
#   2.  Seed test users:    node tests/seed.js
#   3.  Run this script:    bash test.sh
#
# Or run everything in one go:
#   node tests/seed.js && bash test.sh
#
# Requires: curl, jq
# =============================================================================

BASE_URL="${BASE_URL:-http://localhost:5000}"
PASS=0
FAIL=0
COOKIE_JAR=$(mktemp)
TEACHER_COOKIE_JAR=$(mktemp)

# ── helpers ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

section() { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
pass()    { echo -e "  ${GREEN}✔${RESET}  $1"; PASS=$((PASS + 1)); }
fail()    { echo -e "  ${RED}✘${RESET}  $1"; FAIL=$((FAIL + 1)); }

# assert_status <expected> <actual> <label>
assert_status() {
  local expected=$1 actual=$2 label=$3
  if [ "$actual" -eq "$expected" ]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label — expected HTTP $expected, got HTTP $actual"
  fi
}

# curl wrappers — return HTTP status codes
get()    { curl -s -o /tmp/sc_body -w "%{http_code}" -b "$COOKIE_JAR"         "$BASE_URL$1"; }
post()   { curl -s -o /tmp/sc_body -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR"  \
             -X POST -H 'Content-Type: application/json' -d "$2" "$BASE_URL$1"; }
tpost()  { curl -s -o /tmp/sc_body -w "%{http_code}" -b "$TEACHER_COOKIE_JAR" -c "$TEACHER_COOKIE_JAR" \
             -X POST -H 'Content-Type: application/json' -d "$2" "$BASE_URL$1"; }
patch()  { curl -s -o /tmp/sc_body -w "%{http_code}" -b "$TEACHER_COOKIE_JAR" \
             -X PATCH -H 'Content-Type: application/json' -d "$2" "$BASE_URL$1"; }
del()    { curl -s -o /tmp/sc_body -w "%{http_code}" -b "$TEACHER_COOKIE_JAR" \
             -X DELETE -H 'Content-Type: application/json' -d "$2" "$BASE_URL$1"; }
body()   { cat /tmp/sc_body; }
jq_val() { cat /tmp/sc_body | jq -r "$1" 2>/dev/null; }

# =============================================================================
# 0. Health check
# =============================================================================
section "Health check"
STATUS=$(get "/")
assert_status 200 "$STATUS" "GET / → API is running"

# =============================================================================
# 1. Auth
# =============================================================================
section "Auth – login"

STATUS=$(post "/api/auth/login" '{"email":"testteacher@smartclass.io","password":"Teacher123!"}')
assert_status 200 "$STATUS" "Teacher login"
TEACHER_ID=$(jq_val '.id')
# Re-login with teacher cookie jar
STATUS=$(tpost "/api/auth/login" '{"email":"testteacher@smartclass.io","password":"Teacher123!"}')
assert_status 200 "$STATUS" "Teacher login (cookie jar)"
TEACHER_ID=$(jq_val '.id')

STATUS=$(post "/api/auth/login" '{"email":"teststudent@smartclass.io","password":"Student123!"}')
assert_status 200 "$STATUS" "Student login"
STUDENT_ID=$(jq_val '.id')

# Bad credentials
STATUS=$(post "/api/auth/login" '{"email":"testteacher@smartclass.io","password":"WrongPass"}')
assert_status 401 "$STATUS" "Login with wrong password → 401"

# Missing fields
STATUS=$(post "/api/auth/login" '{"email":"testteacher@smartclass.io"}')
assert_status 400 "$STATUS" "Login missing password → 400"

# Logout
STATUS=$(post "/api/auth/logout" '{}')
assert_status 200 "$STATUS" "Logout"

# Re-login student
STATUS=$(post "/api/auth/login" '{"email":"teststudent@smartclass.io","password":"Student123!"}')
assert_status 200 "$STATUS" "Student re-login"
STUDENT_ID=$(jq_val '.id')

# =============================================================================
# 2. Courses
# =============================================================================
section "Courses"

# Create
PAYLOAD=$(jq -n --arg t "Shell Test Course" --arg s "Testing" --arg id "$TEACHER_ID" \
  '{title:$t, subject:$s, teacherId:$id}')
STATUS=$(tpost "/api/courses" "$PAYLOAD")
assert_status 201 "$STATUS" "Create course"
COURSE_ID=$(jq_val '.id')

# List all
STATUS=$(get "/api/courses")
assert_status 200 "$STATUS" "GET /api/courses"

# Get single
STATUS=$(get "/api/courses/$COURSE_ID")
assert_status 200 "$STATUS" "GET /api/courses/:id"

# Update
STATUS=$(patch "/api/courses/$COURSE_ID" "{\"title\":\"Updated Title\",\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "PATCH course title"

# Enroll student (uses student cookie jar)
STATUS=$(post "/api/courses/$COURSE_ID/enroll" "{\"studentId\":\"$STUDENT_ID\"}")
assert_status 200 "$STATUS" "Enroll student in course"

# Double-enroll should fail
STATUS=$(post "/api/courses/$COURSE_ID/enroll" "{\"studentId\":\"$STUDENT_ID\"}")
assert_status 400 "$STATUS" "Double-enroll → 400"

# Unenroll
STATUS=$(curl -s -o /tmp/sc_body -w "%{http_code}" \
  -X DELETE -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$STUDENT_ID\"}" \
  "$BASE_URL/api/courses/$COURSE_ID/enroll")
assert_status 200 "$STATUS" "Unenroll student"

# Re-enroll for later tests
STATUS=$(post "/api/courses/$COURSE_ID/enroll" "{\"studentId\":\"$STUDENT_ID\"}")
assert_status 200 "$STATUS" "Re-enroll student"

# =============================================================================
# 3. Assignments
# =============================================================================
section "Assignments"

PAYLOAD=$(jq -n --arg id "$TEACHER_ID" '{title:"Shell HW",description:"Do it",teacherId:$id}')
STATUS=$(tpost "/api/courses/$COURSE_ID/assignments" "$PAYLOAD")
assert_status 201 "$STATUS" "Create assignment"
ASSIGNMENT_ID=$(jq_val '.id')

# List
STATUS=$(get "/api/courses/$COURSE_ID/assignments")
assert_status 200 "$STATUS" "GET course assignments"

# Get single
STATUS=$(get "/api/assignments/$ASSIGNMENT_ID")
assert_status 200 "$STATUS" "GET assignment by id"

# Submit (student)
PAYLOAD=$(jq -n --arg id "$STUDENT_ID" '{studentId:$id, content:"My submission"}')
STATUS=$(post "/api/assignments/$ASSIGNMENT_ID/submit" "$PAYLOAD")
assert_status 201 "$STATUS" "Submit assignment"

# View submissions (teacher)
STATUS=$(curl -s -o /tmp/sc_body -w "%{http_code}" \
  -b "$TEACHER_COOKIE_JAR" "$BASE_URL/api/assignments/$ASSIGNMENT_ID/submissions")
assert_status 200 "$STATUS" "GET submissions"
SUBMISSION_ID=$(jq_val '.[0].id')

# Grade submission
PAYLOAD=$(jq -n --arg id "$TEACHER_ID" '{score:88, feedback:"Well done", teacherId:$id}')
STATUS=$(curl -s -o /tmp/sc_body -w "%{http_code}" -b "$TEACHER_COOKIE_JAR" \
  -X PATCH -H 'Content-Type: application/json' -d "$PAYLOAD" \
  "$BASE_URL/api/assignments/submissions/$SUBMISSION_ID/grade")
assert_status 200 "$STATUS" "Grade submission"
SCORE=$(jq_val '.score')
[ "$SCORE" = "88" ] && pass "Score is 88" || fail "Expected score 88, got $SCORE"

# Update assignment
STATUS=$(patch "/api/assignments/$ASSIGNMENT_ID" "{\"title\":\"Updated HW\",\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "Update assignment"

# Delete assignment
STATUS=$(del "/api/assignments/$ASSIGNMENT_ID" "{\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "Delete assignment"

# =============================================================================
# 4. Quizzes
# =============================================================================
section "Quizzes"

QUIZ_Q='[{"question":"2+2?","options":["3","4","5","6"],"correctOption":1,"points":1}]'
PAYLOAD=$(jq -n --arg id "$TEACHER_ID" --argjson q "$QUIZ_Q" \
  '{title:"Shell Quiz", questions:$q, timeLimit:15, teacherId:$id}')
STATUS=$(tpost "/api/courses/$COURSE_ID/quizzes" "$PAYLOAD")
assert_status 201 "$STATUS" "Create quiz"
QUIZ_ID=$(jq_val '.id')

# List
STATUS=$(get "/api/courses/$COURSE_ID/quizzes")
assert_status 200 "$STATUS" "GET course quizzes"

# Get single
STATUS=$(get "/api/quizzes/$QUIZ_ID")
assert_status 200 "$STATUS" "GET quiz by id"

# Submit (correct answer at index 1)
PAYLOAD=$(jq -n --arg id "$STUDENT_ID" \
  '{studentId:$id, answers:[{questionIndex:0, selectedOption:1}]}')
STATUS=$(post "/api/quizzes/$QUIZ_ID/submit" "$PAYLOAD")
assert_status 201 "$STATUS" "Submit quiz"
SCORE=$(jq_val '.score')
[ "$SCORE" = "1" ] && pass "Quiz score is 1 (correct)" || fail "Expected quiz score 1, got $SCORE"

# My result
STATUS=$(get "/api/quizzes/$QUIZ_ID/my-result?studentId=$STUDENT_ID")
assert_status 200 "$STATUS" "GET my quiz result"

# Delete quiz
STATUS=$(del "/api/quizzes/$QUIZ_ID" "{\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "Delete quiz"

# =============================================================================
# 5. Live Classes
# =============================================================================
section "Live Classes"

FUTURE=$(date -u -d "+1 day" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || \
         date -u -v+1d '+%Y-%m-%dT%H:%M:%SZ')   # Linux vs macOS

PAYLOAD=$(jq -n --arg id "$TEACHER_ID" --arg d "$FUTURE" \
  '{title:"Shell Live Session", scheduledAt:$d, type:"platform", teacherId:$id}')
STATUS=$(tpost "/api/courses/$COURSE_ID/live-classes" "$PAYLOAD")
assert_status 201 "$STATUS" "Create live class"
LC_ID=$(jq_val '.id')

# List
STATUS=$(get "/api/courses/$COURSE_ID/live-classes")
assert_status 200 "$STATUS" "GET course live classes"

# Get single
STATUS=$(get "/api/live-classes/$LC_ID")
assert_status 200 "$STATUS" "GET live class by id"

# Start class
STATUS=$(patch "/api/live-classes/$LC_ID/status" "{\"status\":\"live\",\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "Start live class (status → live)"

# Student joins
STATUS=$(post "/api/live-classes/$LC_ID/join" "{\"userId\":\"$STUDENT_ID\"}")
assert_status 200 "$STATUS" "Student joins live class"

# Comment
PAYLOAD=$(jq -n --arg id "$STUDENT_ID" '{userId:$id, text:"Hello!"}')
STATUS=$(post "/api/live-classes/$LC_ID/comments" "$PAYLOAD")
assert_status 201 "$STATUS" "Post comment"
COMMENT_ID=$(jq_val '.id')

# Teacher reply
PAYLOAD=$(jq -n --arg id "$TEACHER_ID" --arg p "$COMMENT_ID" '{userId:$id, text:"Hi!", parentComment:$p}')
STATUS=$(tpost "/api/live-classes/$LC_ID/comments" "$PAYLOAD")
assert_status 201 "$STATUS" "Teacher reply to comment"
IS_REPLY=$(jq_val '.isTeacherReply')
[ "$IS_REPLY" = "true" ] && pass "isTeacherReply is true" || fail "Expected isTeacherReply=true"

# List comments
STATUS=$(get "/api/live-classes/$LC_ID/comments")
assert_status 200 "$STATUS" "GET live class comments"

# Q&A question
PAYLOAD=$(jq -n --arg id "$STUDENT_ID" '{studentId:$id, question:"Can you repeat that?"}')
STATUS=$(post "/api/live-classes/$LC_ID/questions" "$PAYLOAD")
assert_status 201 "$STATUS" "Post Q&A question"
Q_ID=$(jq_val '.id')

# Mark answered
STATUS=$(patch "/api/live-classes/$LC_ID/questions/$Q_ID/answer" "{\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "Mark question answered"
ANSWERED=$(jq_val '.isAnswered')
[ "$ANSWERED" = "true" ] && pass "isAnswered is true" || fail "Expected isAnswered=true"

# End class
STATUS=$(patch "/api/live-classes/$LC_ID/status" "{\"status\":\"ended\",\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "End live class (status → ended)"

# Delete
STATUS=$(del "/api/live-classes/$LC_ID" "{\"teacherId\":\"$TEACHER_ID\"}")
assert_status 200 "$STATUS" "Delete live class"

# =============================================================================
# 6. Enrollments (dedicated endpoint)
# =============================================================================
section "Enrollments (/api/enrollments)"

# Create a fresh course for this section
PAYLOAD=$(jq -n --arg id "$TEACHER_ID" '{title:"Enroll Test Course", subject:"Test", teacherId:$id}')
tpost "/api/courses" "$PAYLOAD" > /dev/null
E_COURSE_ID=$(jq_val '.id')

# Enroll
STATUS=$(post "/api/enrollments" "{\"studentId\":\"$STUDENT_ID\",\"courseId\":\"$E_COURSE_ID\"}")
assert_status 201 "$STATUS" "POST /api/enrollments"

# My courses
STATUS=$(get "/api/enrollments/my-courses?studentId=$STUDENT_ID")
assert_status 200 "$STATUS" "GET my-courses"

# Course enrollments (teacher)
STATUS=$(curl -s -o /tmp/sc_body -w "%{http_code}" -b "$TEACHER_COOKIE_JAR" \
  "$BASE_URL/api/enrollments/course/$E_COURSE_ID?teacherId=$TEACHER_ID")
assert_status 200 "$STATUS" "GET enrollments for course"

# Progress
STATUS=$(get "/api/enrollments/progress?studentId=$STUDENT_ID&courseId=$E_COURSE_ID")
assert_status 200 "$STATUS" "GET enrollment progress"

# Unenroll
STATUS=$(curl -s -o /tmp/sc_body -w "%{http_code}" -b "$COOKIE_JAR" \
  -X DELETE -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$STUDENT_ID\",\"courseId\":\"$E_COURSE_ID\"}" \
  "$BASE_URL/api/enrollments")
assert_status 200 "$STATUS" "DELETE /api/enrollments (unenroll)"

# =============================================================================
# 7. Notifications
# =============================================================================
section "Notifications"

STATUS=$(get "/api/notifications?userId=$STUDENT_ID")
assert_status 200 "$STATUS" "GET notifications"

STATUS=$(patch "/api/notifications/read-all" "{\"userId\":\"$STUDENT_ID\"}")
assert_status 200 "$STATUS" "Mark notifications read"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "══════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo -e "  ${BOLD}Results: ${GREEN}${PASS} passed${RESET}, ${RED}${FAIL} failed${RESET}  (${TOTAL} total)"
echo "══════════════════════════════════════════════"

# Cleanup temp files
rm -f "$COOKIE_JAR" "$TEACHER_COOKIE_JAR" /tmp/sc_body

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
