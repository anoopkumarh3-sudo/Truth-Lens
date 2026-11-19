import React from 'react';
import { Sidebar } from '../components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  credits?: number | string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, credits }) => {
  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-md text-body-md min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar credits={credits} />
      <div className="pl-[248px] min-h-screen bg-surface-container-lowest">
        <main className="w-full min-h-screen pt-0 bg-surface-container-lowest">
          {children}
        </main>
      </div>
    </div>
  );
};
