import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { useStore } from '../hooks/useStore';

const topicMastery = [
  { topic: 'Algebra', mastery: 85 },
  { topic: 'Geometry', mastery: 78 },
  { topic: 'Trigonometry', mastery: 72 },
  { topic: 'Statistics', mastery: 88 },
  { topic: 'Calculus', mastery: 65 },
];

const weeklyProgress = [
  { week: 'Week 1', avgScore: 75 },
  { week: 'Week 2', avgScore: 78 },
  { week: 'Week 3', avgScore: 82 },
  { week: 'Week 4', avgScore: 79 },
  { week: 'Week 5', avgScore: 85 },
  { week: 'Week 6', avgScore: 87 },
];

const aiInsights = [
  { type: 'warning', title: 'Low Performance Alert', description: '15 students scoring below 70% in Calculus. Consider additional support sessions.' },
  { type: 'success', title: 'Improvement Detected', description: 'Grade 10A shows 12% improvement in Algebra over the past month.' },
  { type: 'info', title: 'Engagement Pattern', description: 'Student participation is highest on Tuesdays and Thursdays. Consider scheduling important topics on these days.' },
  { type: 'warning', title: 'Assignment Submission', description: '8 students have not submitted the last two assignments. Follow-up recommended.' },
];

export function StudentAnalytics() {
  const store = useStore();
  const students = store.getStudents();
  const [selectedGrade, setSelectedGrade] = useState('all');
  
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#991b1b'];

  // Filter students by grade
  const filteredStudents = selectedGrade === 'all' 
    ? students 
    : students.filter(s => s.grade === selectedGrade);

  // Calculate performance distribution
  const performanceDistribution = [
    { range: '90-100', students: filteredStudents.filter(s => s.avgScore >= 90).length, color: '#10b981' },
    { range: '80-89', students: filteredStudents.filter(s => s.avgScore >= 80 && s.avgScore < 90).length, color: '#3b82f6' },
    { range: '70-79', students: filteredStudents.filter(s => s.avgScore >= 70 && s.avgScore < 80).length, color: '#f59e0b' },
    { range: '60-69', students: filteredStudents.filter(s => s.avgScore >= 60 && s.avgScore < 70).length, color: '#ef4444' },
    { range: 'Below 60', students: filteredStudents.filter(s => s.avgScore < 60).length, color: '#991b1b' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="gradient-text">Student Performance Analytics</h1>
          <p className="text-muted-foreground">AI-assisted analysis of student performance and learning patterns</p>
        </div>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-[200px] rounded-xl border-[oklch(0.92_0.04_270)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="Grade 9A">Grade 9A</SelectItem>
            <SelectItem value="Grade 9B">Grade 9B</SelectItem>
            <SelectItem value="Grade 10A">Grade 10A</SelectItem>
            <SelectItem value="Grade 10B">Grade 10B</SelectItem>
            <SelectItem value="Grade 11A">Grade 11A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiInsights.map((insight, index) => (
          <Card key={index} className={`border-0 shadow-lg bg-white rounded-2xl overflow-hidden ${
            insight.type === 'warning' ? 'border-l-4 border-l-orange-500' :
            insight.type === 'success' ? 'border-l-4 border-l-green-500' :
            'border-l-4 border-l-blue-500'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${
                  insight.type === 'warning' ? 'bg-orange-100' :
                  insight.type === 'success' ? 'bg-green-100' :
                  'bg-blue-100'
                }`}>
                  {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600" />}
                  {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {insight.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
                </div>
                <div>
                  <h4>{insight.title}</h4>
                  <p className="text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[oklch(0.98_0.02_280)] to-[oklch(0.98_0.02_260)]">
            <CardTitle>Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, students }) => `${range}: ${students}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="students"
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid oklch(0.9 0.02 270)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[oklch(0.98_0.02_280)] to-[oklch(0.98_0.02_260)]">
            <CardTitle>Topic Mastery Levels</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicMastery} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 270)" />
                <XAxis type="number" domain={[0, 100]} stroke="oklch(0.5 0.05 270)" />
                <YAxis dataKey="topic" type="category" stroke="oklch(0.5 0.05 270)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid oklch(0.9 0.02 270)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="mastery" fill="url(#masteryGradient)" radius={[0, 12, 12, 0]} />
                <defs>
                  <linearGradient id="masteryGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.6 0.25 280)" />
                    <stop offset="100%" stopColor="oklch(0.65 0.2 260)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--chart-1))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Performance Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={topicMastery}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="topic" stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Radar name="Mastery" dataKey="mastery" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Table */}
      <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[oklch(0.98_0.02_280)] to-[oklch(0.98_0.02_260)]">
          <CardTitle>Individual Student Performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No students found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-4 border border-[oklch(0.92_0.04_270)] rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4>{student.name}</h4>
                      <p className="text-muted-foreground">
                        {student.grade} • {student.assignments} assignments • {student.completion}% completion
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-muted-foreground">Average Score</p>
                        <p>{student.avgScore}%</p>
                      </div>
                      {student.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                      {student.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                      {student.trend === 'stable' && <div className="h-5 w-5" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-muted-foreground">Strengths:</span>
                    {student.strengths.map((strength) => (
                      <Badge key={strength} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                        {strength}
                      </Badge>
                    ))}
                    <span className="text-muted-foreground ml-2">Needs Improvement:</span>
                    {student.weaknesses.map((weakness) => (
                      <Badge key={weakness} className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
