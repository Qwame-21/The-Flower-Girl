export const pages = {
 home: ['/', 'Thoughtful gifts & flowers in Accra', 'Explore gift hampers, fresh flowers and personalized gifts from The Gifting Factory by Flower Girl in Accra.'],
 about: ['/about', 'About us', 'Meet The Gifting Factory by Flower Girl and discover our approach to thoughtful gifting in Accra.'],
 services: ['/services', 'Gifting services', 'Explore gift wrapping, personalization and gifting services in Accra.'],
 gallery: ['/gallery', 'Gift gallery', 'Browse our gallery of flowers, hampers and thoughtful gift presentations.'],
 shop: ['/shop', 'Shop gifts & flowers', 'Browse flowers, hampers and personalized gifts. Availability and delivery are confirmed with your order.'],
 customize: ['/customize', 'Create a custom gift', 'Share your occasion, preferences and budget to request a personalized gift.'],
 careers: ['/careers', 'Careers', 'Explore career opportunities and apply to join The Gifting Factory team.'],
 track: ['/track', 'Track your order', 'Check the progress of your gift using your order tracking details.'],
 delivery: ['/delivery', 'Delivery & frequently asked questions', 'Find information about gift delivery, preparation and ordering in Accra.'],
 policy: ['/policy', 'Order policy', 'Read our ordering, approval and payment policies before placing your gift order.'],
};
export const pageForPath = path => Object.keys(pages).find(key => pages[key][0] === (path.replace(/\/$/, '') || '/')) || 'not-found';
export const brand = 'The Gifting Factory by Flower Girl';
