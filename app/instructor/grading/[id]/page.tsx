/**
 * Grading Page
 * Grade individual student submissions with rubric
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Save,
  ArrowLeft,
  ArrowRight,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

// Mock data
const mockSubmission = {
  id: '1',
  assignmentId: '1',
  assignmentTitle: 'Binary Search Implementation',
  studentName: 'Alice Johnson',
  studentEmail: 'a.johnson@university.edu',
  submittedAt: '2025-11-18T14:30:00',
  content: `# Binary Search Implementation

## Introduction
This document presents an implementation of the binary search algorithm...

## Implementation
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1
\`\`\`

## Test Cases
1. Test with empty array
2. Test with single element
3. Test with element at beginning
4. Test with element at end
5. Test with element in middle

## References
- Cormen, T. H., et al. (2009). Introduction to Algorithms (3rd ed.). MIT Press.
- Sedgewick, R., & Wayne, K. (2011). Algorithms (4th ed.). Addison-Wesley.
- Knuth, D. E. (1998). The Art of Computer Programming, Volume 3. Addison-Wesley.`,
  plagiarismScore: 5,
  citationCount: 3,
}

const mockRubric = [
  { id: '1', name: 'Implementation', points: 40, description: 'Correct algorithm implementation' },
  { id: '2', name: 'Documentation', points: 20, description: 'Clear code comments and docs' },
  { id: '3', name: 'Test Cases', points: 20, description: 'Comprehensive test coverage' },
  { id: '4', name: 'Code Quality', points: 20, description: 'Clean, readable code' },
]

type RubricScore = {
  id: string
  score: number
  feedback: string
}

export default function GradingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [submission] = useState(mockSubmission)
  const [rubric] = useState(mockRubric)
  const [loading, setLoading] = useState(false)
  
  // Grading state
  const [rubricScores, setRubricScores] = useState<RubricScore[]>(
    rubric.map((criterion) => ({
      id: criterion.id,
      score: 0,
      feedback: '',
    }))
  )
  const [overallComments, setOverallComments] = useState('')

  const updateScore = (id: string, score: number) => {
    setRubricScores(
      rubricScores.map((item) => (item.id === id ? { ...item, score } : item))
    )
  }

  const updateFeedback = (id: string, feedback: string) => {
    setRubricScores(
      rubricScores.map((item) => (item.id === id ? { ...item, feedback } : item))
    )
  }

  const totalPoints = rubric.reduce((sum, criterion) => sum + criterion.points, 0)
  const earnedPoints = rubricScores.reduce((sum, score) => sum + score.score, 0)
  const percentage = Math.round((earnedPoints / totalPoints) * 100)

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const handleSubmit = async () => {
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log('Submitting grade:', {
      submissionId: submission.id,
      rubricScores,
      overallComments,
      totalScore: earnedPoints,
    })

    setLoading(false)
    router.push(`/instructor/assignments/${submission.assignmentId}`)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel - Submission Content */}
      <div className="flex-1 border-r">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/instructor/assignments/${submission.assignmentId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Assignment
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <h2 className="text-2xl font-bold">{submission.assignmentTitle}</h2>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <span>{submission.studentName}</span>
              <span>•</span>
              <span>{submission.studentEmail}</span>
              <span>•</span>
              <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Submission Info */}
          <div className="border-b p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Plagiarism Check</div>
                <Badge
                  variant={
                    submission.plagiarismScore < 10
                      ? 'default'
                      : submission.plagiarismScore < 25
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {submission.plagiarismScore}% similarity
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Citations</div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{submission.citationCount} sources</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Submission Status</div>
                <Badge>On Time</Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans">{submission.content}</pre>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Grading Interface */}
      <div className="w-[500px] flex flex-col">
        {/* Grade Summary */}
        <div className="border-b p-6 bg-muted/50">
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold">{earnedPoints}</div>
            <div className="text-muted-foreground">out of {totalPoints} points</div>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {percentage}%
              </Badge>
              <Badge className="text-lg px-3 py-1">{getLetterGrade(percentage)}</Badge>
            </div>
            <Progress value={percentage} className="mt-4" />
          </div>
        </div>

        {/* Rubric Grading */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Grading Rubric</h3>
              <div className="space-y-4">
                {rubric.map((criterion) => {
                  const score = rubricScores.find((s) => s.id === criterion.id)
                  return (
                    <Card key={criterion.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{criterion.name}</CardTitle>
                          <Badge variant="outline">{criterion.points} points</Badge>
                        </div>
                        <CardDescription>{criterion.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`score-${criterion.id}`}>Points Earned</Label>
                          <Input
                            id={`score-${criterion.id}`}
                            type="number"
                            min="0"
                            max={criterion.points}
                            value={score?.score || 0}
                            onChange={(e) =>
                              updateScore(criterion.id, Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`feedback-${criterion.id}`}>Feedback</Label>
                          <Textarea
                            id={`feedback-${criterion.id}`}
                            placeholder="Provide specific feedback..."
                            value={score?.feedback || ''}
                            onChange={(e) => updateFeedback(criterion.id, e.target.value)}
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Overall Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall Comments</CardTitle>
                <CardDescription>General feedback for the student</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Provide overall feedback on the submission..."
                  value={overallComments}
                  onChange={(e) => setOverallComments(e.target.value)}
                  rows={5}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Submit Button */}
        <div className="border-t p-6 space-y-4">
          {earnedPoints === 0 && (
            <div className="flex items-start space-x-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>You haven't assigned any points yet. Make sure to grade each criterion.</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading || earnedPoints === 0}
            className="w-full"
            size="lg"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving Grade...' : 'Submit Grade'}
          </Button>
        </div>
      </div>
    </div>
  )
}
