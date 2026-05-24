import { Activity, BarChart3, Bot, FileText, Gauge, Library, Map, UploadCloud } from 'lucide-react';
import type { TabId } from './model';

export const commandCenterTabs: Array<{ id: TabId; label: string; help: string; icon: typeof Gauge }> = [
  { id: 'dashboard', label: 'Home', help: 'Command Center', icon: Gauge },
  { id: 'sources', label: 'Build Intelligence', help: 'Enter Sources', icon: UploadCloud },
  { id: 'matrix', label: 'Advantage Matrix', help: 'Capability Comparison', icon: BarChart3 },
  { id: 'map', label: 'Growth Map', help: 'Market Opportunity', icon: Map },
  { id: 'library', label: 'Intelligence Library', help: 'Built Outputs', icon: Library },
  { id: 'strategy', label: 'Strategy', help: 'Growth plays', icon: BarChart3 },
  { id: 'coach', label: 'AI Coach', help: 'Ask the system', icon: Bot },
  { id: 'report', label: 'Executive Report', help: 'Leadership output', icon: FileText },
  { id: 'system', label: 'System Health', help: 'Diagnostics', icon: Activity }
];
