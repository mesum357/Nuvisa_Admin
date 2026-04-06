"use client";

import React from 'react';
import CheckoutContentForm from '@/components/admin/general-content/CheckoutContentForm';
import PriceContentForm from '@/components/admin/general-content/PriceContentForm';
import OccasionContentForm from '@/components/admin/general-content/OccasionContentForm';
import VisaSolutionContentForm from '@/components/admin/general-content/VisaSolutionContentForm';
import ContactContentForm from '@/components/admin/general-content/ContactContentForm';
import UrgentContentForm from '@/components/admin/general-content/UrgentContentForm';
import MoreToLoveContentForm from '@/components/admin/general-content/MoreToLoveContentForm';

export default function GeneralContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Content</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          A general page for dynamic content sections. You can add more forms here later.
        </p>
      </div>

      <CheckoutContentForm />
      <OccasionContentForm />
      <VisaSolutionContentForm />
      <ContactContentForm />
      <UrgentContentForm />
      <MoreToLoveContentForm />
      {/* <PriceContentForm /> */}
    </div>
  );
}
