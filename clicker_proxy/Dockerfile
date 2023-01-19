FROM nginx:latest

# Delete default config and replace it.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/nginx.conf

# Copy Keyfiles for TLS.
COPY xms-dev.com.key xms-dev.com.key
COPY xms-dev.com.pem xms-dev.com.pem

