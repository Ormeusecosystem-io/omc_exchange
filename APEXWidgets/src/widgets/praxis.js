import React, { Component } from 'react'

export default class praxis extends Component {
  state = {
    token: "",
    password: "",
    userId: "",
    amount: 0,
    submitted: false
  }

 
  componentWillMount() {
    const {token, password, userId, amount } = this.props
    if(password && userId){
      this.setState({
        token,
        password,
        userId,
        amount
      });
    }
  }
  
  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.submitted
  }
  
  
  componentDidUpdate(prevProps, prevState){
    if(prevProps.password === this.state.password && !this.state.submitted){
      this.setState({...this.state, submitted: true})
      this.refs.CashierLogin.submit();
    }
  }

  render() {
  
    return (
          <iframe onLoad={() => this.props.onLoad()} src="" name="CashierFrame" style={{display:"block", width:"80%", minWidth:"300px", maxWidth:"800px", height:"600px", border:"none", margin:"0 auto"}}>
            <form target="CashierFrame" action={`${process.env.PRAXIS_URL}/Login.asp`} method="post" name="CashierLogin" id="CashierLogin" ref="CashierLogin">
                <input type="hidden" name="FrontEnd" value={`${process.env.PRAXIS_FE} ${this.props.currency}`} />
                <input type="hidden" name="PIN" value={this.state.userId} />
                <input type="hidden" name="Password" value={this.state.password} />
                <input type="hidden" name="Secret" value={this.state.token}/>
                <input type="hidden" name="SCOrderID" value={this.state.password}/>
                <input type="hidden" name="Lang" value='en'/>
                <input type="hidden" name="SCAmount" value={this.state.amount.toFixed(2)}/>
            </form>
          </iframe>
        
    )
  }
}





