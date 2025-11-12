# Courses and Calendar

This folder contains course information and calendar data.

Each course includes:
- Course metadata (code, title, instructor)
- Schedule and meeting times
- Assignment and exam dates
- ICS calendar feed URL
- Linked tasks and materials

## Example Structure

```json
{
  "code": "ENV-101",
  "title": "Introduction to Environmental Science",
  "semester": "Fall 2025",
  "instructor": "Dr. Jane Smith",
  "schedule": {
    "lectures": [
      {
        "day": "Monday",
        "time": "10:00-11:30",
        "location": "Science Building 101"
      },
      {
        "day": "Wednesday",
        "time": "10:00-11:30",
        "location": "Science Building 101"
      }
    ]
  },
  "calendar": {
    "icsURL": "https://canvas.university.edu/calendar/feed.ics",
    "lastSync": "2025-11-12T02:23:55.806Z"
  },
  "assignments": [
    {
      "title": "Research Essay",
      "dueDate": "2025-12-01T23:59:59.000Z",
      "taskId": "tasks/essay-climate-change.json"
    }
  ],
  "exams": [
    {
      "title": "Midterm Exam",
      "date": "2025-10-15T14:00:00.000Z",
      "location": "Science Building 101"
    }
  ]
}
```

Course data integrates with ICS calendar feeds from Canvas, Blackboard, D2L, or Google Calendar.
