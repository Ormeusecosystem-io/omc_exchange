/* global atob, Blob, location, $, AlphaPoint, localStorage, matchMedia */
import parseDecimalNumber from 'parse-decimal-number';
import numeral from 'numeral';
import axios from '../axios';
import routingProperties from './routing-properties.json';
require('numeral/locales');

export const toCamelCase = str => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

export const type = variable =>
  Object.prototype.toString
    .call(variable)
    .replace('[object ', '')
    .replace(']', '')
    .toLowerCase();

export function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

export function getURLParameter(name) {
  return (
    decodeURIComponent(
      (new RegExp(`[?|&]${name}=([^&;]+?)(&|#|;|$)`).exec(location.search) || [null, ''])[1],
    ) || null
  );
}

export function showGrowlerNotification(growlerType, text) {
  $.bootstrapGrowl(text, { ...AlphaPoint.config.growlerDefaultOptions, type: growlerType });
}

export const formatOrders = (orders = []) =>
  orders.map(order => ({
    UpdateId: order[0],
    Account: order[1],
    TimeStamp: order[2],
    ActionType: order[3],
    LastTradePrice: order[4],
    Orders: order[5],
    Price: +order[6],
    ProductPairCode: order[7],
    Quantity: +order[8],
    Side: order[9],
  }));

