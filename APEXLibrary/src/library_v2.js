import SubscribeLevel1 from './ccx_subscribeLvl1';

export const ExchangeApiConfig = {
    SubscribeLevel1: {
        method: 'post',
        path: '/api/v2/quotes/subscribeLevel1',
        data: ['BTCUSD','BTCEUR','BTCGBP','BTCAUD','BTCCAD','ETHUSD','ETHEUR'],
    },
};

export const Library_v2 = {
    SubscribeLevel1,
}