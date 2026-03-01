import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Edit, Trash2 } from 'lucide-react';

interface WorkoutDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[
        { label: 'Workouts', href: '/workouts' },
        { label: `Workout ${id}` }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workout Details</h1>
          <p className="text-muted-foreground mt-2">View and manage this workout session</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/workouts/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Edit size={20} />
            Edit
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Trash2 size={20} />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground">Workout details coming soon...</p>
      </div>
    </div>
  );
}
