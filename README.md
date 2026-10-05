# compass-next

Frontend for **Compass** — a furniture & home marketplace where stores (AGENT) sell products, members (USER) share
Room Tours with product pins and sell up to 5 used items, and ADMIN moderates.

Built on **Next.js 14 (pages router) · Apollo Client 3 · MUI 5 · SCSS · next-i18next (en / ko / uz)**,
following `NEXTJS-ARCHITECTURE-STANDARDS.md` (Nestar structure, Compass domain).

## Run

```bash
yarn
cp .env.example .env.development   # API on http://localhost:3007
yarn dev                           # http://localhost:3000
```

`compass-api` must be running (`npm run start:dev` in compass-api).

## Structure

```
apollo/            client.ts (auth + error links), store.ts (userVar), fragments.ts
  user/            query.ts, mutation.ts        — 36 documents, validated against the backend schema
  admin/           query.ts, mutation.ts
libs/
  auth/            logIn / signUp / logOut / updateUserInfo (minimal JWT → userVar)
  components/      layout (Main/Basic/Full/Admin HOCs), common cards, homepage, product,
                   room-tour (TaggedImage pins), mypage, admin
  enums/ types/    mirror of backend enums and DTOs
  hooks/           useRestoreAuth, useInquiry (?input=<json> in the URL)
  config.ts utils.ts sweetAlert.ts upload.ts
pages/             routes (below)
scss/              variables (design tokens), app.scss, pc/<page>/*.scss, MaterialTheme
public/locales/    en, ko, uz
```

## Routes

| Route | What |
|---|---|
| `/` | Room Tour gallery + search, categories, **Find your style** picker, product shelves (tabs), Room Tours feed, **Will it fit?** slider, Pre-loved, top stores, events |
| `/product` | Shop with filters, including **Fits my space** (max W/D/H or one of my rooms) |
| `/product/detail?id=` | Gallery, specs, **Will it fit?** check, Room Tours that tagged it, similar, comments |
| `/room-tour` · `/room-tour/detail?id=` | Room Tours; photos with product pins |
| `/community?category=` · `/community/detail?id=` | Q&A, Tips, Free talk |
| `/store` | Stores (AGENT) |
| `/member?memberId=` | Public profile: products, Room Tours, posts, follow |
| `/mypage?category=` | Listings, add product, posts, write (Room Tour tag editor), my rooms, favorites, recently viewed, follows, notifications, profile |
| `/account/join` | Login / sign up (USER or AGENT) |
| `/cs?tab=` | Notices, FAQ, events |
| `/_admin/users` · `products` · `community` · `cs` | Admin panel |

## Notes

- Apollo is pinned to `~3.13` because the standard's `onCompleted → setState` pattern is deprecated from 3.14.
- Images are served by the backend (`uploads/...`), so plain `<img>` is used on purpose.
