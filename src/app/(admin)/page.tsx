import type { Metadata } from "next";
import React from "react";
import DashboardStats from "@/components/admin/DashboardStats";
import RecentApplicationsTable from "@/components/admin/RecentApplicationsTable";
import { DashboardDataProvider } from "@/context/DashboardDataContext";

export const metadata: Metadata = {
  title: "Admin Dashboard | Nuvisa Admin System",
  description: "Comprehensive admin dashboard for managing applications and users",
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Welcome to Nuvisa Admin Dashboard
        </p>
      </div>

      <DashboardDataProvider>
        <DashboardStats />

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12">
            <RecentApplicationsTable />
          </div>
        </div>
      </DashboardDataProvider>
    </div>
  );
}
