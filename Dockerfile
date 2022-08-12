FROM node as node
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
EXPOSE 80
COPY --from=node /app/build .
ENTRYPOINT ["nginx", "-g", "daemon off;"]