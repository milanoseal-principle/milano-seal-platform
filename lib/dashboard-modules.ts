export interface DashboardModule {
  name: string
  route: string
  icon: string
  description: string
  group: string
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  // CORE
  { name: 'Command Center', route: 'deals',        icon: 'LayoutGrid',    description: 'Every matter, every dollar, every step', group: 'Core' },
  { name: 'KPI Dashboard',  route: 'kpi',          icon: 'BarChart3',     description: 'Revenue, pipeline, system health',        group: 'Core' },
  { name: 'Clients',        route: 'clients',       icon: 'Users',         description: 'Lifetime value & relationship intel',     group: 'Core' },
  // PIPELINE
  { name: 'Leads',          route: 'leads',         icon: 'Funnel',        description: 'Inbound + outbound acquisition',          group: 'Pipeline' },
  { name: 'Prospects',      route: 'prospects',     icon: 'Search',        description: 'Google extraction engine',                group: 'Pipeline' },
  { name: 'Forecast',       route: 'forecast',      icon: 'TrendingUp',    description: 'Stage probability & revenue projection',  group: 'Pipeline' },
  { name: 'Financials',     route: 'financials',    icon: 'DollarSign',    description: 'Deal revenue, cost & profitability',      group: 'Pipeline' },
  // EXECUTION
  { name: 'Apostille',      route: 'apostille',     icon: 'Stamp',         description: 'Apostille submission tracker',            group: 'Execution' },
  { name: 'Pricing',        route: 'pricing',       icon: 'Tag',           description: 'Internal pricing engine — do not share',  group: 'Execution' },
  { name: 'Intelligence',   route: 'intelligence',  icon: 'Lightbulb',     description: 'High-value bundle & market intel',        group: 'Execution' },
  { name: 'Runbook',        route: 'runbook',       icon: 'ClipboardList', description: 'Daily & weekly operator playbook',        group: 'Execution' },
  // OUTREACH
  { name: 'Scripts',        route: 'scripts',       icon: 'MessageSquare', description: 'Inbound response scripts by channel',     group: 'Outreach' },
  { name: 'Emails',         route: 'emails',        icon: 'Mail',          description: 'Stage-by-stage email templates',         group: 'Outreach' },
  { name: 'Referral',       route: 'referral',      icon: 'Share2',        description: 'Attorney & partner referral engine',      group: 'Outreach' },
  { name: 'Reviews',        route: 'reviews',       icon: 'Star',          description: 'Post-completion reputation system',       group: 'Outreach' },
  // GROWTH
  { name: 'Content',        route: 'content',       icon: 'FileText',      description: 'Authority content & social pipeline',    group: 'Growth' },
  { name: 'Ads',            route: 'ads',           icon: 'Megaphone',     description: 'Paid acquisition performance',           group: 'Growth' },
  { name: 'SEO',            route: 'seo',           icon: 'Globe',         description: 'KG SEO map — page generation matrix',    group: 'Growth' },
  { name: 'Automation',     route: 'automation',    icon: 'Zap',           description: 'Trigger rules & automation engine',      group: 'Growth' },
  // INTELLIGENCE
  { name: 'Countries',      route: 'countries',     icon: 'Map',           description: 'Global apostille intelligence database',  group: 'Intelligence' },
  { name: 'Documents',      route: 'documents',     icon: 'BookOpen',      description: 'Global document classification system',  group: 'Intelligence' },
  { name: 'Lanes',          route: 'lanes',         icon: 'Route',         description: 'Execution routing by destination',       group: 'Intelligence' },
  { name: 'Compliance',     route: 'compliance',    icon: 'Shield',        description: 'License & renewal alert engine',         group: 'Intelligence' },
  // SYSTEM
  { name: 'Legal',          route: 'legal',         icon: 'Scale',         description: 'Entity, banking & compliance records',   group: 'System' },
  { name: 'Credentials',    route: 'credentials',   icon: 'Lock',          description: 'Platform logins — operator only',        group: 'System' },
  { name: 'Ideas',          route: 'ideas',         icon: 'Sparkles',      description: 'Product, revenue & system upgrades',     group: 'System' },
  { name: 'Assets',         route: 'assets',        icon: 'FolderOpen',    description: 'Drive folder index & asset map',         group: 'System' },
]

export const MODULE_GROUPS = ['Core', 'Pipeline', 'Execution', 'Outreach', 'Growth', 'Intelligence', 'System']
