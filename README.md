# The Gifting Factory storefront

Demo storefront for The Gifting Factory by Flower Girl. The interface is a React 19 and Vite application with an editorial monochrome design, responsive navigation, persistent cart and wishlist state, custom-order flows, careers application UI, and a Paystack-ready checkout boundary.

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

Copy `.env.example` to `.env` for local payment configuration. Never commit `.env` or a secret Paystack key. The browser may receive only a Paystack public key.

## Project memory

- [Approved design baseline](docs/STOREFRONT_MEMORY.md)
- [Recovery procedure](docs/RECOVERY.md)
- [Release verification checklist](docs/QA_CHECKLIST.md)

The protected Git history is the source of truth. Create a new verified commit after each approved design change instead of overwriting the last known-good revision.
