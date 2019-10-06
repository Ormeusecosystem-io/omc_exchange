/* global AlphaPoint */
import React from 'react';

function VerificationLevels() {
  return (
    <div >
      <div className="pad" style={{ backgroundColor: '#aec28f', color: 'white', display: 'inline-block' }}>
        {AlphaPoint.translation('VERIFY.LIMIT_TITLE_TEXT') || 'Verifying your information will grant access to the following:'} <br />
        ------- <br />

        <div>
          <b><u>{AlphaPoint.translation('VERIFY.LIMIT_HEAD_0') || 'Level 1 - Verify Your Information'}</u></b> <br /><br />

          <b>{AlphaPoint.translation('VERIFY.BUY_LIMIT') || 'Daily Deposit Limit'}</b> <br />
          {AlphaPoint.translation('VERIFY.DIGITAL_LIMIT_BUY_0') || 'Digital Currency:'} <br />
          {AlphaPoint.translation('VERIFY.FIAT_LIMIT_BUY_0') || 'Fiat Currency:'} <br /><br />

          <b>{AlphaPoint.translation('VERIFY.SELL_LIMIT') || 'Daily Withdraw Limit'}</b> <br />
          {AlphaPoint.translation('VERIFY.DIGITAL_LIMIT_SELL_0') || 'Digital Currency:'} <br />
          {AlphaPoint.translation('VERIFY.FIAT_LIMIT_SELL_0') || 'Fiat Currency:'} <br /><br />
        </div>

        <div>
          <b><u>{AlphaPoint.translation('VERIFY.LIMIT_HEAD_1') || 'Level 2 - Verify Your Identity'}</u></b> <br /><br />

          <b>{AlphaPoint.translation('VERIFY.BUY_LIMIT') || 'Daily Deposit Limit'}</b> <br />
          {AlphaPoint.translation('VERIFY.DIGITAL_LIMIT_BUY_1') || 'Digital Currency:'} <br />
          {AlphaPoint.translation('VERIFY.FIAT_LIMIT_BUY_1') || 'Fiat Currency:'} <br /><br />

          <b>{AlphaPoint.translation('VERIFY.SELL_LIMIT') || 'Daily Withdraw Limit'}</b> <br />
          {AlphaPoint.translation('VERIFY.DIGITAL_LIMIT_SELL_1') || 'Digital Currency:'} <br />
          {AlphaPoint.translation('VERIFY.FIAT_LIMIT_SELL_1') || 'Fiat Currency:'} <br />
        </div>

      </div>
    </div>
  );
}

export default VerificationLevels;
