import React from 'react';

class FaqRow extends React.Component {

    state = {
        open: false
    }

    toggleRow(){
        this.setState({open: !this.state.open})
    }

    render() {
        return ( 
            <div>
                <div className="row-container" onClick={() => this.toggleRow()}>
                    {this.props.q}
                    <img src="img/drop-copy-2.svg" className={this.state.open ? "up" : ""}/>
                </div>
                {
                    this.state.open &&
                    <div className="answer">
                        {this.props.q.includes("How can I withdraw Bitcoin?") && <p style={{marginBottom: "10px"}}>{this.props.a[0]}</p>}
                        {this.props.a.length > 1
                        ? 
                        <ol>
                            {this.props.a.map((a, i) => 
                                this.props.q.includes("How can I begin trading?") || this.props.q.includes("How can I make a purchase with my credit card?") || this.props.q.includes("How can I withdraw Bitcoin?")
                                    ? this.props.q.includes("How can I withdraw Bitcoin?") 
                                        ? i < this.props.a.length - 1 && i !== 0 && <li key={i}>{a}</li> 
                                        : i < this.props.a.length - 1 && <li key={i}>{a}</li> 
                                    : <li key={i}>{a}</li>)}
                        </ol>
                        : <p dangerouslySetInnerHTML={ {__html: this.props.a[0]} } />
                        }
                        {(this.props.q.includes("How can I begin trading?") || this.props.q.includes("How can I make a purchase with my credit card?") || this.props.q.includes("How can I withdraw Bitcoin?")) && <p style={{marginTop: "10px"}}>{this.props.a[this.props.a.length - 1]}</p>}
                    </div>
                }
            </div>
       )
    }
}



export default FaqRow;