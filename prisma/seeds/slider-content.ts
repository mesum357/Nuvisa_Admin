import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSliderContent() {
  const data = [
    // Badges (match frontend keys)
    { key: 'badge_1_text', value: '99.7% Visa approval', type: 'text', section: 'badges', order: 1 },
    { key: 'badge_2_text', value: '100% Risk free', type: 'text', section: 'badges', order: 2 },
    { key: 'nri_badge_text', value: '765+ NRIs applied their Schengen visa today on NUvisa', type: 'text', section: 'badges', order: 3 },

    // Notices
    { key: 'embassy_notice_text', value: 'Please note that embassy require you to pay £78 in person to a government official, either by cash or card.', type: 'text', section: 'notices', order: 1 },
    { key: 'urgent_note_text', value: '*If require urgent appointment in 4-5 days kindly email support@nuvisa.co.uk do not follow the standard visa process.', type: 'text', section: 'notices', order: 2 },
    { key: 'free_offer_banner_text', value: 'Free Auto-booking appointment and concierge assistance ends soon - Until Jan 2026.', type: 'text', section: 'notices', order: 3 },

    // Slots (match frontend keys)
    { key: 'slot1_label', value: 'Sep slots', type: 'text', section: 'slider', order: 1 },
    { key: 'slot1_status', value: 'Sold out', type: 'text', section: 'slider', order: 2 },
    { key: 'slot2_label', value: 'October slots', type: 'text', section: 'slider', order: 3 },
    { key: 'slot2_status', value: 'Last few left!', type: 'text', section: 'slider', order: 4 },
    { key: 'slot3_label', value: 'November slots', type: 'text', section: 'slider', order: 5 },
    { key: 'slot3_status', value: '65% reserved', type: 'text', section: 'slider', order: 6 },
  ];

  for (const item of data) {
    await prisma.sliderContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
}


