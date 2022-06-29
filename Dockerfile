FROM node:lts AS builder

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm config set auto-install-peers=true
RUN pnpm install

COPY ./src ./src
COPY ./tsconfig.json ./
COPY ./tsconfig.build.json ./
COPY ./nest-cli.json ./

RUN pnpm build

FROM node:lts-alpine

WORKDIR /usr/app

COPY --from=builder ./node_modules ./node_modules
COPY --from=builder ./dist ./dist
COPY package.json ./

EXPOSE 3000

CMD ["npm", "run",  "start:prod"]