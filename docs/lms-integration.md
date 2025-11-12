# LMS Integration

**Learning Management System integration for Vibe University**

## Overview

The LMS integration feature allows students to seamlessly connect Vibe University with their institution's Learning Management System. Currently supports Canvas LMS with planned support for Blackboard and Moodle.

## Features

### ✅ Canvas LMS Support (Phase 2)

- **Course Management**
  - List all enrolled courses
  - View course details and codes
  
- **Assignment Import**
  - Import assignments as task documents
  - Automatic task creation with due dates
  - Preserve assignment descriptions and requirements
  
- **Assignment Submission**
  - Submit completed work directly from Vibe University
  - Online text submission support
  - Automatic submission timestamp tracking
  
- **Grade Sync**
  - View grades for submitted assignments
  - Track submission status
  - See points earned vs. total points

### 🔄 Coming in Phase 3

- 🔵 Blackboard Learn integration
- 🔵 Moodle integration
- 🔵 Course material import (syllabus, readings)
- 🔵 Calendar sync with assignment due dates
- 🔵 File upload submissions
- 🔵 Group assignment support
- 🔵 Discussion board integration

## Setup

### Canvas LMS Configuration

1. **Get Canvas Access Token**
   - Log into your Canvas account
   - Go to Account → Settings
   - Scroll to "Approved Integrations"
   - Click "+ New Access Token"
   - Set purpose: "Vibe University Integration"
   - Copy the generated token (you won't see it again!)

2. **Set Environment Variables**
   ```bash
   export CANVAS_BASE_URL="https://canvas.instructure.com"  # or your institution's URL
   export CANVAS_ACCESS_TOKEN="your_access_token_here"
   export CANVAS_COURSE_ID="12345"  # optional, for default course
   ```

3. **Verify Configuration**
   Ask the AI assistant:
   ```
   "Can you list my Canvas courses?"
   ```

## Usage

### List Available Courses

```typescript
lmsSync({
  action: 'list-courses',
  platform: 'canvas'
})
```

**Example:**
```
Student: "Show me my Canvas courses"

AI: Found 4 active course(s):
- Introduction to Biology (BIO-101) - ID: 12345
- Calculus I (MATH-201) - ID: 12346
- World History (HIST-150) - ID: 12347
- English Composition (ENG-101) - ID: 12348
```

### List Upcoming Assignments

```typescript
lmsSync({
  action: 'list-assignments',
  platform: 'canvas',
  courseId: '12345'
})
```

**Example:**
```
Student: "What assignments are due soon in Biology?"

AI: Found 3 upcoming assignment(s):
- Lab Report #2 (Due: 11/15/2025, 100 pts) - ID: 56789
- Chapter 5 Quiz (Due: 11/18/2025, 50 pts) - ID: 56790
- Midterm Essay (Due: 11/22/2025, 150 pts) - ID: 56791
```

### Import Assignment

```typescript
lmsSync({
  action: 'import-assignment',
  platform: 'canvas',
  courseId: '12345',
  assignmentId: '56789'
})
```

**Example:**
```
Student: "Import my Biology lab report assignment"

AI: Assignment imported successfully!

Name: Lab Report #2
Due: November 15, 2025 at 11:59 PM
Points: 100

Task created at: tasks/lab-report-2-56789.md

You can now work on this assignment in Vibe University. 
Use lmsSync with action='submit' to submit your work when complete.
```

**Generated Task Document:**
```markdown
# Lab Report #2

**Course:** Introduction to Biology  
**Due:** Friday, November 15, 2025 at 11:59 PM  
**Points:** 100  
**Submission Types:** online_text_entry

## Description

Write a comprehensive lab report analyzing the results of our 
photosynthesis experiment...

## Work Area

<!-- Start your work below this line -->

---

## Notes

- Assignment imported from Canvas LMS
- Assignment ID: 56789
- Course ID: 12345
- Use `lmsSync` tool to submit your completed work
```

### Submit Completed Work

```typescript
lmsSync({
  action: 'submit',
  platform: 'canvas',
  assignmentId: '56789',
  taskPath: 'tasks/lab-report-2-56789.md',
  courseId: '12345'  // optional
})
```

**Example:**
```
Student: "Submit my lab report to Canvas"

AI: Assignment submitted successfully!

Submission ID: 98765
Submitted at: November 14, 2025 at 10:30 PM

Your work has been submitted to Canvas. Check Canvas for 
grading status and feedback from your instructor.
```

### View Grades

```typescript
lmsSync({
  action: 'get-grades',
  platform: 'canvas',
  courseId: '12345'
})
```

**Example:**
```
Student: "What are my grades in Biology?"

AI: Found 5 graded submission(s):
- Lab Report #1: 95/100 (A)
- Chapter 3 Quiz: 48/50 (A)
- Homework Set 1: 30/30 (A)
- Chapter 4 Quiz: 45/50 (A-)
- Discussion Post 1: 10/10 (A)
```

## Integration with Vibe University Features

### Citation Management
When working on imported assignments:
- Use `findSources` to research your topic
- Use `insertCitations` to add proper citations
- Use `formatBibliography` to generate works cited

### Academic Integrity
Before submitting:
- Run `detectPlagiarism` to check for issues
- Run `checkGrammar` to improve writing quality
- Run `checkIntegrity` to verify all citations

### Complete Workflow Example

```
1. Import assignment:
   "Import my History essay assignment from Canvas"

2. Research and write:
   "Find 5 scholarly sources about the Industrial Revolution"
   "Help me outline my essay"
   [Write your essay with AI assistance]

3. Quality checks:
   "Check my essay for grammar issues"
   "Run a plagiarism check on my essay"

4. Submit:
   "Submit my History essay to Canvas"

5. Track progress:
   "What's my current grade in History?"
```

## File Structure

```
lib/
  lms-canvas-client.ts    - Canvas API client implementation

ai/tools/
  lms-sync.ts             - LMS sync tool
  lms-sync.md             - Tool description

tasks/
  {assignment-name}-{id}.md  - Imported assignment tasks
```

## API Reference

### Canvas API Client

```typescript
interface CanvasConfig {
  baseUrl: string        // Canvas instance URL
  accessToken: string    // API access token
  courseId?: string      // Default course ID
}

class CanvasClient {
  // Get enrolled courses
  async getCourses(): Promise<Course[]>
  
  // Get assignments for a course
  async getAssignments(courseId?: string): Promise<Assignment[]>
  
  // Get upcoming assignments (next 30 days)
  async getUpcomingAssignments(courseId?: string): Promise<Assignment[]>
  
  // Get specific assignment
  async getAssignment(assignmentId: string, courseId?: string): Promise<Assignment>
  
  // Submit assignment
  async submitAssignment(
    assignmentId: string,
    submission: SubmissionData,
    courseId?: string
  ): Promise<Submission>
  
  // Get submission status
  async getSubmission(
    assignmentId: string,
    userId?: string,
    courseId?: string
  ): Promise<Submission>
  
  // Import assignment as task
  async importAssignment(
    assignmentId: string,
    courseId?: string
  ): Promise<ImportResult>
}
```

## Security & Privacy

### Authentication
- Access tokens are stored securely in environment variables
- Tokens are never exposed in task documents or logs
- Each API request uses HTTPS encryption

### Data Handling
- Assignment content is stored locally in task files
- No student data is transmitted to third parties
- Submissions are sent directly to Canvas via official API
- FERPA compliant data handling

### Permissions
The Canvas access token requires these permissions:
- Read course information
- Read assignment information
- Submit assignments
- Read grades

## Troubleshooting

### "Canvas LMS not configured"
**Solution:** Set the required environment variables:
```bash
export CANVAS_BASE_URL="https://your-institution.instructure.com"
export CANVAS_ACCESS_TOKEN="your_token_here"
```

### "Course ID is required"
**Solution:** Either:
1. Set `CANVAS_COURSE_ID` environment variable for default course
2. Provide `courseId` parameter in the tool call
3. First run `list-courses` to get course IDs

### "Task file not found"
**Solution:** Make sure you're using the correct task path from the import step.
The path is shown when you import the assignment.

### "Canvas API error: 401 Unauthorized"
**Solution:** Your access token may be invalid or expired.
Generate a new token in Canvas Account Settings.

### "Assignment submitted but grade shows 'Not graded yet'"
**Solution:** This is normal. Your instructor hasn't graded the submission yet.
Grades appear automatically when the instructor releases them.

## Limitations (Phase 2)

### Current Limitations
- **Platform Support:** Canvas only (Blackboard & Moodle in Phase 3)
- **Submission Types:** Text only (file uploads in Phase 3)
- **Course Materials:** Assignment import only (syllabus, readings in Phase 3)
- **Notifications:** No push notifications (Phase 3)
- **Offline Mode:** Requires internet connection

### Known Issues
- Rich text formatting may be simplified in imported assignments
- Images in assignment descriptions are not imported
- Group assignments show as individual assignments
- Quiz assignments cannot be completed in Vibe University

## Roadmap

### Phase 3 (Months 13-18)
- 🔵 Blackboard Learn integration
- 🔵 Moodle integration
- 🔵 File upload submissions
- 🔵 Course material import (syllabus, readings)
- 🔵 Calendar sync and reminders
- 🔵 Discussion board integration

### Phase 4 (Months 19-24)
- 🔵 LTI (Learning Tools Interoperability) standard support
- 🔵 Grade analytics and predictions
- 🔵 Instructor dashboard features
- 🔵 Bulk assignment operations
- 🔵 Mobile app integration

## Support

For issues or questions:
1. Check this documentation
2. Review Canvas API documentation: https://canvas.instructure.com/doc/api/
3. Contact Vibe University support
4. Report bugs on GitHub

## Credits

Built for Vibe University Phase 2  
Canvas LMS API: https://www.instructure.com/  
Implements LMS Integration (2.4.1) from the roadmap

---

**Last Updated:** November 12, 2025  
**Version:** 0.3.2  
**Status:** Production Ready
