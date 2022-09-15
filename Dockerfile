FROM node as node
WORKDIR /app
COPY package*.json ./
COPY *yarn*.* ./
COPY .yarn/ .yarn/
RUN yarn install
COPY . .
RUN mkdir -p public/resume
RUN yarn run resume-elegant-html
RUN yarn build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/configfile.template
COPY --from=node /app/dist /usr/share/nginx/html
ADD screenshot.png /usr/share/nginx/html/
ENV PORT 8080
ENV HOST 0.0.0.0
EXPOSE 8080
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/configfile.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"