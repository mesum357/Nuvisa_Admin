"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { apiClient } from "@/lib/api-client";
import { useContentByKey } from "@/context/GeneralContentContext";

const PRICE_MATCH_TITLE_KEY = "price_match_title";
const PRICE_MATCH_DESCRIPTION_KEY = "price_match_description";
const PRICE_MATCH_TOOLTIP_KEY = "price_match_tooltip";

const DEFAULT_TITLE = "The NUvisa Price Match Promise";
const DEFAULT_DESCRIPTION =
  "At NUvisa, we want you to get your Schengen visa with total confidence, that's why we regularly review our prices. In fact, we promise to match any like-for-like Schengen visa price, so you can apply with peace of mind.";
const DEFAULT_TOOLTIP =
  "We pride ourselves on our fair prices, expertise, and simplicity. Meaning you won't find better value elsewhere, thanks to our unbeatable prices. Find it cheaper, and we'll match the price — that's a promise.";

export default function PriceMatchContentForm() {
  const { byKey, rows, loading, refresh } = useContentByKey();
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [tooltip, setTooltip] = useState(DEFAULT_TOOLTIP);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (loading) return;

    const titleRow = byKey[PRICE_MATCH_TITLE_KEY];
    const descriptionRow = byKey[PRICE_MATCH_DESCRIPTION_KEY];
    const tooltipRow = byKey[PRICE_MATCH_TOOLTIP_KEY];

    setTitle(titleRow?.value || DEFAULT_TITLE);
    setDescription(descriptionRow?.value || DEFAULT_DESCRIPTION);
    setTooltip(tooltipRow?.value || DEFAULT_TOOLTIP);

    const updatedTimes = [titleRow?.updatedAt, descriptionRow?.updatedAt, tooltipRow?.updatedAt]
      .filter(Boolean)
      .map((date) => new Date(date as Date).getTime());
    setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
  }, [loading, rows, byKey]);

  const handleUpdate = async () => {
    setSaving(true);
    setStatusMessage(null);

    const payloads = [
      { key: PRICE_MATCH_TITLE_KEY, value: title.trim() },
      { key: PRICE_MATCH_DESCRIPTION_KEY, value: description.trim() },
      { key: PRICE_MATCH_TOOLTIP_KEY, value: tooltip.trim() },
    ];

    const responses = await Promise.all(
      payloads.map(({ key, value }) =>
        apiClient.post("/content", { key, value, type: "text" })
      )
    );

    if (responses.every((response) => response.success)) {
      await refresh({ silent: true });
      setStatusMessage({
        type: "success",
        text: "Saved. The homepage guarantee section updates within a few seconds.",
      });
    } else {
      const firstError = responses.find((response) => !response.success)?.error;
      setStatusMessage({
        type: "error",
        text:
          firstError ||
          "Failed to update price match content. Sign in again if your session expired.",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading price match content...
        </div>
      </div>
    );
  }

  return (
    <ComponentCard
      title="Price Match Promise"
      desc="Homepage guarantee block (title, body copy, and info icon tooltip)."
    >
      <div id="price-match-promise" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Section title
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={DEFAULT_TITLE}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={DEFAULT_DESCRIPTION}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Info icon tooltip
          </label>
          <textarea
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={tooltip}
            onChange={(e) => setTooltip(e.target.value)}
            placeholder={DEFAULT_TOOLTIP}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Shown when visitors hover or tap the (i) icon next to the title.
          </p>
        </div>

        {statusMessage && (
          <p
            className={
              statusMessage.type === "success"
                ? "text-sm text-green-600 dark:text-green-400"
                : "text-sm text-red-600 dark:text-red-400"
            }
            role="status"
          >
            {statusMessage.text}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </ComponentCard>
  );
}
