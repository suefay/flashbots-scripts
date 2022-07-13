FROM node:18

WORKDIR /flashbots-scripts

COPY . .

RUN npm install

CMD ["npm", "run", "start-os-listener"]
