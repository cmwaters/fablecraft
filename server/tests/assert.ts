import { UserModel, User } from "../models/user";
import { DocumentHeader, DocumentModel } from "../models/header";
import { Document } from '../services/document'
import { PermissionGroup } from "../services/permissions";

export namespace Assert {
    
    export async function userHasPermission(userId: string, documentId: string, permission: PermissionGroup): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            DocumentModel.findById(documentId, (err: any, header: DocumentHeader) => {
                if (err) {
                    console.error(err);
                    reject(err)
                }
                let document = new Document(header)

                UserModel.findById(userId, (err: any, user: User) => {
                    if (err) {
                        console.error(err);
                        reject(err)
                    }
                    resolve(document.getPermission(user) === permission);
                });
            });
        });
    }

    export async function lastStory(userId: string, documentId: string): Promise<boolean> {
        let user = await UserModel.findById(userId)
        if (!user) {
            throw new Error("User not found")
        }

        return user.lastDocument === documentId
    }
}