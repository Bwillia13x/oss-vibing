# Instructor API Documentation

This document provides comprehensive documentation for all instructor-facing API endpoints for assignment management and grading.

## Table of Contents

- [Assignment Management](#assignment-management)
  - [Create Assignment](#create-assignment)
  - [Get Assignment by ID](#get-assignment-by-id)
  - [Get Course Assignments](#get-course-assignments)
  - [Update Assignment](#update-assignment)
  - [Delete Assignment](#delete-assignment)
  - [Publish Assignment](#publish-assignment)
- [Grading Management](#grading-management)
  - [Create Grade](#create-grade)
  - [Get Grade by Submission](#get-grade-by-submission)
  - [Update Grade](#update-grade)
- [Error Responses](#error-responses)

---

## Assignment Management

### Create Assignment

Create a new assignment for a course.

**Endpoint:** `POST /api/instructor/assignments`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Request Body:**

```json
{
  "title": "Essay Assignment: Climate Change",
  "description": "Write a 5-page essay on climate change impacts",
  "instructorId": "user_abc123",
  "courseId": "course_xyz789",
  "dueDate": "2025-12-31T23:59:59Z",
  "maxPoints": 100,
  "rubric": {
    "research": 40,
    "writing": 30,
    "citations": 20,
    "formatting": 10
  },
  "requirements": {
    "minWords": 1500,
    "minSources": 5,
    "format": "APA"
  },
  "published": false
}
```

**Request Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Assignment title (1-200 characters) |
| description | string | No | Detailed assignment description |
| instructorId | string | Yes | ID of the instructor creating the assignment |
| courseId | string | No | ID of the course this assignment belongs to |
| dueDate | string (ISO 8601) | Yes | Assignment due date and time |
| maxPoints | number | Yes | Maximum points (1-1000) |
| rubric | object | No | Grading rubric with criteria and point values |
| requirements | object | No | Assignment requirements (word count, sources, etc.) |
| published | boolean | No | Whether assignment is published (default: false) |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "assignment_123",
    "title": "Essay Assignment: Climate Change",
    "description": "Write a 5-page essay on climate change impacts",
    "instructorId": "user_abc123",
    "courseId": "course_xyz789",
    "dueDate": "2025-12-31T23:59:59.000Z",
    "maxPoints": 100,
    "rubric": {
      "research": 40,
      "writing": 30,
      "citations": 20,
      "formatting": 10
    },
    "requirements": {
      "minWords": 1500,
      "minSources": 5,
      "format": "APA"
    },
    "published": false,
    "createdAt": "2025-11-17T10:30:00.000Z",
    "updatedAt": "2025-11-17T10:30:00.000Z"
  },
  "message": "Assignment created successfully"
}
```

**Validation Error:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "title": ["String must contain at least 1 character(s)"],
    "maxPoints": ["Number must be less than or equal to 1000"],
    "dueDate": ["Invalid datetime"]
  }
}
```

**Rate Limit Error:** `429 Too Many Requests`

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

---

### Get Assignment by ID

Retrieve a specific assignment by its ID.

**Endpoint:** `GET /api/instructor/assignments/[id]`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeSubmissions | boolean | No | Include student submissions (default: false) |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "assignment_123",
    "title": "Essay Assignment: Climate Change",
    "description": "Write a 5-page essay on climate change impacts",
    "instructorId": "user_abc123",
    "courseId": "course_xyz789",
    "dueDate": "2025-12-31T23:59:59.000Z",
    "maxPoints": 100,
    "rubric": {
      "research": 40,
      "writing": 30,
      "citations": 20,
      "formatting": 10
    },
    "requirements": {
      "minWords": 1500,
      "minSources": 5,
      "format": "APA"
    },
    "published": true,
    "createdAt": "2025-11-17T10:30:00.000Z",
    "updatedAt": "2025-11-17T12:00:00.000Z"
  }
}
```

**Not Found Error:** `404 Not Found`

```json
{
  "success": false,
  "error": "Assignment with id assignment_123 not found"
}
```

---

### Get Course Assignments

Retrieve all assignments for a specific course.

**Endpoint:** `GET /api/instructor/assignments?courseId={courseId}`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| courseId | string | Yes | ID of the course |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "assignment_123",
      "title": "Essay Assignment: Climate Change",
      "maxPoints": 100,
      "dueDate": "2025-12-31T23:59:59.000Z",
      "published": true
    },
    {
      "id": "assignment_124",
      "title": "Research Paper: Renewable Energy",
      "maxPoints": 150,
      "dueDate": "2026-01-15T23:59:59.000Z",
      "published": false
    }
  ],
  "count": 2
}
```

**Bad Request Error:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Either courseId or assignmentId is required"
}
```

---

### Update Assignment

Update an existing assignment.

**Endpoint:** `PATCH /api/instructor/assignments/[id]`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Request Body:**

```json
{
  "title": "Updated Essay Assignment: Climate Change",
  "maxPoints": 120,
  "published": true
}
```

**Request Body Parameters:**

All fields are optional. Only include fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Assignment title (1-200 characters) |
| description | string | Detailed assignment description |
| courseId | string | ID of the course this assignment belongs to |
| dueDate | string (ISO 8601) | Assignment due date and time |
| maxPoints | number | Maximum points (1-1000) |
| rubric | object | Grading rubric with criteria and point values |
| requirements | object | Assignment requirements |
| published | boolean | Whether assignment is published |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "assignment_123",
    "title": "Updated Essay Assignment: Climate Change",
    "description": "Write a 5-page essay on climate change impacts",
    "maxPoints": 120,
    "published": true,
    "updatedAt": "2025-11-17T14:30:00.000Z"
  },
  "message": "Assignment updated successfully"
}
```

**Not Found Error:** `404 Not Found`

```json
{
  "success": false,
  "error": "Assignment with id assignment_123 not found"
}
```

**Validation Error:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "maxPoints": ["Number must be less than or equal to 1000"]
  }
}
```

---

### Delete Assignment

Delete an assignment.

**Endpoint:** `DELETE /api/instructor/assignments/[id]`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

**Not Found Error:** `404 Not Found`

```json
{
  "success": false,
  "error": "Assignment with id assignment_123 not found"
}
```

---

### Publish Assignment

Publish an assignment to make it visible to students.

**Endpoint:** `POST /api/instructor/assignments/[id]/publish`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "assignment_123",
    "title": "Essay Assignment: Climate Change",
    "published": true,
    "updatedAt": "2025-11-17T15:00:00.000Z"
  },
  "message": "Assignment published successfully"
}
```

**Not Found Error:** `404 Not Found`

```json
{
  "success": false,
  "error": "Assignment with id assignment_123 not found"
}
```

---

## Grading Management

### Create Grade

Create a grade for a student submission.

**Endpoint:** `POST /api/instructor/grading/[submissionId]`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Request Body:**

```json
{
  "instructorId": "user_abc123",
  "score": 85,
  "maxPoints": 100,
  "feedback": {
    "overall": "Excellent work! Your analysis of climate impacts was thorough.",
    "strengths": "Strong research and clear writing",
    "improvements": "Could improve citation formatting"
  },
  "rubricScores": {
    "research": 38,
    "writing": 28,
    "citations": 15,
    "formatting": 4
  }
}
```

**Request Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| instructorId | string | Yes | ID of the instructor grading the submission |
| score | number | Yes | Total score (min: 0) |
| maxPoints | number | Yes | Maximum points (min: 1) |
| feedback | object | No | Detailed feedback for the student |
| rubricScores | object | No | Individual scores for rubric criteria |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "grade_456",
    "submissionId": "submission_789",
    "instructorId": "user_abc123",
    "score": 85,
    "maxPoints": 100,
    "feedback": {
      "overall": "Excellent work! Your analysis of climate impacts was thorough.",
      "strengths": "Strong research and clear writing",
      "improvements": "Could improve citation formatting"
    },
    "rubricScores": {
      "research": 38,
      "writing": 28,
      "citations": 15,
      "formatting": 4
    },
    "createdAt": "2025-11-17T16:00:00.000Z",
    "updatedAt": "2025-11-17T16:00:00.000Z"
  },
  "message": "Submission graded successfully"
}
```

**Not Found Error:** `404 Not Found`

```json
{
  "success": false,
  "error": "Submission with id submission_789 not found"
}
```

**Conflict Error:** `409 Conflict`

```json
{
  "success": false,
  "error": "Grade already exists for this submission. Use PATCH to update."
}
```

**Validation Error:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "score": ["Expected number, received nan"],
    "instructorId": ["Required"]
  }
}
```

---

### Get Grade by Submission

Retrieve a grade for a specific submission.

**Endpoint:** `GET /api/instructor/grading/[submissionId]`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "grade_456",
    "submissionId": "submission_789",
    "instructorId": "user_abc123",
    "score": 85,
    "maxPoints": 100,
    "feedback": {
      "overall": "Excellent work!"
    },
    "rubricScores": {
      "research": 38,
      "writing": 28,
      "citations": 15,
      "formatting": 4
    },
    "createdAt": "2025-11-17T16:00:00.000Z",
    "updatedAt": "2025-11-17T16:00:00.000Z"
  }
}
```

**Not Found Error:** `404 Not Found`

```json
{
  "success": false,
  "error": "Grade with id submission_789 not found"
}
```

---

### Update Grade

Update an existing grade.

**Endpoint:** `PATCH /api/instructor/grading/[submissionId]`

**Authentication Required:** Yes (Instructor, Admin, or Institution Admin)

**Rate Limiting:** Yes

**Request Body:**

```json
{
  "score": 90,
  "feedback": {
    "overall": "Excellent work after revision!"
  }
}
```

**Request Body Parameters:**

All fields are optional. Only include fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| score | number | Total score (min: 0) |
| maxPoints | number | Maximum points (min: 1) |
| feedback | object | Detailed feedback for the student |
| rubricScores | object | Individual scores for rubric criteria |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "grade_456",
    "submissionId": "submission_789",
    "score": 90,
    "maxPoints": 100,
    "feedback": {
      "overall": "Excellent work after revision!"
    },
    "updatedAt": "2025-11-17T17:00:00.000Z"
  },
  "message": "Grade updated successfully"
}
```

**Not Found Error:** `404 Not Found`

```json
{
  "success": false,
  "error": "Grade with id submission_789 not found"
}
```

**Validation Error:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "score": ["Number must be greater than or equal to 0"]
  }
}
```

---

## Error Responses

All API endpoints follow a consistent error response format using custom error classes.

### Error Response Structure

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field1": ["Error message 1", "Error message 2"],
    "field2": ["Error message"]
  }
}
```

