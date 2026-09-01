import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Settings, Shield, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <PageContainer
      badge="Route: /settings"
      title="Platform Settings & Preferences"
      subtitle="Manage profile settings, security policies, API integrations, and notification thresholds."
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card variant="glass" header={<span className="font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-400" /> Account Profile</span>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Display Name" defaultValue="Alex Mercer" />
            <Input label="Email Address" defaultValue="alex@asklytix.ai" />
            <Input label="Role / Title" defaultValue="Lead Data Analyst" />
            <Input label="Workspace Name" defaultValue="Growth Analytics Team" />
          </div>
        </Card>

        <Card variant="glass" header={<span className="font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-purple-400" /> Security & AI Governance</span>}>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div>
                <span className="font-bold text-white block">Strict Data Isolation</span>
                Ensure raw dataset entries are never passed to external AI models without encryption.
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div>
                <span className="font-bold text-white block">Two-Factor Authentication (2FA)</span>
                Add an extra layer of security to your analytics account.
              </div>
              <Button variant="outline" size="sm">Configure 2FA</Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button variant="primary" leftIcon={<Save className="w-4 h-4" />}>
            Save Preferences
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
