import { Breadcrumb } from '@/components/breadcrumb';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Activity } from 'lucide-react';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getMonthlyFrequency } from '@/db/queries/stats';
import { WorkoutHistoryChart } from '@/components/workout-history-chart';

export default async function SettingsPage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect('/sign-in');
  }

  const [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId));
  if (!dbUser) {
    redirect('/'); // User profile missing, main app protects against this
  }

  // Fetch exactly what we need for the history chart
  const historyData = await getMonthlyFrequency(dbUser.id, 6);

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Settings' }]} />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Workout History Chart */}
        <div className="bg-card border border-border rounded-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground font-[family-name:var(--font-barlow-condensed)] tracking-wide">
                Workout History
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">Your training output over the last 6 months</p>
            </div>
            <Activity className="h-5 w-5 text-orange-500" />
          </div>
          <WorkoutHistoryChart data={historyData} />
        </div>

        {/* Account Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Account Settings</h2>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Preferences</h2>
          <p className="text-muted-foreground">Customize your LiftingDiary experience</p>
        </div>

        {/* Privacy & Security */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Privacy & Security</h2>
          <p className="text-muted-foreground">Manage your privacy and security settings</p>
        </div>
      </div>
    </div>
  );
}