### HTTP Status Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | User is authenticated but not authorized |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists or conflicts with current state |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Common Error Types

#### Validation Error (400)

Occurs when input validation fails. Includes `details` field with field-specific errors.

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "title": ["String must contain at least 1 character(s)"],
    "maxPoints": ["Number must be less than or equal to 1000"]
  }
}
```

#### Not Found Error (404)

Occurs when a requested resource doesn't exist.

```json
{
  "success": false,
  "error": "Assignment with id assignment_123 not found"
}
```

#### Conflict Error (409)

Occurs when a resource already exists or conflicts with current state.

```json
{
  "success": false,
  "error": "Grade already exists for this submission. Use PATCH to update."
}
```

#### Rate Limit Error (429)

Occurs when API rate limits are exceeded.

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

---

## Authentication

All instructor API endpoints require authentication with one of the following roles:

- **instructor**: Standard instructor account
- **admin**: System administrator
- **institution-admin**: Institution-level administrator

Include authentication credentials in the request header as per your authentication mechanism.

---

## Rate Limiting

All instructor API endpoints are rate-limited to prevent abuse. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

Rate limits are enforced per IP address.

---

## Best Practices

1. **Validate input on the client**: While server-side validation is enforced, client-side validation improves user experience
2. **Handle errors gracefully**: Always check the `success` field in responses and handle errors appropriately
3. **Use proper HTTP methods**: Use GET for retrieval, POST for creation, PATCH for updates, DELETE for deletion
4. **Include all required fields**: Check the documentation for required fields before making requests
5. **Respect rate limits**: Implement appropriate throttling in your client application
6. **Check submission existence before grading**: Always verify a submission exists before attempting to create a grade

---

## Examples

### Complete Workflow: Create and Grade an Assignment

1. **Create Assignment**

```bash
POST /api/instructor/assignments
{
  "title": "Climate Change Essay",
  "instructorId": "user_abc123",
  "courseId": "course_xyz789",
  "dueDate": "2025-12-31T23:59:59Z",
  "maxPoints": 100
}
```

2. **Publish Assignment**

```bash
POST /api/instructor/assignments/assignment_123/publish
```

3. **Grade Student Submission**

```bash
POST /api/instructor/grading/submission_789
{
  "instructorId": "user_abc123",
  "score": 85,
  "maxPoints": 100,
  "feedback": {
    "overall": "Excellent work!"
  }
}
```

4. **Update Grade After Review**

```bash
PATCH /api/instructor/grading/submission_789
{
  "score": 90,
  "feedback": {
    "overall": "Outstanding after revision!"
  }
}
```

---

## Support

For questions or issues with the Instructor APIs, please contact the development team or file an issue in the project repository.
