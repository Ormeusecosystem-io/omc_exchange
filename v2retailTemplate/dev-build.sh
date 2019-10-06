#!/bin/bash
sed -i -e 's/EXCHANGE_NAME/VERITEX/g' *.html
sed -i -e 's/EXCHANGE_ONBOARDING/www.onboarding.veritex.io/g' *.html
sed -i -e 's/EXCHANGE_LOGO/veritex_logo.png/g' *.html
sed -i -e 's/EXCHANGE_ADDRESS1/© Bluesnow OÜ, Roosikrantsi tn 2, Kesklinna linnaosa, Tallinn, Estonia, Harju maakond, 10119. /g' *.html
sed -i -e 's/EXCHANGE_ADDRESS2/Tallinn, Estonia, Harju maakond, 10119/g' *.html
sed -i -e 's/EXCHANGE_EMAIL/support@veritex.io/g' *.html
sed -i -e 's/EXCHANGE_PHONE/+3728801913/g' *.html
sed -i -e 's/EXCHANGE_SITEKEY/6LcIpp0UAAAAAOQ2mvehoPx4NT8OVD-NPWsIpIkw/g' *.js

