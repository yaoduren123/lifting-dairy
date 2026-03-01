'use client';

import { Breadcrumb } from '@/components/breadcrumb';

export default function NewWorkoutPage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[
        { label: 'Workouts', href: '/workouts' },
        { label: 'New Workout' }
      ]} />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Create New Workout</h1>
        <p className="text-muted-foreground mt-2">Log a new workout session</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground">Workout form coming soon...</p>
      </div>
    </div>
  );
}
