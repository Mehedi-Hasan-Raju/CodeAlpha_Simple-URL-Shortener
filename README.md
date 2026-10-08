# 🔗 Simple URL Shortener

A simple and fast URL shortener built with **Node.js**, **Express.js** and **MongoDB Atlas**. It converts long URLs into short, shareable links and redirects visitors to the original URL when the short link is opened.

> This project was developed as part of my **CodeAlpha Internship**.

---

## 📌 Features

- **Shorten URLs:** accepts a long URL and generates a unique short code
- **Redirect:** opening the short URL takes the user to the original long URL
- **Database storage:** the short code to original URL mapping is stored in MongoDB Atlas
- **Custom alias:** choose your own short code (e.g. `/my-portfolio`) instead of a random one
- **Expiry dates:** links can expire automatically after a set number of days (MongoDB TTL index)
- **Rate limiting:** limits requests per IP on the shorten endpoint to prevent abuse
- **Click tracking:** counts how many times each short link has been visited
- **URL validation:** only valid `http` / `https` URLs are accepted
- **Duplicate handling:** the same URL returns the existing short code, and code collisions are retried automatically
- **Basic frontend:** a simple web page to shorten URLs from the browser

---

## 🛠️ Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Backend   | Node.js, Express.js         |
| Database  | MongoDB Atlas, Mongoose     |
| Security  | express-rate-limit          |
| Frontend  | HTML, CSS, JavaScript       |
| Config    | dotenv                      |

---

## 📁 Project Structure

```
url-shortener/
├── models/
│   └── Url.js            # Mongoose schema (shortCode, originalUrl, clicks, expiresAt)
├── routes/
│   └── urlRoutes.js      # Shorten API + redirect route
├── public/
│   └── index.html        # Basic frontend
├── server.js             # App entry point, DB connection, rate limiter
├── .env                  # Environment variables (not committed)
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account with a free cluster

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd url-shortener
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up MongoDB Atlas

1. Create a free cluster (M0) on MongoDB Atlas.
2. Go to **Database Access** and create a database user.
3. Go to **Network Access** and add your IP address (or `0.0.0.0/0` for development).
4. Click **Connect → Drivers** and copy the connection string.

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/urlshortener?retryWrites=true&w=majority
BASE_URL=http://localhost:3000
```

> `urlshortener` is the database name. It is created automatically on first use, along with the `urls` collection.

### 5. Run the server

```bash
# Development (auto-restart)
npm run dev

# Production
node server.js
```

If everything is set up correctly you will see:

```
MongoDB connected
Server running on port 3000
```

Open `http://localhost:3000` in your browser to use the frontend.

---

## 📡 API Documentation

### `POST /api/shorten`

Creates a short URL.

**Request body**

| Field           | Type   | Required | Description                                          |
|-----------------|--------|----------|------------------------------------------------------|
| `url`           | string | Yes      | The long URL (must start with `http://` or `https://`) |
| `alias`         | string | No       | Custom short code (3-30 chars: letters, numbers, `-`, `_`) |
| `expiresInDays` | number | No       | Number of days until the link expires (1-365)        |

**Example request**

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/some/very/long/link","alias":"my-link","expiresInDays":7}'
```

**Example response** `201 Created`

```json
{
  "shortCode": "my-link",
  "shortUrl": "http://localhost:3000/my-link",
  "originalUrl": "https://example.com/some/very/long/link",
  "expiresAt": "2026-10-15T10:30:00.000Z"
}
```

**Error responses**

| Status | Meaning                                              |
|--------|------------------------------------------------------|
| `400`  | Invalid URL, invalid alias, or invalid expiry value  |
| `409`  | Custom alias is already taken                        |
| `429`  | Too many requests (rate limit exceeded)              |
| `500`  | Server error                                         |

### `GET /:shortCode`

Redirects to the original URL and increments the click counter.

```
GET http://localhost:3000/my-link  →  302 redirect to https://example.com/some/very/long/link
```

Returns `404` if the short code does not exist or has expired.

---

## ⚙️ How It Works

1. The user submits a long URL (optionally with a custom alias and expiry).
2. The server validates the input and generates a random 7-character code (or uses the custom alias).
3. The mapping `shortCode → originalUrl` is saved in MongoDB. A unique index guarantees no two links share a code.
4. When someone visits `/:shortCode`, the server looks up the code, checks it has not expired, increments the click count, and redirects to the original URL.
5. Expired links are removed automatically by a MongoDB TTL index. The redirect route also checks expiry directly, so an expired link stops working immediately.

---

## 🔒 Rate Limiting

The `/api/shorten` endpoint is limited to **10 requests per minute per IP**. Redirects are not rate limited, so normal visitors clicking short links are never blocked.

---

## 🔮 Future Improvements

- User accounts and a dashboard to manage links
- Analytics (clicks over time, referrers, devices)
- QR code generation for short links
- Deployment with a custom domain

---



---

## 🙏 Acknowledgements

This project was built as a task during my internship at **CodeAlpha**. Thanks to CodeAlpha for the opportunity to learn and build real-world backend projects.
