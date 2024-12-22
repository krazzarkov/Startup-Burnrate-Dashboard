# Startup Burnrate Dashboard

## Overview

The **Startup Burnrate Dashboard** is a Next.js 14 application using ShadCN designed to provide startups with an intuitive and customizable interface to track and manage their financial burn rate. This project uses SQLite for the database and is optimized for deployment using Docker instead of Vercel as I made a mistake thinking Vercel would support SQLLite. However, with a few small changes to this code, a Postgres or other database can be integrated, allowing this web app to be deployed on Vercel. 

---

## Features

* **Dashboard**: Get an overview of your startup's capital, burnrate, and remaining runway
* **Assets**: Add assets and capital obtained over time with custom category support (pre-seed, seed, series A, etc.)
* **Revenue**: Add monthly revenue which will be used to offset monthly burnrate
* **Spending**: Add monthly spending, use "Advanced Mode" to upload CSVs and track spending transactions on a monthly basis
* **Forecast**: Simulate how future predicted expenses (new hires, marketing campaigns, legal costs, etc.) will impact your runway
* **Password Protected**: Define a password in your .env to ensure only you can access your deployed web app

---

## Getting Started

These instructions will help you set up the project on your local machine for development and testing purposes.

### Prerequisites

- **Node.js 18+**
- **Docker**
- **SQLite**

---

### Environment Variables:

Create a `.env.local` file in the root directory and configure the following:

```env
DASHBOARD_PASSWORD = <your_password_here>
NODE_ENV=production
```

---

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

### Docker Setup

The application is designed to be run with Docker for easy deployment.

#### Build the Docker image:

```bash
docker build -t startup-burnrate-dashboard .
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

### Scripts

#### Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the application in production mode.
- `npm run lint`: Lints the codebase.

---

### Deployment

To deploy this repository as is, you will need to use Docker. A handy Dockerfile has already been provided.

---

## Built With

- [Next.js 14](https://nextjs.org/) - The React Framework for Production
- [SQLite](https://www.sqlite.org/) - Lightweight Database
- [Docker](https://www.docker.com/) - Containerization Platform

---

## Contributing

We welcome contributions! Please fork the repository and submit a pull request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
