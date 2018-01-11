FROM uber/web-base-image:1.0.0

WORKDIR /fusion-react-async

COPY . .

RUN yarn

RUN yarn build-test
