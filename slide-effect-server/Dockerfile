FROM node:20-alpine

WORKDIR /app

# Install dependencies (including devDependencies for tsx)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3003

# Start
CMD ["npm", "start"]
