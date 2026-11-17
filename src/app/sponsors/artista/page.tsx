'use client';

import React from 'react';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { ArtistDashboard } from '@/components/sponsors/dashboards';

export default function SponsorsArtistPage() {
  return (
    <div>
      <SponsorNav />
      <ArtistDashboard />
    </div>
  );
}
