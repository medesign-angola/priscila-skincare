FROM node:24-alpine AS dependencies
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /opt/app
COPY --from=dependencies /opt/app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=build /opt/app ./
EXPOSE 1337
CMD ["npm", "run", "start"]
