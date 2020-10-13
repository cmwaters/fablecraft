import { MessageI, MessageError, PermissionGroup } from './messages'
import { Story } from '../models/story'
import { User, UserModel } from '../models/user'

export class TitleMessage implements MessageI {
  // probably should add more fields in the future for verification
  constructor(public title: string) {
    this.title = title
  }
  
  update(story: Story): MessageError | null {
    story.title = this.title
    return null
  }
}

export class DescriptionMessage implements MessageI {
  constructor(public description: string) {
    this.description = description
  }
  
  update(story: Story): MessageError | null {
    story.description = this.description
    return null
  }
}
export class AddUserMessage implements MessageI {
  constructor(public userID: string, public permission: PermissionGroup) {
    this.userID = userID
    this.permission = permission
  }
  
  // TODO: In the future we should check whether the user is already part of that permission group
  update(story: Story): MessageError | null {
    UserModel.findById(this.userID, (err: any, user: User) => {
      if (err) {
        return { reason: "cannot add user " + this.userID + " because " + err }
      }
      switch (this.permission) {
        case 0: // Owner
          return { reason: "cannot add a owner to a story. Ownership can only change."}
        case 1: // Author
          if (story.authors === undefined) {
            story.authors = [user]
          } else {
            story.authors.push(user)
          }
        case 2: // Editor
          if (story.editors === undefined) {
            story.editors = [user]
          } else {
            story.editors.push(user)
          }
        case 3: // Viewer
          if (story.viewers === undefined) {
            story.viewers = [user]
          } else {
            story.viewers.push(user)
          }
        default: 
          return { reason: "unknown permission " + this.permission + " for adding a user"}
      }
    })
    
    return null
  }
}

export class RemoveUserMessage implements MessageI {
  constructor(public userID: string, public permission: PermissionGroup) {
    this.userID = userID
    this.permission = permission
  }

  update(story: Story): MessageError | null {
    return null
  }
}