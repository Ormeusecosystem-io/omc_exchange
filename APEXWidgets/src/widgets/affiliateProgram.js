/* global AlphaPoint, document, $ */
import React from 'react';
import Rx from 'rx-lite';

import WidgetBase from './base';

class AffiliateProgram extends React.Component {
  state = {
    tag: null,
    user: null,
    showCreateForm: false,
    showEditForm: false,
    newTag: '',
    affiliateCount: 0,
  };

  componentDidMount() {
    this.getUserAffiliateTag = Rx.Observable.combineLatest(
      AlphaPoint.oms,
      AlphaPoint.getUser,
      (oms, userData) => ({ OMSId: oms, user: userData }),
    )
      .filter(data => Object.keys(data).length)
      .subscribe(({ OMSId, user }) => {
        AlphaPoint.getUserAffiliateTag({ OMSId, UserId: user.userId });
        AlphaPoint.getUserAffiliateCount();
        this.setState({ user, newTag: user.UserName });
      });

    this.userAffiliateTag = AlphaPoint.userAffiliateTag.subscribe(tag => {
      this.setState({
        tag,
        showCreateForm: false,
        showEditForm: false,
      });
    });
    this.userAffiliateCount = AlphaPoint.userAffiliateCount
      .subscribe(count => this.setState({ affiliateCount: count && count.Count }));
  }

  componentWillUnmount() {
    this.getUserAffiliateTag.dispose();
    this.userAffiliateTag.dispose();
  }

  handleCreateNewTag = (e) => {
    const payload = {
      OMSId: AlphaPoint.oms.value,
      UserId: this.state.user.UserId,
      AffiliateId: this.state.user.AffiliateId,
      AffiliateTag: this.state.newTag,
    };

    e.preventDefault();
    if (!this.state.newTag.trim()) {
      return $.bootstrapGrowl(
        AlphaPoint.translation('AFFILIATE.EMPTY_TAG') || 'Affiliate Tag can\'t be empty',
        { ...AlphaPoint.config.growlerDefaultOptions, type: 'danger' },
      );
    }
    return AlphaPoint.addUserAffiliateTag(payload);
  };

  handleUpdateTag = (e) => {
    const payload = {
      OMSId: this.state.tag.OMSId,
      UserId: this.state.tag.UserId,
      AffiliateId: this.state.tag.AffiliateId,
      AffiliateTag: this.state.newTag,
    };

    e.preventDefault();
    if (!this.state.newTag.trim()) {
      return $.bootstrapGrowl(
        AlphaPoint.translation('AFFILIATE.EMPTY_TAG') || 'Affiliate Tag can\'t be empty',
        { ...AlphaPoint.config.growlerDefaultOptions, type: 'danger' },
      );
    }
    return AlphaPoint.updateUserAffiliateTag(payload);
  };

  copyTagToClipboard = () => {
    const inp = document.querySelector('#affurl');

    if (inp && inp.select) {
      inp.select();
      try {
        document.execCommand('copy');
        inp.blur();
        $.bootstrapGrowl(
          AlphaPoint.translation('AFFILIATE.EMPTY_TAG.COPIED') || 'Copied',
          { ...AlphaPoint.config.growlerDefaultOptions, type: 'success' },
        );
      } catch (err) {
        $.bootstrapGrowl(
          AlphaPoint.translation('AFFILIATE.EMPTY_TAG.COPY_MANUALLY') || 'Please copy manually',
          { ...AlphaPoint.config.growlerDefaultOptions, type: 'info' },
        );
      }
    }
  };

  render() {
    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('AFFILIATE.TITLE_TEXT') || 'Affiliate Program'}>
        <div className="pad affiliate-program">
          {(!this.state.tag || !this.state.tag.AffiliateTag) && !this.state.showCreateForm ?
            <span>
              {AlphaPoint.translation('AFFILIATE.NO_PROGRAM_LINE1') || 'There are currently no affiliate tags. Please'}&nbsp;
              <a
                onClick={() => this.setState({ showCreateForm: true })}
                style={{
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                }}
              >{AlphaPoint.translation('AFFILIATE.NO_PROGRAM_LINE2') || 'create one'}</a>.
            </span>
            : null}

          {this.state.tag && this.state.tag.AffiliateTag && !this.state.showEditForm ?
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {AlphaPoint.translation('AFFILIATE.ACTIVE_TEXT') || 'Current active tag:'}&nbsp;
                <input
                  type="text"
                  id="affurl"
                  value={`${AlphaPoint.config.operatorUrl}?aff=${this.state.tag.AffiliateTag}`}
                  style={{
                    border: 0,
                    background: 'transparent',
                    flex: '1',
                    color: 'inherit',
                    fontSize: '0.8rem',
                  }}
                />
                <i
                  className="material-icons"
                  style={{ marginLeft: '0.5rem', cursor: 'pointer', fontSize: 'inherit' }}
                  title={AlphaPoint.translation('AFFILIATE.EDIT') || 'Edit affiliate tag'}
                  onClick={() => this.setState({ newTag: this.state.tag.AffiliateTag, showEditForm: true })}
                >mode_edit</i>
                <i
                  className="material-icons"
                  style={{ marginLeft: '0.5rem', cursor: 'pointer', fontSize: 'inherit' }}
                  title={AlphaPoint.translation('AFFILIATE.COPY') || 'Copy affiliate tag'}
                  onClick={this.copyTagToClipboard}
                >content_copy</i>
              </div>
              <div style={{ marginTop: '1rem' }}>{AlphaPoint.translation('AFFILIATE.ACTIVE_TITLE_TEXT') || 'Number of active affiliates: '}<span className="affiliate-count">{this.state.affiliateCount}</span></div>
            </div> : null}

          {this.state.showCreateForm || this.state.showEditForm ?
            <div>
              <h3 style={{ fontSize: '1rem' }}>
                {this.state.showCreateForm ? AlphaPoint.translation('AFFILIATE.CREATE') || 'Create affiliate tag' : AlphaPoint.translation('AFFILIATE.UPDATE')}
              </h3>
              <form
                className="row middle-xs"
                style={{ marginTop: '1rem', marginRight: 0, marginLeft: 0 }}
                onSubmit={this.state.showCreateForm ? this.handleCreateNewTag : this.handleUpdateTag}
              >
                <div className="form-group" style={{ marginBottom: 0, marginRight: '1rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ marginTop: 0 }}
                    value={this.state.newTag}
                    onChange={(e) => this.setState({ newTag: e.target.value })}
                  />
                </div>
                <button
                  className="btn btn-action"
                  type="submit"
                >
                  {this.state.showCreateForm ?
                    AlphaPoint.translation('AFFILIATE.CREATE_BTN') || 'Create' :
                    AlphaPoint.translation('AFFILIATE.UPDATE_BTN') || 'Update'}
                </button>
                <button
                  className="btn btn-action"
                  onClick={() => this.setState(() => ({
                    showCreateForm: false,
                    showEditForm: false,
                  }))}
                >{AlphaPoint.translation('AFFILIATE.CANCEL') || 'Cancel'}</button>
              </form>
            </div> : null}
        </div>
      </WidgetBase>
    );
  }
}

export default AffiliateProgram;
