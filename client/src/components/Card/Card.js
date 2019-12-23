import './Card.css'
import React, {Component} from 'react';
import axios from 'axios';
import TextareaAutosize from 'react-textarea-autosize';
import deleteIcon from './deleteIcon.png'
import moveUpIcon from './moveUpIcon.png'
import moveDownIcon from './moveDownIcon.png'
import addIcon from './addIcon.png'
import createNoteIcon from './createNoteIcon.png'

class Card extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hover: false,
            edit: false,
            text: this.props.card.text
        };
        this.toggleHover = this.toggleHover.bind(this);
        this.onClick = this.onClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.addCard = this.addCard.bind(this);
        this.deleteCard = this.deleteCard.bind(this);
        this.slideDown = this.slideDown.bind(this);
        this.slideUp = this.slideUp.bind(this);
    }

    onClick() {
        this.setState({edit: !this.state.edit});
    }

    toggleHover() {
        this.setState({hover: !this.state.hover})
    }

    handleChange(event) {
        console.log('Handling Change');
        if (event.key === 'Enter') {
            axios({
                method: 'put',
                url: 'http://localhost:5000/api/story/' + this.props.story_id + '/card/' + this.props.card.position,
                data: {
                    text: this.state.text,
                    type: this.props.card.type
                }
            });
            this.setState({edit: !this.state.edit})
            // window.location.reload()
        }
        this.setState({text: event.target.value});
    }

    deleteCard() {
        axios({
            method: 'delete',
            url: 'http://localhost:5000/api/story/' + this.props.story_id + '/card/' + this.props.card.position,
        });
        window.location.reload()
    }

    addCard() {
        axios.post('http://localhost:5000/api/story/' + this.props.story_id + /card/ + (this.props.card.position + 1),
            {
                text: '',
                type: 'Summary',
                position: this.props.card.position + 1,
            })
            .then(function(response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
        window.location.reload()
    }

    slideDown() {
        axios({
            method: 'put',
            url: 'http://localhost:5000/api/story/' + this.props.story_id + '/card/' + this.props.card.position + '/slideDown',
        });
        window.location.reload()
    }

    slideUp() {
        axios({
            method: 'put',
            url: 'http://localhost:5000/api/story/' + this.props.story_id + '/card/' + this.props.card.position + '/slideUp',
        });
        window.location.reload()
    }

    render() {
        if (this.state.edit || this.state.text === "") {
            return <EditCard card={this.props.card} text={this.state.text} onClick={this.onClick} handleChange={this.handleChange}
                             deleteCard={this.deleteCard}/>
        } else if (this.state.hover) {
            return <OpenCard card={this.props.card} text={this.state.text} onClick={this.onClick} toggleHover={this.toggleHover} addCard={this.addCard}
                deleteCard={this.deleteCard} slideDown={this.slideDown} slideUp={this.slideUp}/>
        } else {
            return <ClosedCard card={this.props.card} text={this.state.text} toggleHover={this.toggleHover}/>
        }
    }
}

function EditCard(props) {
    return (
        <div className='Card' style={{backgroundColor: "#eee"}}>
            <div className='CardHeader'>
                <span>{props.card.type} | {props.card.position + 1}</span>
            </div>
            <form>
                <TextareaAutosize
                    className="CardInput"
                    type='text'
                    autofocus="true"
                    onChange={props.handleChange}
                    onKeyPress={props.handleChange}
                    value={props.text}
                />
            </form>
            <div className='CardOptions'>
                <img className='CardButton' src={addIcon} alt="add" />
                <img className='CardButton' src={moveUpIcon} alt="move up" />
                <img className='CardButton' src={moveDownIcon} alt="move down" />
                <img className='CardButton' src={deleteIcon} alt="delete" onClick={props.deleteCard} />
                <img className='CardButton' src={createNoteIcon} alt="create note"/>
            </div>
        </div>
    )
}

function OpenCard(props) {
    return (
        <div onMouseEnter={props.toggleHover}
             onMouseLeave={props.toggleHover} className='Card'>
            <div onClick={props.onClick}>
                <div className='CardHeader'>
                    <h1 style={{marginBottom: "-10px"}}>{props.card.position + 1}</h1>
                    <h3>{props.card.type}</h3>
                </div>
                {props.text}
            </div>
            <div className='CardOptions'>
                <img className='CardButton' src={addIcon} alt="add" onClick={props.addCard}/>
                <img className='CardButton' src={moveUpIcon} alt="move up" onClick={props.slideUp}/>
                <img className='CardButton' src={moveDownIcon} alt="move down" onClick={props.slideDown}/>
                <img className='CardButton' src={deleteIcon} alt="delete" onClick={props.deleteCard}/>
                <img className='CardButton' src={createNoteIcon} alt="create note"/>
            </div>
        </div>
    );
}

function ClosedCard(props) {
    return (
        <div onMouseEnter={props.toggleHover}
             onMouseLeave={props.toggleHover} className='Card'>
            <div className='CardHeader'>
            </div>
            {props.text}
            <div className='CardOptions'>
            </div>
        </div>
    );
}

export default Card;