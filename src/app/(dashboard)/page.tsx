import { Breadcrumb } from '@/components/breadcrumb';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[]} />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back to LiftingDiary</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Workouts</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">This Week</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Streak</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0 days</p>
        </div>
      </div>

      {/* Recent workouts */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Recent Workouts</h2>
        <p className="text-muted-foreground">No workouts yet. Start logging your gains!</p>
      </div>
    </div>
  );
}
