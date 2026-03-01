import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getWorkouts } from '@/db/queries/workouts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface WorkoutsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  // Ensure DB user exists and get internal ID
  const [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId));
  if (!dbUser) redirect('/'); // Let dashboard handle user link/creation

  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const limit = 8;

  const { workouts, totalPages, totalCount } = await getWorkouts(dbUser.id, currentPage, limit);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workout History</h1>
          <p className="text-muted-foreground mt-1">
            Browse through your previous training sessions ({totalCount} sessions)
          </p>
        </div>
        <Link href="/workouts/new">
          <Button className="font-bold gap-2 bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 rounded-xl px-6 h-12 transition-all hover:-translate-y-1">
            <Plus size={20} className="stroke-[3]" />
            New Workout
          </Button>
        </Link>
      </div>

      {workouts.length > 0 ? (
        <div className="space-y-6">
          <div className="grid gap-4">
            {workouts.map((workout, index) => (
              <Link 
                key={workout.id} 
                href={`/workouts/${workout.id}`}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="bg-card hover:bg-card/80 transition-all border-border shadow-sm group overflow-hidden">
                  <div className="p-4 sm:p-6 flex items-center justify-between relative">
                    {/* Progress indicator or accent line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted/30 text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
                        <Dumbbell size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl font-[family-name:var(--font-barlow-condensed)] tracking-wide capitalize">
                          {workout.type} Session
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(workout.date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric' 
                          })} • {workout.duration} mins
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right hidden sm:block">
                      <div className="text-2xl font-bold font-[family-name:var(--font-barlow-condensed)] text-foreground">
                        {workout.workoutExercises.length}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Exercises
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
                className="gap-2 rounded-xl"
              >
                {currentPage > 1 ? (
                  <Link href={`/workouts?page=${currentPage - 1}`}>
                    <ChevronLeft size={18} />
                    Previous
                  </Link>
                ) : (
                  <>
                    <ChevronLeft size={18} />
                    Previous
                  </>
                )}
              </Button>
              
              <div className="text-sm font-medium text-muted-foreground">
                Page <span className="text-foreground">{currentPage}</span> of {totalPages}
              </div>

              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
                className="gap-2 rounded-xl"
              >
                {currentPage < totalPages ? (
                  <Link href={`/workouts?page=${currentPage + 1}`}>
                    Next
                    <ChevronRight size={18} />
                  </Link>
                ) : (
                  <>
                    Next
                    <ChevronRight size={18} />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-card border-border shadow-sm p-12 sm:p-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
            <div className="w-20 h-20 bg-muted/30 flex items-center justify-center rounded-full mb-8 relative">
              <Dumbbell size={40} className="text-foreground/30" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 font-[family-name:var(--font-barlow-condensed)] tracking-wide">
              No training history found
            </h3>
            <p className="mb-10 text-sm leading-relaxed">
              It looks like you haven&apos;t logged any workouts yet. Start your fitness journey today.
            </p>
            <Link href="/workouts/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-bold gap-2 bg-orange-600 hover:bg-orange-500 rounded-xl px-10 h-14 shadow-lg shadow-orange-500/20 text-white transition-all hover:-translate-y-1">
                <Plus size={20} className="stroke-[3]" />
                Log Your First Workout
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
