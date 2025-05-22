FROM node:lts-alpine

# Set working directory
WORKDIR /usr/src/app

# Install yarn if not included in the base image
RUN apk add --no-cache yarn

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Install bash and the wait script
RUN apk add --no-cache bash
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait /wait
RUN chmod +x /wait

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application - wait for db, run prisma commands, then start app
CMD /wait && \
    npx prisma generate && \
    npx prisma migrate deploy && \
    yarn dev