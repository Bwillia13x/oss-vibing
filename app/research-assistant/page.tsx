/**
 * AI Research Assistant Page
 * Showcases Phase 8 AI Enhancement capabilities for academic research
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  Search,
  Network,
  TrendingUp,
  FileText,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Target,
  Lightbulb,
  Sparkles,
} from 'lucide-react'

export default function ResearchAssistantPage() {
  const advancedWritingTools = [
    {
      id: 'argument-analysis',
      title: 'Argument Structure Analyzer',
      icon: Target,
      description: 'Analyzes the logical structure of your arguments, identifying thesis clarity, claim strength, evidence quality, and counterargument balance.',
      capabilities: [
        'Thesis statement identification and evaluation',
        'Claims and evidence mapping',
        'Logical flow assessment',
        'Counterargument detection',
        'Discipline-specific analysis (STEM, Humanities, Social Sciences)',
      ],
      useCase: 'Use when refining argumentative essays, research proposals, or position papers.',
    },
    {
      id: 'thesis-evaluator',
      title: 'Thesis Strength Evaluator',
      icon: CheckCircle,
      description: 'Comprehensive evaluation of thesis statements across six dimensions with actionable feedback for improvement.',
      capabilities: [
        'Clarity and specificity scoring',
        'Argumentative nature assessment',
        'Scope evaluation',
        'Originality analysis',
        'Discipline alignment',
        'Testability (for empirical work)',
      ],
      useCase: 'Use when crafting or revising your main thesis statement for maximum impact.',
    },
    {
      id: 'research-gaps',
      title: 'Research Gap Identifier',
      icon: Lightbulb,
      description: 'Automatically identifies opportunities in existing literature by detecting temporal, methodological, and theoretical gaps.',
      capabilities: [
        'Temporal gap detection (outdated research)',
        'Methodological gap analysis',
        'Population/context gaps',
        'Theoretical framework gaps',
        'Contradictory findings identification',
        'Research question generation',
      ],
      useCase: 'Use when conducting literature reviews or developing research proposals.',
    },
  ]

  const researchAssistantTools = [
    {
      id: 'semantic-search',
      title: 'Semantic Paper Search',
      icon: Search,
      description: 'Goes beyond keyword matching to find conceptually related papers using semantic similarity algorithms.',
      capabilities: [
        'Concept-based similarity matching',
        'Cross-terminology discovery',
        'Adjacent research area identification',
        'Methodological similarity detection',
        'Problem-oriented paper clustering',
      ],
      useCase: 'Use when traditional keyword searches miss relevant papers or you need conceptual connections.',
    },
    {
      id: 'citation-network',
      title: 'Citation Network Visualizer',
      icon: Network,
      description: 'Creates interactive visualizations of citation relationships to reveal research communities and influential works.',
      capabilities: [
        'Citation cluster identification',
        'Influential paper detection',
        'Co-citation pattern analysis',
        'Bibliographic coupling',
        'Research lineage mapping',
      ],
      useCase: 'Use when mapping a research field, identifying seminal works, or understanding intellectual genealogy.',
    },
    {
      id: 'trend-analysis',
      title: 'Research Trend Analyzer',
      icon: TrendingUp,
      description: 'Tracks topic evolution over time to identify emerging areas, declining fields, and shifting methodologies.',
      capabilities: [
        'Emerging topic identification',
        'Publication frequency patterns',
        'Methodology shift detection',
        'Hot topic identification',
        'Historical context analysis',
      ],
      useCase: 'Use when planning research direction, writing field development sections, or identifying opportunities.',
    },
    {
      id: 'lit-review-synthesis',
      title: 'Literature Review Synthesizer',
      icon: FileText,
      description: 'Automatically synthesizes multiple papers into coherent literature review sections with thematic organization.',
      capabilities: [
        'Automatic theme extraction',
        'Chronological organization',
        'Methodological categorization',
        'Consensus and debate identification',
        'Gap highlighting',
      ],
      useCase: 'Use when synthesizing large amounts of literature into coherent narrative sections.',
    },
  ]

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Research Assistant</h1>
            <p className="text-muted-foreground">
              Advanced AI tools for academic research and writing
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Phase 8: AI Enhancements
          </CardTitle>
          <CardDescription className="text-base">
            Discipline-specific writing assistance and intelligent research discovery tools
            powered by advanced AI and semantic analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Advanced Writing Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Discipline-specific analysis for argument structure, thesis strength, and research gaps
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Intelligent Research Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Semantic search, citation networks, trend analysis, and automated literature synthesis
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="writing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="writing">
            <Target className="mr-2 h-4 w-4" />
            Advanced Writing Tools
          </TabsTrigger>
          <TabsTrigger value="research">
            <Search className="mr-2 h-4 w-4" />
            Research Assistant
          </TabsTrigger>
        </TabsList>

        {/* Advanced Writing Tools Tab */}
        <TabsContent value="writing" className="space-y-4">
          <div className="grid gap-6">
            {advancedWritingTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Card key={tool.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>{tool.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {tool.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 font-semibold">Capabilities:</h4>
                        <ul className="grid gap-2 md:grid-cols-2">
                          {tool.capabilities.map((capability, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                              <span>{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-sm">
                          <strong>Use Case:</strong> {tool.useCase}
                        </p>
                      </div>
                      <Button className="w-full" variant="outline">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Try {tool.title} in Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Discipline-Specific Support */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle>Discipline-Specific Analysis</CardTitle>
              <CardDescription>
                All writing tools support specialized analysis for different academic disciplines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-white p-3 dark:bg-gray-950">
                  <h4 className="font-semibold">STEM</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Emphasizes testability, statistical evidence, and measurable outcomes
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-3 dark:bg-gray-950">
                  <h4 className="font-semibold">Humanities</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Focuses on interpretation, theoretical frameworks, and textual analysis
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-3 dark:bg-gray-950">
                  <h4 className="font-semibold">Social Sciences</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Balances empirical evidence with theoretical grounding
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Research Assistant Tab */}
        <TabsContent value="research" className="space-y-4">
          <div className="grid gap-6">
            {researchAssistantTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Card key={tool.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>{tool.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {tool.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 font-semibold">Capabilities:</h4>
                        <ul className="grid gap-2 md:grid-cols-2">
                          {tool.capabilities.map((capability, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                              <span>{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-sm">
                          <strong>Use Case:</strong> {tool.useCase}
                        </p>
                      </div>
                      <Button className="w-full" variant="outline">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Try {tool.title} in Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Research Workflow */}
          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
            <CardHeader>
              <CardTitle>Integrated Research Workflow</CardTitle>
              <CardDescription>
                How these tools work together in your research process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Discover & Map</h4>
                    <p className="text-sm text-muted-foreground">
                      Use semantic search and citation networks to find and understand the research landscape
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-purple-300 pl-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Analyze & Synthesize</h4>
                      <p className="text-sm text-muted-foreground">
                        Track trends, identify gaps, and synthesize findings into coherent literature reviews
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-purple-300 pl-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Write & Refine</h4>
                      <p className="text-sm text-muted-foreground">
                        Use advanced writing tools to strengthen arguments, evaluate thesis, and improve structure
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Access these AI tools through the Student Copilot chat interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            All AI research tools are accessible through natural language commands in your Student Copilot chat.
            Simply describe what you need, and the AI will select the appropriate tool.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">Example: Writing Analysis</p>
              <p className="mt-1 text-sm text-muted-foreground italic">
                "Analyze the argument structure in my essay"
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">Example: Research Discovery</p>
              <p className="mt-1 text-sm text-muted-foreground italic">
                "Find papers semantically related to climate change mitigation"
              </p>
            </div>
          </div>
          <Button className="w-full">
            <ArrowRight className="mr-2 h-4 w-4" />
            Open Student Copilot Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
