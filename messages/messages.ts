import { Story } from '../models/story'
import { Card, CardModel } from '../models/card'

// TODO: may be important to add timing
export type MessageSet = {
  // what is the permissions of the user that sent this permission set
  userPerm: PermissionGroup
  // what is the story that these messages should be associated with
  storyId: string,
  // the messages themselves
  messages: MessageI[]
}

// Used to signal if the message is invalid or if there is a problem with the database
export type MessageError = {
  reason: string,
}

export type MessageI = {
  update(story: Story): MessageError | null
}

export enum PermissionGroup {
  Owner,
  Author,
  Editor,
  Viewer
}

