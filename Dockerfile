FROM node:8.9.4

ENV INSTALL_PATH /app
RUN mkdir -p $INSTALL_PATH

WORKDIR $INSTALL_PATH

COPY . .

ARG NODE_ENV
RUN echo "NODE_ENV: $NODE_ENV"
ENV NODE_ENV $NODE_ENV

WORKDIR $INSTALL_PATH/APEXLibrary
RUN yarn --production=false install 
RUN if [ "$NODE_ENV" = "development" ]; then yarn build-dev ; else yarn build ; fi

WORKDIR $INSTALL_PATH/APEXWidgets
RUN yarn --production=false install
RUN if [ "$NODE_ENV" = "development" ]; then yarn build-dev ; else yarn build ; fi

WORKDIR $INSTALL_PATH/v2retailTemplate
RUN if [ "$NODE_ENV" = "development" ]; then sh dev-build.sh ; fi
RUN yarn --production=false install
#RUN yarn build


RUN cp ../APEXWidgets/build/widgets.min.js ./js
RUN cp ../APEXLibrary/build/library.min.js ./js

RUN npm run shiftstyles
RUN npm run shiftwallet
RUN npm run shifttrade

RUN npm install --global simple-server

CMD ["simple-server",".","3000"]
