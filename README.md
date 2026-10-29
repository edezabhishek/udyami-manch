# Udyami Manch

**Your people. Your market.**

A worldwide directory of businesses owned and run by Nepalis and Indians. Find a shop, a restaurant, a tradie or a service owned by someone from your community, wherever you live.

We start in **New Zealand**, then Australia, then the rest of the world once it works.

## What it does

- **Directory.** Browse and search businesses by country, city, category and community. Save the ones you like.
- **List your business.** Anyone can add a listing. New listings are reviewed before they go public.
- **Udyami of the Month.** A monthly spotlight on one business, chosen from community nominations.
- **Online events.** Webinars, workshops and meetups. Times show in your own timezone, and the join link appears once you register.
- **World map.** See where Nepali and Indian businesses are, country by country.
- **Jobs board** (coming soon). Open to everyone.

## Run it

You need Node 22.

```bash
npm install
npm run build --workspace=shared
npm run dev
```

Or with Docker:

```bash
docker compose up -d
```

Open http://localhost:3000 and create the first account. The first account becomes the admin.

## Built on TREK

Udyami Manch is built on [TREK](https://github.com/liketrek/TREK), an open source trip planner by Maurice Boe and contributors. We use its app framework and have replaced the product on top of it. TREK is licensed under AGPL-3.0, and so is this project. Full credit and third party data notices are in [NOTICE.md](NOTICE.md).

## Licence

[AGPL-3.0](LICENSE). If you run a modified version as a public service, you must share your source code.

## Contact

Abhishek Prasai, founder. Instagram and other platforms: @edezabhishek
