import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { GrainOverlay } from '../ui/GrainOverlay';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="min-h-screen bg-base text-primary">
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <Topbar onMenu={() => setMenu(true)} />
      <main className="pt-16 md:pl-[240px]">
        <div className="mx-auto max-w-[1400px] p-5 md:p-10"><Outlet /></div>
      </main>
      <GrainOverlay />
    </div>
  );
}