export function formatNumberToLocale(value, decimalPlaces) {
  if (isNaN(value)) return '';
  const multi = 10 ** decimalPlaces;
  return (Math.floor(value * multi) / multi).toLocaleString(AlphaPoint.config.locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

export function parseNumberToLocale(value, negativeIsNaN = true) {
  const { delimiters } = numeral.localeData(AlphaPoint.config.locale);
  if (value === '' || value === delimiters.decimal) return 0;
  const parsed = parseDecimalNumber(value, numeral.localeData(AlphaPoint.config.locale).delimiters);
  return negativeIsNaN && parsed < 0 ? NaN : parsed;
}

// https://stackoverflow.com/a/27865285
export function getDecimalPrecision(a) {
  if (!isFinite(a) || isNaN(a)) return 0;
  let e = 1;
  let p = 0;
  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }
  return p;
}

export function formatDateToString(date, date_format = '') {
  const format = !date_format ? AlphaPoint.config.dateFormat || 'MM/DD/YYYY' : date_format;
  const day = (`0${date.getDate()}`).slice(-2);
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const year = date.getFullYear();

  return format === 'DD/MM/YYYY' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

export function truncateToDecimals(value, decimalPlaces) {
  if (isNaN(value)) return false;
  const multi = 10 ** decimalPlaces;
  return Math.floor(value * multi) / multi;
}

// Used to sort products on balances widgets
export const sortProducts = (a, b) => {
  const aPos = AlphaPoint.config.sortProducts.indexOf(a.ProductSymbol);
  const bPos = AlphaPoint.config.sortProducts.indexOf(b.ProductSymbol);
  if (aPos > bPos) {
    return 1;
  } else if (aPos < bPos) {
    return -1;
  }
  return 0;
};

export function getQuantityForFixedPrice(price, padding = 0, orders = [], fill = false, places = 2) {
  const paddedPrice = price + (padding * price);
  let sum = 0;
  let quantity = 0;
  let lastPrice;
  let remainingPrice = paddedPrice;
  let lastOrder = { Price: 0 };

  if (orders.length) {
    orders.some(order => {
      const orderTotal = order.Quantity * order.Price;
      sum += orderTotal;
      if (sum < paddedPrice) {
        quantity += order.Quantity;
      } else {
        const remainder = paddedPrice - (sum - orderTotal);
        quantity += remainder / order.Price;
        lastPrice = order.Price;
      }
      remainingPrice -= orderTotal;
      lastOrder = order;
      return sum >= paddedPrice;
    });
  } else {
    return { Price: price, Quantity: quantity, LimitPrice: 0 };
  }
  if (fill && remainingPrice > 0) {
    quantity += remainingPrice / lastOrder.Price;
    sum = paddedPrice;
  }
  if (sum < paddedPrice) return { Price: price, Quantity: '-' };
  const LimitPrice = parseFloat(Number(lastPrice || lastOrder.Price).toFixed(places));
  return { Price: price, Quantity: quantity, LimitPrice };
}

export function getPriceForFixedQuantity(quantity, padding = 0, orders = [], fill = false, places = 2) {
  const paddedQty = quantity + (padding * quantity);
  let price = 0;
  let remainingQty = paddedQty;
  let lastOrderPrice = 0;

  orders.some(order => {
    if (remainingQty > order.Quantity) {
      price += order.Quantity * order.Price;
    } else {
      price += remainingQty * order.Price;
    }
    remainingQty -= order.Quantity;
    lastOrderPrice = order.Price;
    return remainingQty <= 0;
  });

  if (fill && remainingQty > 0) {
    price += remainingQty * lastOrderPrice;
    remainingQty = 0;
  }
  if (remainingQty > 0) return '-';
  return { Price: price, LimitPrice: parseFloat(Number(lastOrderPrice).toFixed(places)) };
}

export function getPriceForFixedQuantity_test(quantity, bestOffer, price = 0, fee = 0.03) {
  price = quantity * bestOffer;
  const transaction_fee = quantity * fee
  // quantity = quantity - transaction_fee
  return { Price: price, cryptoQuantity: quantity, transaction_fee };
}

export function getQuantityForFixedPrice_test(price, bestOffer, quantity = 0, fee = 0.03) {
  quantity = price / bestOffer;
  const transaction_fee = quantity * fee
  // quantity = quantity - transaction_fee
  return { Price: price, cryptoQuantity: quantity, transaction_fee };
}

export function changeAccount(accountId) {
  localStorage.setItem('accountId', accountId);
  AlphaPoint.selectedAccount.onNext(accountId);
}

export function path(objectPath, obj) {
  return objectPath.split('.').reduce((o, prop) => o && o[prop], obj);
}

export function isMobile() {
  return matchMedia('only screen and (max-width: 760px)').matches;
}

export function allowDeposit(symbol) {
  // Allow for exclusions
  const { excludeDeposit } = AlphaPoint.config;
  return !(excludeDeposit && excludeDeposit.indexOf(symbol) !== -1);
}

export function allowWithdraw(symbol) {
  // Allow for exclusions
  const { excludeWithdraw } = AlphaPoint.config;
  return !(excludeWithdraw && excludeWithdraw.indexOf(symbol) !== -1);
}


export const customFixed = (num, fixed) => {
  if(num === '') return 
  num = noExponents(num);
  if((num % 1) === 0) return num;
  num = String(num);
  fixed = fixed+1;
  if(num.length < 3) return num
  let fixed_num = "";
  let counter = 0;
  for (let i = 0; i < num.length; i++) {
    fixed_num = fixed_num + num[i];
    if(num[i] === "."  || counter > 0){
        counter++
        if(counter === fixed){
          return fixed_num
        }
      }
    }
    return fixed_num
 }

 

export function noExponents(num){
    var data= String(num).split(/[eE]/);
    if(data.length== 1) return data[0]; 

    var  z= '', sign= num<0? '-':'',
    str= data[0].replace('.', ''),
    mag= Number(data[1])+ 1;

    if(mag<0){
        z= sign + '0.';
        while(mag++) z += '0';
        return z + str.replace(/^\-/,'');
    }
    mag -= str.length;  
    while(mag--) z += '0';
    return str + z;
}

export const commaFormatted = (amount) => {
  var parts = amount.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export const checkValidity = ( value, rules ) => {
  let isValid = true;
  if ( !rules ) {
      return true;
  }

  if ( rules.required ) {
      isValid = value.trim() !== '' && isValid;
  }

  if ( rules.minLength ) {
      isValid = value.length >= rules.minLength && isValid
  }

  if ( rules.maxLength ) {
      isValid = value.length <= rules.maxLength && isValid
  }

  if ( rules.isEmail ) {
      const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
      isValid = pattern.test( value ) && isValid
  }

  if ( rules.isNumeric ) {
      const pattern = /^\d+$/;
      isValid = pattern.test( value ) && isValid
  }

  return isValid;
}

export const checkErrorCode = (error) => {
  if(error && error.response && error.response.status === 401){
    localStorage.setItem('SessionToken', undefined);
    window.location.href = "/login.html";
  }
}

export const getAccountStatus = async() => {
  try{
    const {data} = await axios.get('/cps/account/status');
    if(data && data.code === 200){
      const isPending = data.isPendingVerification;
      let accountStatus;
      const statuses = {
          pending: "Not verified",
          approved: "Verified",
          rejected: "Rejected"
      }
      if(isPending){
        accountStatus = "Pending verification";
      }
      else if(data.accountStatus === "pending"){
        accountStatus = statuses.pending;
      }
      else{
          accountStatus = statuses[data.accountStatus];
      }
      return {code: data.code, accountStatus};
    }
  }
  catch(e){
    if(e && e.response && e.response.status && e.response.status === 401){
      localStorage.removeItem('SessionToken');
      const blackList = ['settings', 'my-wallet', "orders"];
      const pathname = window.location.pathname.replace("/", "").replace(".html", "");
      if(blackList.includes(pathname)){
        return window.location.href = "/login.html"
      }
      return {code: e.response.status}
    }
    else if(e && e.response && e.response.status){
      return {code: e.response.status}
    }
  }
}

export const getAccountStatusColor = status => {
  return status === "Verified" ? "#2dc8a6" : status === "Pending verification" ? "#0091ff" : "#ffaa44";
}

export const viewIsPartOf = (path, pageProperties) => {
  path = path.substring(1).split(".")[0];
  const sectionViews = Object.keys(routingProperties[path]); 
  return pageProperties && sectionViews.includes(pageProperties.view)
} 

export default {
  viewIsPartOf,
  getAccountStatusColor,
  getAccountStatus,
  checkErrorCode,
  checkValidity,
  commaFormatted,
  toCamelCase,
  type,
  b64toBlob,
  getURLParameter,
  showGrowlerNotification,
  formatNumberToLocale,
  truncateToDecimals,
  sortProducts,
  getQuantityForFixedPrice,
  getPriceForFixedQuantity,
  changeAccount,
  path,
  isMobile,
  allowDeposit,
  allowWithdraw,
  customFixed,
  noExponents,
  getPriceForFixedQuantity_test,
  getQuantityForFixedPrice_test
};
