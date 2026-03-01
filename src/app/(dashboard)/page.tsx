import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Calendar, Dumbbell, Flame, Plus, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getWorkouts } from '@/db/queries/workouts';
import { getDashboardStats } from '@/db/queries/stats';
import { differenceInDays } from 'date-fns';
import { WorkoutFrequencyChart } from '@/components/workout-frequency-chart';
import { getUserTimezone } from '@/lib/timezone';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // 1. Get or create user
  let [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, userId));
  
  // As a convenience to show the seeded data, link 'test_user_seed' to the first user that logs in!
  if (!dbUser) {
    const [seedUser] = await db.select().from(users).where(eq(users.clerkUserId, 'test_user_seed'));
    if (seedUser) {
       [dbUser] = await db.update(users).set({ clerkUserId: userId }).where(eq(users.id, seedUser.id)).returning();
    } else {
       [dbUser] = await db.insert(users).values({ clerkUserId: userId }).returning();
    }
  }

  // 2. Fetch all dashboard data in parallel
  const now = new Date();
  const timezone = await getUserTimezone();
  const [stats, { workouts: recent5 }] = await Promise.all([
    getDashboardStats(dbUser.id, timezone),
    getWorkouts(dbUser.id, 1, 5),
  ]);

  const { workoutsThisMonth, volumeThisWeek, streak, dailyFrequency, personalRecords } = stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Ready to crush it?</p>
        </div>
        <Link href="/workouts/new" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto font-bold gap-2 bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1 h-14 px-8 text-lg rounded-xl">
            <Plus size={24} className="stroke-[3]" />
            Start Workout
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[100ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-barlow-condensed)] tracking-wide text-foreground">{workoutsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Total workouts</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[200ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Streak</CardTitle>
            <Flame className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-barlow-condensed)] tracking-wide text-emerald-500">{streak.current} <span className="text-lg font-normal tracking-normal opacity-70">days</span></div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[300ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Volume</CardTitle>
            <Dumbbell className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-barlow-condensed)] tracking-wide text-sky-500">{volumeThisWeek.toLocaleString()} <span className="text-lg font-normal tracking-normal opacity-70">kg</span></div>
            <p className="text-xs text-muted-foreground mt-1">Weight × Reps</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[400ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Workout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
            <div className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-barlow-condensed)] tracking-wide text-foreground">
              {streak.lastWorkoutDate ? (
                differenceInDays(now, streak.lastWorkoutDate) === 0 ? 'Today' :
                differenceInDays(now, streak.lastWorkoutDate) === 1 ? 'Yesterday' :
                `${differenceInDays(now, streak.lastWorkoutDate)}d ago`
              ) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {streak.lastWorkoutDate ? new Date(streak.lastWorkoutDate).toLocaleDateString() : 'Start logging!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Frequency Chart + Personal Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-Day Workout Frequency */}
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[450ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold font-[family-name:var(--font-barlow-condensed)] tracking-wide">Workout Frequency</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <WorkoutFrequencyChart data={dailyFrequency} />
          </CardContent>
        </Card>

        {/* Personal Records — Estimated 1RM */}
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[500ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold font-[family-name:var(--font-barlow-condensed)] tracking-wide">Personal Records</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Estimated 1RM</p>
            </div>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {personalRecords.length > 0 ? (
              <div className="space-y-3">
                {personalRecords.map((pr, i) => (
                  <Link
                    key={pr.exerciseName}
                    href={`/workouts/${pr.workoutId}`}
                    className="flex items-center justify-between group hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0
                          ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{pr.exerciseName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {pr.weight}kg × {pr.reps} reps
                          {pr.muscleGroup && <span className="ml-1.5 uppercase tracking-wider">• {pr.muscleGroup}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-lg font-[family-name:var(--font-barlow-condensed)] text-foreground tabular-nums">
                        {pr.estimated1RM}<span className="text-xs text-muted-foreground font-normal ml-0.5">kg</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Log strength workouts to see your estimated 1RM records here.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent workouts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground font-[family-name:var(--font-barlow-condensed)] tracking-wide">Recent Activity</h2>
          <Button variant="ghost" asChild className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
            <Link href="/workouts">View All</Link>
          </Button>
        </div>
        
        {recent5.length > 0 ? (
          <div className="grid gap-4">
            {recent5.map(workout => (
              <Link key={workout.id} href={`/workouts/${workout.id}`}>
                <Card className="bg-card hover:bg-card/80 transition-colors border-border shadow-sm group">
                  <div className="p-4 sm:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Dumbbell size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold sm:text-lg flex items-center gap-2 capitalize font-[family-name:var(--font-barlow-condensed)] tracking-wide">
                          {workout.type} Session
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {workout.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl font-[family-name:var(--font-barlow-condensed)]">{workout.workoutExercises.length}</div>
                      <div className="text-xs text-muted-foreground">Exercises</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border shadow-sm p-10 sm:p-14 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[500ms]">
            <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
              <div className="w-16 h-16 bg-muted/30 flex items-center justify-center rounded-full mb-6 relative">
                <Dumbbell size={32} className="text-foreground/70" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-background">
                  <Plus size={14} className="text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 font-[family-name:var(--font-barlow-condensed)] tracking-wide">No workouts yet</h3>
              <p className="mb-8 text-sm leading-relaxed">Your lifting journey starts here. Log your first workout to start tracking your progress and building your streak.</p>
              <Link href="/workouts/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto font-bold gap-2 bg-foreground text-background hover:bg-foreground/90 h-12 px-6 rounded-xl transition-all hover:-translate-y-0.5 shadow-md">
                  <Plus size={18} className="stroke-[3]" />
                  Log Your First Workout
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
