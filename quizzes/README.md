# Practice Quiz Generation System

The Practice Quiz Generation feature automatically creates quizzes from study notes to help students test their knowledge and prepare for exams.

## Overview

This feature is part of Phase 2B of the Vibe University platform and provides:
- **Automatic quiz generation** from markdown notes
- **Multiple question types**: Multiple choice, True/False, Fill-in-the-blank
- **Automatic grading** with detailed feedback
- **Performance tracking** through saved attempts
- **Difficulty levels**: Easy, Medium, Hard, or Mixed

## Features

### Question Types

1. **Multiple Choice**
   - 4 options per question
   - One correct answer
   - Automatic distractor generation from other concepts

2. **True/False**
   - Simple true/false statements
   - Based on facts from notes
   - Includes explanations

3. **Fill-in-the-Blank**
   - Tests recall of key terms and concepts
   - Accepts multiple variations of answers
   - Case-insensitive matching

### Difficulty Levels

- **Easy**: Shorter definitions and simpler concepts
- **Medium**: Standard complexity
- **Hard**: Complex concepts and longer definitions
- **Mixed**: Combination of all difficulty levels

## Usage

### Creating a Quiz

The `generateQuiz` tool can be invoked through the AI assistant:

```typescript
generateQuiz({
  action: 'create',
  notePath: 'notes/biology-cells.md',
  quizTitle: 'Biology Midterm Practice',
  totalQuestions: 15,
  questionTypes: ['multiple-choice', 'true-false', 'fill-blank'],
  difficulty: 'mixed'
})
```

**Parameters:**
- `action`: 'create' | 'grade' | 'list'
- `notePath`: Path to the markdown notes file (required for create)
- `quizTitle`: Optional title (defaults to filename)
- `totalQuestions`: Number of questions (default: 10)
- `questionTypes`: Array of question types to include
- `difficulty`: 'easy' | 'medium' | 'hard' | 'mixed'

**Output:**
- Quiz saved to `quizzes/{title}-quiz.json`
- Returns quiz ID, title, and question count

### Grading a Quiz

```typescript
generateQuiz({
  action: 'grade',
  quizPath: 'quizzes/biology-cells-quiz.json',
  answers: {
    'mc-123': 2,           // Multiple choice: option index (0-3)
    'tf-456': true,        // True/false: boolean
    'fb-789': 'Mitosis'    // Fill-blank: string answer
  }
})
```

**Parameters:**
- `action`: 'grade'
- `quizPath`: Path to quiz file (required)
- `answers`: Object mapping question IDs to answers

**Output:**
- Score percentage (0-100)
- Letter grade (A-F)
- Correct/total count
- Detailed feedback for each question
- Attempt saved to `quizzes/attempts/{quiz-id}-{attempt-id}.json`

### Listing Quizzes

```typescript
generateQuiz({
  action: 'list'
})
```

**Output:**
- Array of all available quizzes
- Each quiz includes: ID, title, source, question count, creation date

## Example Workflow

### 1. Create Notes

Create a markdown file with structured content:

```markdown
# Biology Study Notes

## Cell Division

**Mitosis**: A type of cell division that results in two genetically 
identical daughter cells, each with the same number of chromosomes as 
the parent cell. Used for growth and tissue repair.

**Meiosis**: A specialized type of cell division that produces four 
haploid gametes (sex cells) with half the number of chromosomes as 
the parent cell.
```

### 2. Generate Quiz

Ask the AI assistant:
> "Create a 10-question quiz from my biology notes"

The system will:
1. Parse the notes for key concepts
2. Extract definitions and facts
3. Generate questions of specified types
4. Save the quiz to `quizzes/` directory

### 3. Take the Quiz

Review the questions and prepare your answers.

### 4. Submit for Grading

Provide your answers:
```json
{
  "mc-1234": 0,
  "tf-5678": true,
  "fb-9012": "Mitosis"
}
```

### 5. Review Feedback

Receive:
- Overall score (e.g., 85%)
- Letter grade (e.g., B)
- Question-by-question feedback
- Explanations for incorrect answers

## File Structure

```
quizzes/
├── biology-cells-quiz.json           # Quiz definition
├── chemistry-atoms-quiz.json
└── attempts/
    ├── quiz-123-attempt-456.json     # Graded attempt with feedback
    └── quiz-789-attempt-012.json
```

## Quiz File Format

