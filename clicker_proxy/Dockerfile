FROM nginx:latest

# Delete default config and replace it.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Copy Keyfiles for TLS.
COPY xms-dev.com.key /etc/nginx/xms-dev.com.key
COPY xms-dev.com.pem /etc/nginx/xms-dev.com.pem
