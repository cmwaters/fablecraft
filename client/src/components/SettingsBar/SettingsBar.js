import './SettingsBar.css'
import React, {Component} from 'react';
import axios from 'axios';
import deleteIcon from './deleteIcon.png'
// import storyService from '../../services/storyService'


class SettingsBar extends Component{
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return (
            <div className="SideBar">
                <div className="SideBarItem" onClick={this.props.delete}>
                    <img className="SideBarIcon" src={deleteIcon} alt="delete" />
                    <span>Delete Story</span>
                </div>
            </div>
        )
    }
}

export default SettingsBar;