FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./

RUN npm install
# for production:
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Run webpack
RUN npm run build

EXPOSE 3333

CMD [ "npm", "run", "server" ]