FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY config.js /usr/share/nginx/html/
COPY css/       /usr/share/nginx/html/css/
COPY js/        /usr/share/nginx/html/js/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY scripts/10-render-config.sh /docker-entrypoint.d/10-render-config.sh

RUN chmod +x /docker-entrypoint.d/10-render-config.sh

EXPOSE 80
