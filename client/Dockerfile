FROM node:22-alpine


WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

