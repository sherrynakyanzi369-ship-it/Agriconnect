# AgriConnect

AgriConnect is a full-stack **Farm Management and Produce Marketplace**. Farmers create farm profiles, list produce with photos, and buyers browse, search, and order fresh produce directly from local farms.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Views:** EJS templating with `express-ejs-layouts`
- **Auth:** Session-based (`express-session`) + `bcryptjs` password hashing
- **Uploads:** `multer` for product/farm image uploads

## Features

- Role-based accounts: **FARMER**, **CUSTOMER**, **ADMIN**
- Farmer profiles (farm name, location, biography, contact info, certifications, photos)
- Product listings with category references, units (kg, crate, bunch, ...), price, stock, harvest date, and auto-managed **AVAILABLE / OUT_OF_STOCK** status
- Marketplace search & filters (keyword, category, farm, price range)
- Shopping cart model (customer, items, running total)
- Order placement with stock deduction and status tracking (**PENDING → CONFIRMED → DELIVERED**)
- Flash messages and custom error pages
- Multer image upload pipeline (type + size validated)

## Project Structure

```
FARM/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/               # Route handlers (auth, farm, product, order, home)
├── middleware/
│   ├── auth.js                # isAuthenticated / isFarmer / isCustomer / ensureGuest / ensureRole
│   ├── upload.js              # multer image config
│   ├── notfound.js            # 404 handler
│   └── errorHandler.js        # 500 handler
├── models/
│   ├── User.js                # FARMER / CUSTOMER / ADMIN accounts
│   ├── FarmerProfile.js       # farm profiles owned by users
│   ├── Category.js            # product categories (name, slug, description)
│   ├── Product.js             # marketplace listings linked to a farmer + category
│   ├── Cart.js / CartItem.js  # per-customer carts with line-item totals
│   └── Order.js               # orders with line items, shipping address + status
├── public/
│   ├── css/style.css
│   ├── js/main.js
│   └── uploads/               # uploaded images (gitignored)
├── routes/                    # Express routers (index, auth, farm, products, orders)
├── utils/
│   ├── helpers.js             # EJS view helpers (currency, image paths)
│   └── attachProfiles.js      # attach farmer profiles to product lists
├── views/                     # EJS templates + partials
├── .env.example               # environment template
├── package.json
├── server.js                  # app entry point
├── seed.js                    # creates default categories + optional admin
└── README.md
```

## Prerequisites

- **Node.js** v18 or newer
- **MongoDB** running locally (or a MongoDB Atlas URI)

## Getting Started

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file from the template:

   ```bash
   copy .env.example .env   # Windows
   # or
   cp .env.example .env     # macOS / Linux
   ```

3. Edit `.env` and set at least:

   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/farm_marketplace
   SESSION_SECRET=replace_with_a_long_random_string
   ```

4. Run the app:

   ```bash
   # production-style
   npm start

   # development with auto-restart on file changes
   npm run dev
   ```

5. Seed default categories (and optionally an admin account):

   ```bash
   # set ADMIN_EMAIL / ADMIN_PASSWORD in .env to also create an admin
   npm run seed
   ```

6. Open <http://localhost:3000>.

## Usage Walkthrough

1. **Register** an account (tick "I'm a farmer" to sell).
2. **Create your farm profile** at `/farm/create` (farmers only).
3. **List products** at `/products/new` with a photo, price, unit, stock, and harvest date.
4. **Browse & filter** the marketplace at `/products`.
5. **Place orders**; find them under *My Orders*, where status updates as shown in the order detail page.

## Environment Variables

| Variable          | Description                                  | Default                              |
| ----------------- | -------------------------------------------- | ------------------------------------ |
| `PORT`            | HTTP port for the Express server             | `3000`                               |
| `NODE_ENV`        | `development` or `production`                | `development`                        |
| `MONGO_URI`       | MongoDB connection string                    | `mongodb://127.0.0.1:27017/farm_marketplace` |
| `SESSION_SECRET`  | Secret used to sign session cookies          | *(required in production)*           |
| `MAX_FILE_SIZE_MB`| Max uploaded image size in megabytes          | `5`                                  |

## Notes

- Uploaded files are stored in `public/uploads` (ignored by git). Serve them via a CDN/s3 in a larger production deployment.
- For production, set `secure: true` on the session cookie (serve over HTTPS) and use a strong `SESSION_SECRET`.