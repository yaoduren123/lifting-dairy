import { Breadcrumb } from '@/components/breadcrumb';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Settings' }]} />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
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
