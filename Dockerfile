FROM node:8.9.0

WORKDIR /fusion-react-async

COPY . .

RUN yarn

RUN yarn build-test
