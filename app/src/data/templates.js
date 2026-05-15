export const TEMPLATES = {
  contract: [
    {
      id: 'web-dev',
      label_en: 'Web Developer',
      label_fr: 'Développeur web',
      data: {
        mission: 'Full-stack web application development including frontend, backend, and database design.',
        rateType: 'daily',
        durationUnit: 'weeks',
        deliverables: 'Technical specs, source code (GitHub repo), deployment, documentation.',
      },
    },
    {
      id: 'graphic-design',
      label_en: 'Graphic Designer',
      label_fr: 'Graphiste',
      data: {
        mission: 'Brand identity design including logo, colour palette, typography, and brand guidelines.',
        rateType: 'total',
        durationUnit: 'weeks',
        deliverables: 'Logo files (SVG, PNG, PDF), brand guidelines, social media kit.',
      },
    },
    {
      id: 'marketing',
      label_en: 'Marketing Consultant',
      label_fr: 'Consultant marketing',
      data: {
        mission: 'Digital marketing strategy, campaign planning, and performance tracking.',
        rateType: 'daily',
        durationUnit: 'months',
        deliverables: 'Strategy document, campaign briefs, monthly performance report.',
      },
    },
  ],

  devis: [
    {
      id: 'web-project',
      label_en: 'Web Project',
      label_fr: 'Projet web',
      data: {
        lines: [
          { id: 1, desc: 'UX design & wireframes', qty: 1, price: '2500' },
          { id: 2, desc: 'Frontend development', qty: 1, price: '4500' },
          { id: 3, desc: 'Backend & API integration', qty: 1, price: '3000' },
        ],
        vatRate: '20%',
        paymentTerms: 'net30',
      },
    },
    {
      id: 'brand-identity',
      label_en: 'Brand Identity',
      label_fr: 'Identité visuelle',
      data: {
        lines: [
          { id: 1, desc: 'Logo design (3 concepts)', qty: 1, price: '1800' },
          { id: 2, desc: 'Brand guidelines', qty: 1, price: '800' },
          { id: 3, desc: 'Social media templates', qty: 1, price: '600' },
        ],
        vatRate: '20%',
        paymentTerms: 'net30',
      },
    },
    {
      id: 'social-media',
      label_en: 'Social Media Mgmt',
      label_fr: 'Gestion réseaux sociaux',
      data: {
        lines: [
          { id: 1, desc: 'Content strategy & calendar', qty: 1, price: '500' },
          { id: 2, desc: 'Content creation (12 posts/month)', qty: 1, price: '1200' },
          { id: 3, desc: 'Community management', qty: 1, price: '600' },
        ],
        vatRate: '20%',
        paymentTerms: 'net30',
      },
    },
  ],

  legal: [
    {
      id: 'ecommerce',
      label_en: 'E-commerce',
      label_fr: 'E-commerce',
      data: {
        type: 'ltd',
        activity: 'Online retail store selling physical or digital products to consumers.',
        docs: ['tos', 'privacy', 'notice', 'cookies'],
      },
    },
    {
      id: 'saas',
      label_en: 'SaaS',
      label_fr: 'SaaS',
      data: {
        type: 'llc',
        activity: 'Software as a Service (SaaS) platform offering subscription-based tools.',
        docs: ['tos', 'privacy', 'cookies'],
      },
    },
    {
      id: 'freelance',
      label_en: 'Freelance Services',
      label_fr: 'Services freelance',
      data: {
        type: 'sole',
        activity: 'Independent freelance services including consulting, design, and development.',
        docs: ['tos', 'privacy', 'notice'],
      },
    },
  ],

  'linkedin-content': [
    {
      id: 'freelance-dev',
      label_en: 'Freelance Dev',
      label_fr: 'Dev freelance',
      data: {
        topic: 'How I went from €300/day to €900/day in 18 months without working more hours — the 3 mindset shifts that changed everything.',
        tone: 'storytelling',
        format: 'storytelling',
      },
    },
    {
      id: 'designer',
      label_en: 'Designer',
      label_fr: 'Designer',
      data: {
        topic: 'Why most freelance designers undercharge — and the exact framework I use to price projects based on value, not hours.',
        tone: 'expert',
        format: 'liste',
      },
    },
    {
      id: 'business-coach',
      label_en: 'Business Coach',
      label_fr: 'Coach business',
      data: {
        topic: "The 5 questions I ask every new client before we start — and why they always say it's the best discovery call they've had.",
        tone: 'direct',
        format: 'liste',
      },
    },
  ],

  prospection: [
    {
      id: 'web-agency',
      label_en: 'Web Agency',
      label_fr: 'Agence web',
      data: {
        niche: 'Full-stack web development and design agency',
        target: 'E-commerce businesses with outdated websites looking to increase online sales and conversions.',
        channel: 'LinkedIn DM',
        tone: 'Professional',
        pain: 'Poor mobile experience and slow loading speed causing high bounce rates.',
      },
    },
    {
      id: 'consultant',
      label_en: 'Consultant',
      label_fr: 'Consultant',
      data: {
        niche: 'Business strategy and operations consultant',
        target: 'SME founders with 10-50 employees struggling to scale operations and manage growing teams.',
        channel: 'Email',
        tone: 'Direct',
        pain: 'Founders spending too much time on operations instead of strategy.',
      },
    },
    {
      id: 'coach',
      label_en: 'Coach',
      label_fr: 'Coach',
      data: {
        niche: 'Executive and leadership coaching for managers',
        target: 'Newly promoted managers at tech companies feeling underprepared for leadership responsibilities.',
        channel: 'LinkedIn DM',
        tone: 'Casual',
        pain: 'Imposter syndrome and lack of confidence in managing people.',
      },
    },
  ],
};
