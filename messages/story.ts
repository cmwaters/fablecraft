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

  hasPermission(perm: PermissionGroup): boolean {
    return (perm == PermissionGroup.Owner || perm == PermissionGroup.Author)
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
  
  hasPermission(perm: PermissionGroup): boolean {
    return (perm == PermissionGroup.Owner || perm == PermissionGroup.Author)
  }
}
export class AddUserMessage implements MessageI {
  constructor(public userID: string, public permission: PermissionGroup) {
    this.userID = userID
    this.permission = permission
  }
  
  update(story: Story): MessageError | null {
    UserModel.findById(this.userID, (err: any, user: User) => {
      if (err) {
        return { reason: "cannot add user " + this.userID + " because " + err }
      }
      switch (this.permission) {
        case PermissionGroup.Owner: // Owner
          return { reason: "cannot add a owner to a story. Ownership can only change."}
        case PermissionGroup.Author: // Author
          if (story.authors === undefined) {
            story.authors = [user]
          } else {
            story.authors.push(user)
          }
          break
        case PermissionGroup.Editor: // Editor
          if (story.editors === undefined) {
            story.editors = [user]
          } else {
            story.editors.push(user)
          }
          break
        case PermissionGroup.Viewer: // Viewer
          if (story.viewers === undefined) {
            story.viewers = [user]
          } else {
            story.viewers.push(user)
          }
          break
        default: 
          return { reason: "unknown permission " + this.permission + " for adding a user"}
      }
    })
    return null
  }
  
  hasPermission(perm: PermissionGroup): boolean {
    switch (perm) {
      case PermissionGroup.Owner:
        return true
      case PermissionGroup.Author:
        return (perm < this.permission) // can only add editors and viewers
      default:
        return false
    }
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
  
  hasPermission(perm: PermissionGroup): boolean {
    switch (perm) {
      case PermissionGroup.Owner:
        return true
      case PermissionGroup.Author:
        return (perm < this.permission) // can only add editors and viewers
      default:
        return false
    }
  }
}