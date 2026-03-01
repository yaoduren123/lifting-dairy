import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Plus } from 'lucide-react';

export default function WorkoutsPage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Workouts' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workouts</h1>
          <p className="text-muted-foreground mt-2">Track and manage your workout sessions</p>
        </div>
        <Link
          href="/workouts/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          New Workout
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground">No workouts logged yet. Start your first workout!</p>
      </div>
    </div>
  );
}
