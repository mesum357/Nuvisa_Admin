"use client";

import React from "react";
import PriceMatchContentForm from "@/components/admin/general-content/PriceMatchContentForm";
import { GeneralContentProvider } from "@/context/GeneralContentContext";

export default function PriceMatchContentPage() {
  return (
    <GeneralContentProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Price Match Promise
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Edit the guarantee section on the homepage (above the footer).
          </p>
        </div>
        <PriceMatchContentForm />
      </div>
    </GeneralContentProvider>
  );
}
