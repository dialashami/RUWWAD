// components/MainContent.jsx
import React from 'react';
import { Card } from './Card';

export function MainContent() {
  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            title="البطاقة الأولى" 
            description="هذه بطاقة وصفية تحتوي على محتوى مهم"
            status="success"
          />
          <Card 
            title="البطاقة الثانية" 
            description="بطاقة أخرى بمحتوى مختلف"
            status="warning"
          />
          <Card 
            title="البطاقة الثالثة" 
            description="بطاقة تحتوي على معلومات إضافية"
            status="info"
          />
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">عناصر واجهة إضافية</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h4 className="text-lg font-medium mb-3">مخطط بياني</h4>
              <div className="h-48 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground">مخطط بياني سيظهر هنا</span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h4 className="text-lg font-medium mb-3">قائمة المهام</h4>
              <div className="space-y-3">
                <TaskItem title="مهمة مكتملة" completed={true} />
                <TaskItem title="مهمة قيد التنفيذ" completed={false} />
                <TaskItem title="مهمة جديدة" completed={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function TaskItem({ title, completed }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded border border-border">
      <input 
        type="checkbox" 
        checked={completed}
        className="w-4 h-4 rounded border-border"
        readOnly
      />
      <span className={completed ? 'line-through text-muted-foreground' : ''}>
        {title}
      </span>
    </div>
  );
}