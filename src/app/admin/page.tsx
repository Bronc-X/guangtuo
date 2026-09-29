import type {Metadata} from 'next';

import AdminConsole from '@/components/admin-console';

export const metadata: Metadata = {
  title: '网站后台 | 修齐生物',
  robots: {index: false, follow: false}
};

export default function AdminPage() {
  return <AdminConsole />;
}
