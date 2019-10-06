import React from 'react';

class DocumentTooltip extends React.Component {


    state = {
        hover: false
    }

    onMouseMove(flag){
        this.setState({hover: flag})
    }

    render(){
        const {title, content} = this.props;
        return (
            <div className="buble-container">
                {title} 
                <img src="img/info.svg" onMouseEnter={() => this.onMouseMove(true)} onMouseLeave={() => this.onMouseMove(false)}/>
                {this.state.hover && <div>{content}</div>}
            </div>
        )
    } 
}

export default DocumentTooltip;