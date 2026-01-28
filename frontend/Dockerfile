FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app files
COPY . .

# Build argument for API URL (must be available during build)
ARG NEXT_PUBLIC_API_URL=https://truckflow.site/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build for production
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
