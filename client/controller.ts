import { User } from '../models/user';
import { Model } from './model'
import { Server } from './server'

export namespace Controller {


    export function getUserProfile(): Promise<User> {
        return Server.getUserProfile()
    }

    export function init() {
        
    }   
}