import Axios from 'axios'
import { Story } from './model/story'
import { Card } from '../models/card'
import { User } from './model/user'
import { resolve } from '../webpack.config'

let devMode = process.env.NODE_ENV == "development"

export namespace Server {

    export function login(username: string, password: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            Axios.post("/auth/login", {
                 username: username, 
                 password: password
            })
            .then(response => {
                if (devMode) console.log(response.data)
                resolve(response.data)
            })
            .catch(err => {
                if (devMode) console.log(err)
                reject(err)
            })
        })
    }

    export function signup(username: string, email: string, password: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            Axios.post("/auth/signup", {
                username: username,
                email: email,
                password: password
            })
                .then(response => {
                    if (devMode) console.log(response.data)
                    resolve(response.data)
                })
                .catch(err => {
                    if (devMode) console.log(err)
                    reject(err)
                })
        })
    }

    export function createStory(title: string, description?: string): Promise<{story: Story, rootCard: Card}> {
        return new Promise<{story: Story, rootCard: Card}>((resolve, reject) => {
            Axios.post("/api/story", {
                title: title,
                description: description,
            })
                .then(response => {
                    if (devMode) console.log(response.data)
                    resolve(response.data as {story: Story, rootCard: Card})
                })
                .catch(err => {
                    if (devMode) console.log(err)
                    reject(err)
                })
        })
    }

    export function getStory(storyId: any): Promise<Story> {
        return new Promise<Story>((resolve, reject) => {
            Axios.get("/api/story/" + storyId, { withCredentials: true })
                .then(response => {
                    if (devMode) console.log(response.data)
                    resolve(response.data)
                })
                .catch(err => {
                    if (devMode) console.log(err)
                    reject(err)
                })
        })  
    }

    export function getLastStory(): Promise<Story> {
        return new Promise<Story>((resolve, reject) => {
            Axios.get("/api/story/last", { withCredentials: true })
                .then(response => {
                    if (devMode) console.log(response.data)
                    resolve(response.data as Story)
                })
                .catch(err => {
                    if (devMode) console.log(err)
                    reject(err)
                })
        })
    }

    export function getCards(storyId: any): Promise<Card[]> {
        return new Promise<Card[]>((resolve, reject) => {
            Axios.get("/api/cards/" + storyId, { withCredentials: true })
                .then(response => {
                    if (devMode) console.log(response.data)
                    resolve(response.data.cards as Card[])
                }).catch(err => {
                    if (devMode) console.log(err)
                    reject(err)
                })
        })
    }

    export function getUserProfile(): Promise<User | undefined> {
        return new Promise<User | undefined>((resolve, reject) => {
            Axios.get("/api/user").then(response => {
                if (devMode) console.log(response.data)
                resolve(response.data as User)
            }).catch(err => {
                if (devMode) console.log(err)
                if (err.response) {
                    // no user is logged in at the moment
                    if (err.response.status === 401) {
                        resolve(undefined)
                    }
                }
                reject(err)
            })
        })
    }

    function processErr(err: any) {

    }
}