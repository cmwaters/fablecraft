import React, { Component } from "react";
import HeaderBar from './components/HeaderBar/HeaderBar'
import StoryCrafter from './components/Story/Story'
import SettingsBar from './components/SettingsBar/SettingsBar'
import axios from "axios";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            menuBar: false,
            noStory: false,
        };
        this.toggleMenuBar = this.toggleMenuBar.bind(this);
        this.changeStory = this.changeStory.bind(this);
        this.deleteStory = this.deleteStory.bind(this);
        this.setTitle = this.setTitle.bind(this);
    }

    componentDidMount() {
        axios.get(`http://localhost:5000/api/story`)
            .then(res => {
                const story = res.data;
                if (story[0] !== null) {
                    this.setState({stories: story, story: story[0], currentStoryId: story[0]._id});
                } else {
                    this.setState({noStory: true})
                }
            })
    }

    toggleMenuBar() {
        this.setState({menuBar: !this.state.menuBar});
    }

    getWidth() {
        if (this.state.menuBar) {
            return "calc(100% - 150px)";
        } else {
            return "100%";
        }
    }

    changeStory(element) {
        axios.get(`http://localhost:5000/api/story/` + element)
            .then(res => {
                const story = res.data;
                if (story !== null) {
                    this.setState({story: story, currentStoryId: story._id});
                } else {
                    this.setState({noStory: true})
                }
            });
    }

    setTitle(title) {
        let $this = this;
        axios({
                method: 'put',
                url: 'http://localhost:5000/api/story/' + this.state.currentStoryId,
                data: {
                    title: title,
                }
            })
            .then( function(response) {
                console.log(response.data);
                $this.setState({story: response.data})
            });
    }

    deleteStory() {
        axios({
            method: 'delete',
            url: 'http://localhost:5000/api/story/' + this.state.story._id,
        });
        window.location.reload();
    }

    render() {
        return (
            <React.Fragment>
                <HeaderBar stories={this.state.stories} story={this.state.story} menu={this.toggleMenuBar}
                           changeStory={this.changeStory}/>
                {
                    <div style={{display: "inline-block", width: this.getWidth()}}>
                        <StoryCrafter story={this.state.story} setTitle={this.setTitle}/>
                    </div>
                }
                {this.state.menuBar &&
                <div style={{display: "inline-block", verticalAlign: "top"}}>
                    <SettingsBar delete={this.deleteStory}/>
                </div>
                }
            </React.Fragment>
        )
    }
}

export default App;
