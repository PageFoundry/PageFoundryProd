export const productDisplayInfo = {
landing_page: {
title: "Landing Page",
desc: "A high-performing, modern, and aesthetic landing page optimized for maximum conversion.",
from: "from €499",
},
landing_page_hosting: {
title: "Landing Page Hosting",
desc: "We host your existing landing page. Choose with or without domain management.",
from: "from €19/month",
},
all_inclusive: {
title: "All-Inclusive Package",
desc: "Landing Page, Hosting, Domain, Basic SEO & Google Indexing – all included.",
from: "from €799",
},
seo_basic: {
title: "SEO Basic",
desc: "Technical and content-based optimization for better visibility in search engines.",
from: "from €199",
},
seo_advanced: {
title: "SEO Advanced",
desc: "Advanced SEO analysis, keyword strategy & long-term performance optimization.",
from: "from €499",
},
speed_opt: {
title: "Speed Optimization",
desc: "Boost your website speed for optimal user experience and top Google rankings.",
from: "from €149",
},
maintenance: {
title: "Maintenance Subscription",
desc: "Monthly maintenance, backups, security updates & continuous performance checks.",
from: "from €39/month",
},
request_offer: {
title: "Request Offer",
desc: "Custom scope or bundle. Ideal for unique requirements.",
from: "On request",
},
free_consultation: {
title: "Free Consultation",
desc: "Talk to us. Get clarity on strategy, timelines, and budget.",
from: "Free",
},
} as const;


export type ProductKey = keyof typeof productDisplayInfo;


export const productOrderKeys: ProductKey[] = [
"landing_page",
"landing_page_hosting",
"all_inclusive",
"seo_basic",
"seo_advanced",
"speed_opt",
"maintenance",
"request_offer",
"free_consultation",
];