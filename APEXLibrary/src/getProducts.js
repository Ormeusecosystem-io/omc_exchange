/* global document, AlphaPoint, APConfig */
import logs from './logs';

function getProducts() {
  if (!AlphaPoint.oms.value) return;
  const requestPayload = { OMSId: AlphaPoint.oms.value };

  // prettier-ignore
  logs.socketOpen
  .filter((open) => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetProducts', requestPayload, (rawData) => {
      const excluded = APConfig.excludedProducts || [];
      const data = rawData.filter(prod => !excluded.includes(prod.Product));
      AlphaPoint.products.onNext(data);
    });
  });
}

export default getProducts;
