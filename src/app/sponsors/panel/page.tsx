'use client';

import React from 'react';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { BrandDashboard } from '@/components/sponsors/dashboards';

export default function SponsorsPanelPage() {
  return (
    <div>
      <SponsorNav />
      <BrandDashboard />
    </div>
  );
}
