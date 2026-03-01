'use client';

import { Breadcrumb } from '@/components/breadcrumb';

interface EditWorkoutPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[
        { label: 'Workouts', href: '/workouts' },
        { label: `Workout ${id}`, href: `/workouts/${id}` },
        { label: 'Edit' }
      ]} />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Workout</h1>
        <p className="text-muted-foreground mt-2">Update this workout session</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground">Edit form coming soon...</p>
      </div>
    </div>
  );
}
