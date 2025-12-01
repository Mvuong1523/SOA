FROM nginx:1.27-alpine

COPY gateway/nginx.conf /etc/nginx/nginx.conf
COPY frontend/ /usr/share/nginx/html/

EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]
