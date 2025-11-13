/**
 * Assignment Creation Page
 * Create new assignments with rubrics and requirements
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, X } from 'lucide-react'

type RubricCriterion = {
  id: string
  name: string
  description: string
  points: number
}

const mockCourses = [
  { id: '1', code: 'CS101', name: 'Introduction to Programming' },
  { id: '2', code: 'CS201', name: 'Data Structures' },
  { id: '3', code: 'CS301', name: 'Algorithms' },
]

const assignmentTemplates = [
  { id: 'essay', name: 'Essay', description: 'Standard essay with citations' },
  { id: 'lab', name: 'Lab Report', description: 'Technical lab report' },
  { id: 'presentation', name: 'Presentation', description: 'Slide deck presentation' },
  { id: 'custom', name: 'Custom', description: 'Start from scratch' },
]

export default function CreateAssignmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [template, setTemplate] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('23:59')
  const [pointsPossible, setPointsPossible] = useState('100')
  const [minCitations, setMinCitations] = useState('3')
  const [citationStyle, setCitationStyle] = useState('APA')
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(true)
  const [latePenalty, setLatePenalty] = useState('10')
  
  // Rubric state
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([
    { id: '1', name: 'Content Quality', description: 'Depth and accuracy of content', points: 40 },
    { id: '2', name: 'Organization', description: 'Logical structure and flow', points: 20 },
    { id: '3', name: 'Citations', description: 'Proper use of citations', points: 20 },
    { id: '4', name: 'Writing Quality', description: 'Grammar, style, and clarity', points: 20 },
  ])

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: Date.now().toString(),
      name: '',
      description: '',
      points: 0,
    }
    setRubricCriteria([...rubricCriteria, newCriterion])
  }

  const updateCriterion = (id: string, field: keyof RubricCriterion, value: string | number) => {
    setRubricCriteria(
      rubricCriteria.map((criterion) =>
        criterion.id === id ? { ...criterion, [field]: value } : criterion
      )
    )
  }

  const removeCriterion = (id: string) => {
    setRubricCriteria(rubricCriteria.filter((criterion) => criterion.id !== id))
  }

  const totalRubricPoints = rubricCriteria.reduce((sum, criterion) => sum + criterion.points, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In production, this would call the API
    console.log('Creating assignment:', {
      title,
      courseId,
      template,
      description,
      instructions,
      dueDate,
      dueTime,
      pointsPossible,
      minCitations,
      citationStyle,
      allowLateSubmissions,
      latePenalty,
      rubricCriteria,
    })

    setLoading(false)
    router.push('/instructor/assignments')
  }

  return (
    <div className="space-y-6 p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
          <p className="text-muted-foreground">
            Set up a new assignment with rubric and requirements
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/instructor/assignments">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Assignment details and course selection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Binary Search Implementation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={courseId} onValueChange={setCourseId} required>
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Assignment Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {assignmentTemplates.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      <div>
                        <div className="font-medium">{tmpl.name}</div>
                        <div className="text-xs text-muted-foreground">{tmpl.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the assignment"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Detailed Instructions *</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Detailed instructions for students..."
                rows={6}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Due Date & Points */}
        <Card>
          <CardHeader>
            <CardTitle>Due Date & Grading</CardTitle>
            <CardDescription>Set deadline and point values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueTime">Due Time *</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points Possible *</Label>
                <Input
                  id="points"
                  type="number"
                  value={pointsPossible}
                  onChange={(e) => setPointsPossible(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="latePolicy">Late Submission Policy</Label>
              <div className="flex items-center space-x-4">
                <Select
                  value={allowLateSubmissions ? 'yes' : 'no'}
                  onValueChange={(value) => setAllowLateSubmissions(value === 'yes')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Allow</SelectItem>
                    <SelectItem value="no">Do not allow</SelectItem>
                  </SelectContent>
                </Select>
                {allowLateSubmissions && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="latePenalty">Penalty per day:</Label>
                    <Input
                      id="latePenalty"
                      type="number"
                      value={latePenalty}
                      onChange={(e) => setLatePenalty(e.target.value)}
                      className="w-20"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Citation Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Citation Requirements</CardTitle>
            <CardDescription>Set citation standards for this assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minCitations">Minimum Citations *</Label>
                <Input
                  id="minCitations"
                  type="number"
                  value={minCitations}
                  onChange={(e) => setMinCitations(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="citationStyle">Citation Style *</Label>
                <Select value={citationStyle} onValueChange={setCitationStyle} required>
                  <SelectTrigger id="citationStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APA">APA 7th Edition</SelectItem>
                    <SelectItem value="MLA">MLA 9th Edition</SelectItem>
                    <SelectItem value="Chicago">Chicago Style</SelectItem>
                    <SelectItem value="IEEE">IEEE</SelectItem>
                    <SelectItem value="Harvard">Harvard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rubric Builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grading Rubric</CardTitle>
                <CardDescription>Define grading criteria and point distribution</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={totalRubricPoints === Number(pointsPossible) ? 'default' : 'destructive'}>
                  {totalRubricPoints} / {pointsPossible} points
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rubricCriteria.map((criterion, index) => (
              <div key={criterion.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`criterion-name-${criterion.id}`}>
                          Criterion {index + 1} Name *
                        </Label>
                        <Input
                          id={`criterion-name-${criterion.id}`}
                          value={criterion.name}
                          onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                          placeholder="e.g., Content Quality"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`criterion-points-${criterion.id}`}>Points *</Label>
                        <Input
                          id={`criterion-points-${criterion.id}`}
                          type="number"
                          value={criterion.points}
                          onChange={(e) =>
                            updateCriterion(criterion.id, 'points', Number(e.target.value))
                          }
                          min="0"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`criterion-desc-${criterion.id}`}>Description *</Label>
                      <Textarea
                        id={`criterion-desc-${criterion.id}`}
                        value={criterion.description}
                        onChange={(e) =>
                          updateCriterion(criterion.id, 'description', e.target.value)
                        }
                        placeholder="Describe what this criterion evaluates..."
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriterion(criterion.id)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addCriterion} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Criterion
            </Button>

            {totalRubricPoints !== Number(pointsPossible) && (
              <div className="text-sm text-destructive">
                Warning: Rubric total ({totalRubricPoints} points) does not match points possible (
                {pointsPossible} points)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/instructor/assignments">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || totalRubricPoints !== Number(pointsPossible)}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
