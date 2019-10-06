/* global AlphaPoint, JumioClient */
/* eslint-disable react/no-multi-comp */
import React from 'react';

export default class Jumio extends React.Component {
    componentDidMount() {
      AlphaPoint.session
        .where(data => data.sessionToken)
        .take(1) // subscribe until valid session
        .subscribe(() => {
          if (JumioClient) {
            AlphaPoint.netVerify(null, res => {
              this.props.setError(res.errorMessage);
              if (res.errorMessage) return;
  
              const data = JSON.parse(res.data);
  
              if (JumioClient) {
                JumioClient
                  .setVars({ authorizationToken: data.authorizationToken })
                  .initVerify(this.refs.jumio);
              }
            });
          }
        });
    }
  
    render() {
      return (
        <div ref="jumio" />
      );
    }
  }
  
  Jumio.defaultProps = {
    setError: () => { },
  };
  
  Jumio.propTypes = {
    setError: React.PropTypes.func,
  };