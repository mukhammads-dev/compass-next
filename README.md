# compass-next

Frontend for **Compass** — a furniture & home marketplace where stores (AGENT) sell products, members (USER) share
Room Tours with product pins and sell up to 5 used items, and ADMIN moderates.

Built on **Next.js 14 (pages router) · Apollo Client 3 · MUI 5 · SCSS · next-i18next (en / ko / uz)**.

## Run

```bash
yarn
cp .env.example .env.development   # API on http://localhost:3007
yarn dev                           # http://localhost:3000
```

`compass-api` must be running (`npm run start:dev` in compass-api).

## Structure

```
apollo/            client.ts (auth + error links), store.ts (userVar, chat vars), socket.ts (live chat), fragments.ts
  user/            query.ts, mutation.ts        — 36 documents, validated against the backend schema
  admin/           query.ts, mutation.ts
libs/
  auth/            logIn / signUp / logOut / updateUserInfo (minimal JWT → userVar)
  components/      Top, Footer, Chat · layout (Home/Basic/Full/Admin HOCs), common cards, homepage, product,
                   room-tour (TaggedImage pins), mypage, admin
  enums/ types/    mirror of backend enums and DTOs
  hooks/           useRestoreAuth, useInquiry (?input=<json> in the URL), useChatSocket
  config.ts utils.ts sweetAlert.ts upload.ts
pages/             routes (below)
scss/              variables.scss (tokens), app.scss, pc/main.scss → general.scss, common/*, <page>/<page>.scss
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

## Deploy

```bash
# 1. point the app at the deployed compass-api (values are baked in at build time)
#    .env.production → REACT_APP_API_URL, REACT_APP_API_GRAPHQL_URL, REACT_APP_API_WS (wss:// behind HTTPS)
yarn install --frozen-lockfile
yarn build
yarn start                         # next start -p 3000
```

- Run `yarn start` under a process manager (e.g. `pm2 start yarn --name compass-next -- start`) behind a reverse proxy.
- The API must allow this origin (CORS) and its proxy must forward WebSocket upgrades for the live chat.

## Notes

- Apollo is pinned to `~3.13` because the `onCompleted → setState` pattern used across pages is deprecated from 3.14.
- Images are served by the backend (`uploads/...`), so plain `<img>` is used on purpose.
