FROM nginx:latest   

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY ./fastcgi.conf /etc/nginx/conf.d/fastcgi.conf
COPY ./fastcgi_params /etc/nginx/conf.d/fastcgi_params
COPY ./mime.types /etc/nginx/conf.d/mime.types
COPY ./proxy_params /etc/nginx/conf.d/proxy_params
COPY ./scgi_params /etc/nginx/conf.d/scgi_params

#Crea stesso utente di php con cui far girare nginx per poter avere le autorizzazioni a leggere il socket php
RUN groupadd -g 1000 devuser
RUN useradd -d /home/devuser -s /bin/bash -u 1000 -g 1000 devuser
RUN mkdir /home/devuser
RUN chown -R devuser:devuser /home/devuser