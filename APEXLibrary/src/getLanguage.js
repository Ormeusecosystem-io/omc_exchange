import ajax from './ajax';
import config from './config';
import events from './events/setup';
import logs from './logs';

const cache = {};

function getLanguage(data = {}, callback = () => {
}) {
    data.language = data.language || config.defaultLanguage;

    if (!data.language) return callback && callback({});

    // if (cache[data.language]) return callback && callback(cache[data.language]);

    return $.ajax({
        type: 'GET',
        url: `${config.languagesLocation}/${data.language}.json`,
        success: res => {
            if (res) {
                logs.language.onNext(res);
                callback(res);
            } else {
                $.ajax({
                    url: `${config.languagesLocation}/${config.defaultLanguage}.json`,
                    type: 'GET',
                    succes: res => {
                        if (res) {
                            logs.language.onNext(res);
                            callback(res);
                        }
                    }
                });
            }
        },
        error: (e) => {
            console.error('Error retrieving the language', e);
        }
    });

    // ajax({
    //   url: `${config.languagesLocation}/${data.language}.json`,
    //   type: 'GET'
    // }, res => {
    //   if (res) {
    //     logs.language.onNext(res);
    //     if (callback) callback(res);
    //   } else {
    //     ajax({
    //       url: `${config.languagesLocation}/${config.defaultLanguage}.json`,
    //       type: 'GET'
    //     }, res => {
    //       if (res) {
    //         logs.language.onNext(res);
    //         if (callback) callback(res);
    //       }
    //     });
    //   }
    // });
}

export default getLanguage;
