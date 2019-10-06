const Rx = require('rx-lite');

const SubscribeLevel1 = Rx.Observable.create(observer => {
    console.log('SubscribeLevel1')
    
    const { method, path, data } = window.ExchangeApiConfig.SubscribeLevel1
    
    data.forEach(pair => {
      CCXA_API.Subscribe(method, path, {pair}, (body, jwr)=>{
        observer.next(resp(body, jwr, pair))
      });
    })

    CCXA_API.OnMessage((body) => {
        observer.next(resp(body));
    });
});

function Level1Data(obj) {
    this.InstrumentId = obj[0]; //TODO: This will change to a number
    this.BestBid = obj[1];
    this.BestOffer = obj[2];
    this.Last = obj[3];
}

const resp = (body, jwr, pair) => {
    if(jwr) {
        const { statusCode } = jwr;
        if(statusCode !== 201) console.error(`Failed to subscribe to level1 data for ${pair}`);
            console.log(`Successfully subscribed to level1 data for ${pair}`);
    }
    return new Level1Data(body.payload);
}


export default SubscribeLevel1;

// implementation example to buy-fixed.js
// this.SubscribeLevel1 = ExchangeApi.SubscribeLevel1.subscribe(value => {
//     console.log('this.state.fromCurrency + this.state.toCurrency: ', this.state.productPair)
//     if(this.state.productPair && this.state.productPair === value.InstrumentId) {
//       console.log(`value: ${JSON.stringify(value)}`);
//       this.setState({ BestBid: value.BestBid, BestOffer: value.BestOffer })
//     }
//   });