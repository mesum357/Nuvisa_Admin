import type { FAQ } from '@prisma/client';

/** API / UI shape (legacy snake_case for featured flag). */
export type FaqApiRecord = FAQ & {
  is_featured: boolean;
};

export function resolveTabName(
  faqType?: string | null,
  category?: string | null
): string | null {
  const tab = (faqType || category || '').trim();
  return tab || null;
}

export function formatFaqForApi(faq: FAQ): FaqApiRecord {
  const tab = resolveTabName(faq.faqType, faq.category);
  return {
    ...faq,
    category: faq.category || tab,
    faqType: faq.faqType || faq.category || tab,
    faqTypeCreatedAt: faq.faqTypeCreatedAt ?? faq.createdAt,
    is_featured: faq.isFeatured,
  };
}

export function formatFaqsForApi(faqs: FAQ[]): FaqApiRecord[] {
  return faqs.map(formatFaqForApi);
}

export function buildFaqCreateData(input: {
  question: string;
  answer: string;
  category?: string | null;
  faqType?: string | null;
  order?: number;
  isActive?: boolean;
  is_featured?: boolean;
  faqTypeCreatedAt?: Date | null;
  updatedBy?: string | null;
}) {
  const tab = resolveTabName(input.faqType, input.category);
  return {
    question: input.question.trim(),
    answer: input.answer.trim(),
    category: (input.category || tab || '').trim() || null,
    faqType: tab,
    order: input.order ?? 0,
    isActive: input.isActive ?? true,
    isFeatured: input.is_featured ?? true,
    faqTypeCreatedAt: input.faqTypeCreatedAt ?? new Date(),
    updatedBy: input.updatedBy ?? null,
  };
}

export function buildFaqUpdateData(
  data: Record<string, unknown>,
  extras?: Record<string, unknown>
) {
  const update: Record<string, unknown> = { ...extras };

  if (typeof data.question === 'string') update.question = data.question.trim();
  if (typeof data.answer === 'string') update.answer = data.answer.trim();
  if (typeof data.order === 'number') update.order = data.order;
  if (typeof data.isActive === 'boolean') update.isActive = data.isActive;

  if (Object.prototype.hasOwnProperty.call(data, 'is_featured')) {
    update.isFeatured = Boolean(data.is_featured);
  }

  const hasFaqType = Object.prototype.hasOwnProperty.call(data, 'faqType');
  const hasCategory = Object.prototype.hasOwnProperty.call(data, 'category');

  if (hasFaqType || hasCategory) {
    const tab = resolveTabName(
      hasFaqType ? (data.faqType as string | null) : undefined,
      hasCategory ? (data.category as string | null) : undefined
    );
    update.faqType = tab;
    if (hasCategory || tab) {
      update.category = ((data.category as string) || tab || '').trim() || null;
    }
  }

  return update;
}

export function applyFeaturedFilter(
  where: Record<string, unknown>,
  isFeatured: string | null
) {
  if (isFeatured === 'true') where.isFeatured = true;
  if (isFeatured === 'false') where.isFeatured = false;
}
