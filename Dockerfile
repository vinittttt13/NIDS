# Frontend container: builds the Vite app, then serves it with `vite preview`.
# This matches the project's existing `npm run preview` workflow rather than
# introducing a separate nginx config — good enough for a lab/demo deployment.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
