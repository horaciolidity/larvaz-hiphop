'use client';

import React from 'react';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { AdminDashboard } from '@/components/sponsors/dashboards';

export default function SponsorsAdminPage() {
  return (
    <div>
      <SponsorNav />
      <AdminDashboard />
    </div>
  );
}
