import './Story.css'
import React, {Component} from 'react';
import axios from 'axios';
import Card from '../Card/Card'
import changeIcon from './changeIcon.png'
// import storyService from '../../services/storyService'


class StoryCrafter extends Component{
    constructor(props) {
        super(props);
        this.state = {
            showEditTitleIcon: false,
            editTitle: false,
        };
        this.toggleEditTitle = this.toggleEditTitle.bind(this);
        this.toggleShowEditTitleIcon = this.toggleShowEditTitleIcon.bind(this);
        this.changeTitle = this.changeTitle.bind(this);
    }

    toggleShowEditTitleIcon() {
        this.setState({showEditTitleIcon: !this.state.showEditTitleIcon});
    }

    toggleEditTitle() {
        this.setState({editTitle: !this.state.editTitle});
    }

    changeTitle(event) {
        if (event.key === 'Enter') {
            this.props.setTitle(event.target.value);
        }
    }

    render() {
        if (this.props.story) {
            return (
                <div className='Page'>
                    <div className='OverTitle'>CARDS</div>
                    <div onMouseEnter={this.toggleShowEditTitleIcon} onMouseLeave={this.toggleShowEditTitleIcon}
                         className='Title' onClick={this.toggleEditTitle}>
                        {!this.state.editTitle ? <span>{this.props.story.title}</span> : <EditTitle submit={this.changeTitle}/>}
                        {
                            this.state.showEditTitleIcon && !this.state.editTitle &&
                            <img className='TitleChangeIcon'  src={changeIcon} alt="edit title"/>
                        }
                    </div>
                    <hr className='Underline'/>
                    <div>{this.props.story.cards.map(card => (<Card card={card} story_id={this.props.story._id} />))}</div>
                </div>
            );
        } else {
            return (
                <div className='Page'>
                    <div className='OverTitle'>CARDS</div>
                    <div className='Title'>Untitled</div>
                    <hr className='Underline'/>
                </div>
            );
        }
    }
}

function EditTitle(props) {
    return (
        <input className='EditTitleInput' autoFocus="true" onKeyPress={props.submit}/>
    )
}

export default StoryCrafter;