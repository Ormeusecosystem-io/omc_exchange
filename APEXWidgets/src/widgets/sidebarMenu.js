import React from 'react';

class SidebarMenu extends React.Component {

    render() {
        const {items, title, onItemClick, active} = this.props;
        return ( 
           <div className="menu-holder" style={{width: "300px"}}>
                <h4>{title}</h4>
                <ul>
                    {items.map((item, i) => 
                        <li key={i} style={{color: item.label.includes("Credit card") && "#1299ff", backgroundColor: active === item.value && "#50567c"}} onClick={() => onItemClick({view: item.value, section: title})}>
                            {item.label}
                            {item.label.includes("Credit card") && <img src="img/ccard.svg"/>}
                        </li>)}
                </ul>
           </div>
       )
    }
}



export default SidebarMenu;