```json
{
  "id": "quiz-1699876543210",
  "title": "Biology Cells Test",
  "source": "notes/biology-cells.md",
  "questions": [
    {
      "type": "multiple-choice",
      "id": "mc-1699876543210-0",
      "question": "What is Mitosis?",
      "options": [
        "A type of cell division...",
        "A different process...",
        "Another option...",
        "Yet another option..."
      ],
      "correctAnswer": 0,
      "explanation": "Mitosis is defined as...",
      "difficulty": "medium",
      "tags": ["Mitosis"]
    },
    {
      "type": "true-false",
      "id": "tf-1699876543210-0",
      "statement": "Meiosis produces four haploid gametes",
      "correctAnswer": true,
      "explanation": "Correct. Meiosis is a specialized...",
      "difficulty": "easy",
      "tags": ["Meiosis"]
    }
  ],
  "createdAt": "2025-11-12T16:15:43.210Z",
  "totalPoints": 10
}
```

## Best Practices

### For Creating Effective Quizzes

1. **Use well-structured notes**
   - Clear headings and subheadings
   - Consistent definition format (Term: Definition)
   - Bullet points for key facts

2. **Choose appropriate difficulty**
   - Easy: Review and warm-up
   - Medium: Standard practice
   - Hard: Deep understanding
   - Mixed: Comprehensive assessment

3. **Mix question types**
   - Multiple choice tests recognition
   - True/false tests understanding
   - Fill-in-blank tests recall

4. **Set reasonable question counts**
   - 5-10 questions: Quick review
   - 10-20 questions: Practice quiz
   - 20+ questions: Comprehensive test

### For Taking Quizzes

1. **Read questions carefully**
   - Pay attention to wording
   - Look for keywords and qualifiers

2. **For fill-in-blank questions**
   - Spelling matters (but case doesn't)
   - Use exact terms from your notes
   - Avoid extra words

3. **Review feedback**
   - Read explanations for wrong answers
   - Identify knowledge gaps
   - Retake quizzes to improve

## Integration with Study Workflow

The quiz system integrates with other Vibe University features:

1. **Notes** → Quiz Generation
   - Convert study notes into practice quizzes

2. **Quiz Results** → Flashcards
   - Create flashcards from missed questions
   - Focus review on weak areas

3. **Quiz Performance** → Study Schedule
   - Identify topics needing more review
   - Adjust study plan based on scores

## Technical Details

### Core Library: `lib/quiz-generator.ts`

Functions:
- `extractFactsFromNotes()`: Parses notes for key concepts
- `generateMultipleChoiceQuestions()`: Creates MC questions
- `generateTrueFalseQuestions()`: Creates T/F questions
- `generateFillInBlankQuestions()`: Creates fill-blank questions
- `createQuizFromNotes()`: Main quiz creation function
- `gradeQuiz()`: Grades answers and provides feedback

### Tool: `ai/tools/generate-quiz.ts`

Actions:
- `create`: Generate new quiz from notes
- `grade`: Grade quiz attempt
- `list`: List all available quizzes

### Data Schema: `ai/messages/data-parts.ts`

```typescript
'uni-quiz': {
  action: 'create' | 'grade' | 'list',
  quizId: string,
  title: string,
  totalQuestions: number,
  score: number,
  correctCount: number,
  feedback: array,
  status: 'generating' | 'grading' | 'done' | 'error'
}
```

## Testing

Run the test suite:

```bash
node tests/phase2-quiz-test.mjs
```

Tests cover:
- Quiz generation from notes
- All question types
- Grading accuracy
- Difficulty filtering
- Question type filtering
- Data structure validation

## Future Enhancements

Planned for Phase 3:
- [ ] Adaptive difficulty based on performance
- [ ] Timed quizzes
- [ ] Question pools and randomization
- [ ] Detailed analytics and insights
- [ ] Export quizzes to PDF
- [ ] Share quizzes with classmates
- [ ] Study group quiz sessions
- [ ] Integration with LMS platforms

## Limitations

Current limitations (by design for Phase 2B):
- Local storage only (no database)
- Single-user only (no collaboration)
- English language only
- No image/diagram questions
- Basic distractor generation
- Pattern-based question generation (not ML-powered)

These limitations will be addressed in future phases.

## Support

For issues or questions:
- Check existing notes format matches expected patterns
- Ensure quiz files are not corrupted
- Verify answer format matches question type
- Review test suite for examples

## Contributing

To enhance the quiz generation system:
1. Review `lib/quiz-generator.ts` for algorithm improvements
2. Add new question types in the generator library
3. Improve distractor generation for MC questions
4. Enhance pattern matching for fact extraction
5. Add tests for new features

---

**Phase 2B Feature**  
**Status:** ✅ Complete  
**Version:** 0.3.0  
**Last Updated:** November 12, 2025
