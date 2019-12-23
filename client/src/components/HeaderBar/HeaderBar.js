import './HeaderBar.css'
import React, {Component} from 'react';
import axios from "axios";
import storyIcon from './storyIcon.png'
import menuIcon from './menuIcon.png'
import newStoryIcon from './newStoryIcon.png'
import settingsIcon from './settingsIcon.png'


class HeaderBar extends Component{
    constructor(props) {
        super(props);
        this.state = {
            menu: false,
            types: false,
            story: null
        };
        this.createStory = this.createStory.bind(this);
        this.showStories = this.showStories.bind(this);
        this.showTypes = this.showTypes.bind(this);
        this.selectStory = this.selectStory.bind(this);

    }

    showStories() {
        this.setState({menu: !this.state.menu});
    }

    showTypes() {
        this.setState({types: !this.state.types});
    }

    createStory() {
        let $this = this;
        this.setState({menu:false});
        axios.post('http://localhost:5000/api/story/',
            {
                title: 'Untitled',
                color: 'Red',
            })
            .then(function(response) {
                console.log(response.data);
                const story = response.data;
                $this.props.changeStory(story._id);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    selectStory(element) {
        this.props.changeStory(element);
        this.setState({menu: false});
    }

    render() {
        if (this.props.story) {
            return (
                <div className='Header'>
                    <div className='HeaderWrapper'>
                        <div className="HeaderMenuIconWrapper" onClick={this.showStories}>
                            <img src={storyIcon} alt="stories" className="HeaderMenuIcon"/>
                        </div>
                        <div className='HeaderTitle' onClick={this.showStories}>
                            {this.props.story.title.toUpperCase()}
                        </div>
                        <div className='HeaderTitle' style={{fontSize: "30px", marginTop: "-12px", marginLeft: "10px", marginRight: "10px"}}>|</div>
                        <div className='HeaderTitle' onClick={this.showTypes}>
                            <span style={{fontStyle: "italic"}}>SUMMARY</span>
                        </div>
                        <div className="SettingsBar">
                            <img src={settingsIcon} alt="settings" className="SettingsIcon" onClick={this.props.menu}/>
                        </div>
                    </div>
                    {this.state.menu &&
                    <div className='HeaderMenu'>
                        {this.props.stories.map(story => (<StoryOption story={story} changeStory={this.selectStory}/>))}
                        <NewStory onClick={this.createStory}/>
                    </div>
                    }
                </div>
            );
        } else {
            return (
                <div className='Header'>
                    <div className='HeaderWrapper'>
                        <div className='HeaderTitle'>
                            LOADING...
                        </div>
                    </div>
                </div>
            );
        }
    }
}

function StoryOption(props) {
    return (
        <div className="MenuStoryContainer" onClick={() => {props.changeStory(props.story._id)}}>
            <img src={storyIcon} alt="stories" className="HeaderMenuIcon"/>
            <div className="MenuStoryTitle">{props.story.title.toUpperCase()}</div>
        </div>
    )
}

function NewStory(props) {
    return (
        <div className="MenuStoryContainer" onClick={props.onClick}>
            <img src={newStoryIcon} alt="new" className="HeaderMenuIcon" />
            <div className="MenuStoryTitle">NEW</div>
        </div>
    )
}

export default HeaderBar;