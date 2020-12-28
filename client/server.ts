import Axios from 'axios'
import { Story } from '../models/story'
import { Card } from '../models/card'
import { User } from '../models/user'

let devMode = process.env.NODE_ENV == "development"

export namespace Server {

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
                    resolve(response.data as Card[])
                }).catch(err => {
                    if (devMode) console.log(err)
                    reject(err)
                })
        })
    }

    export function getUserProfile(): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            Axios.get("/api/user").then(response => {
                if (devMode) console.log(response.data)
                resolve(response.data as User)
            }).catch(err => {
                if (devMode) console.log(err)
                reject(err)
            })
        })
    }
}