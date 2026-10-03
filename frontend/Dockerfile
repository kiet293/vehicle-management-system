FROM node:20-alpine

WORKDIR /app

# Cache node modules
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

EXPOSE 5173

# Run Vite dev server bound to 0.0.0.0 for container access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
