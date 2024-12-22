# Use a Node image with a full Linux distribution
FROM node:18-bullseye-slim AS builder

# Install dependencies required for SQLite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Rebuild SQLite3 for the current environment
RUN npm rebuild sqlite3

# Build the Next.js application
RUN NEXT_PUBLIC_DOCKER_BUILD=true npm run build

# Start a new stage for a smaller final image
FROM node:18-bullseye-slim

# Set the working directory in the container
WORKDIR /app

# Copy built node modules and Next.js build output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/middleware.ts ./middleware.ts
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/components.json ./components.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/app ./app
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/components ./components


# Create data directories and set permissions
RUN mkdir -p /app/data /home/data && \
    chown -R node:node /app /home/data

# Expose the port the app runs on
EXPOSE 3000

# Switch to non-root user
USER node

# Define the command to run the app
CMD ["node", "server.js"]

