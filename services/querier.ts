import { DocumentHeader, DocumentModel } from "../models/header";
import { Card, CardModel } from "../models/card";
import { User, UserModel } from "../models/user";
import { PermissionGroup } from "./permissions";
import { validatePassword, validateEmail, validateUsername } from "./auth"
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { errors } from "./errors";
import { Document } from "./document";

// HTTP Responses
export interface HTTPResponse {
    status: number;
    body: any
}

function InternalErrorResponse(): HTTPResponse {
    return { status: 500, body: null }
}

function BadRequestError(message: string): HTTPResponse {
    return { status: 200, body: { error: message }}
}

function OKResponse(body: any): HTTPResponse {
    return { status: 200, body}
}

function CreatedResponse(body: any): HTTPResponse {
    return { status: 201, body }
}

function AuthorizationError(): HTTPResponse {
    return { status: 401, body: errors.UserPermissionDenied }
}


export namespace Querier {

    export async function changePassword(user: User, password: string): Promise<HTTPResponse> {
        let error = validatePassword(password)
        if (error) {
            return BadRequestError(error)
        }
        const salt = randomBytes(32);
        const passwordHashed = await argon2.hash(password, { salt });
        user.password = passwordHashed 
        await user.save()
        return OKResponse(null)
    }

    export async function changeEmail(user: User, email: string): Promise<HTTPResponse> {
        let error = validateEmail(email)
        if (error) {
            return BadRequestError(error)
        }
        let exists = await UserModel.exists({ email: email })
        if (exists) {
            return BadRequestError(errors.EmailExists)
        }
        user.email = email
        await user.save()
        return OKResponse(null)
    }

    export async function checkUsername(username: string): Promise<HTTPResponse> {
        let error = validateUsername(username)
        if (error) {
            return BadRequestError(error)
        }
        let exists = await UserModel.exists({username: username})
        return OKResponse(exists)
    }

    export async function changeUsername(user: User, newUsername: string): Promise<HTTPResponse> {
        let error = validateUsername(newUsername)
        if (error) {
            return BadRequestError(error)
        }
        try {
            let exists = await UserModel.exists({ username: newUsername })
            if (exists) {
                return BadRequestError(errors.UserAlreadyExists)
            }
            user.username = newUsername
            await user.save()
            return OKResponse(null)
        } catch (error) {
            console.error(error)
            return InternalErrorResponse()
        }
    }

    export async function changeName(user: User, newName: string): Promise<HTTPResponse> {
        try {
            user.name = newName
            await user.save()
            return OKResponse(null)
        } catch (error) {
            console.error(error)
            return InternalErrorResponse()
        }
    }

    export async function deleteUser(user: User): Promise<HTTPResponse> {
        try {
            await user.remove()
            return OKResponse(null)
        } catch (error) {
            console.error(error)
            return InternalErrorResponse()
        }
    }
    
    export async function createDocument(user: User, title: string): Promise<HTTPResponse> {
        try {
            let document = Document.create(user, title);
            return CreatedResponse(document)
        } catch (error) {
            if (error.message === errors.MissingTitle) {
                return BadRequestError(error.message)
            }
            console.error(error)
            return InternalErrorResponse()
        }
    }

    export async function getDocumentHeaders(user: User): Promise<HTTPResponse> {
        try {
            let documents: DocumentHeader[] = []
            for (let id of user.documents) {
                let document = await DocumentModel.findById(id)
                if (document) {
                    documents.push(document)
                }
            }
            return OKResponse(documents)
        } catch (error) {
            console.error(error)
            return InternalErrorResponse()
        }
    }

    export async function getDocument(user: User, documentId: string, headerOnly: boolean = false): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId)
            if (headerOnly) {
                return OKResponse(document.header)
            }
            await document.loadCards()
            return OKResponse(document)
        } catch (error) {
            switch (error) {
                case errors.DocumentNotFound:
                    return BadRequestError(error)
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function deleteDocument(user: User, documentId: string): Promise<HTTPResponse> {
        try {
            await Document.delete(user, documentId)
            return OKResponse(null)
        } catch (error) {
            switch (error) {
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                case errors.DocumentNotFound:
                    return BadRequestError(error)
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function modifyDocumentTitle(user: User, documentId: string, newTitle: string): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId, PermissionGroup.Owner)
            await document.modifyTitle(newTitle)
            return OKResponse(null)
        } catch (error) {
            if (error.message === errors.UserPermissionDenied) {
                return AuthorizationError()
            }
            console.error(error)
            return InternalErrorResponse()
        }
    }

    export async function addPermission(requester: User, documentId: string, userId: string,permission: number): Promise<HTTPResponse> {
        try {
            let document = await Document.load(requester, documentId, PermissionGroup.Author)
            await document.addPermission(requester, userId, permission)

            return OKResponse(null)
        } catch (error) {
            switch (error) {
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                case errors.UserNotFound:
                    return BadRequestError(error)
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function removePermission(requester: User, documentId: string, userId: string): Promise<HTTPResponse> {
        try {
            let document = await Document.load(requester, documentId)
            await document.removePermission(requester, userId)

            return OKResponse(null)
        } catch (error) {
            switch (error) {
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function addCardAbove(user: User, documentId: string, siblingCardId: string, text: string): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId)
            let newCard = await document.addCardAbove(user, siblingCardId, text)
            return CreatedResponse(newCard)

        } catch (error) {
            switch (error) {
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function addCardBelow(user: User, documentId: string, siblingCardId: string, text: string): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId)
            let newCard = await document.addCardBelow(user, siblingCardId, text)
            return CreatedResponse(newCard)

        } catch (error) {
            switch (error) {
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function addChildCard(user: User, documentId: string, parentCardId: string, text: string): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId)
            let newCard = await document.addChildCard(user, parentCardId, text)
            return CreatedResponse(newCard)

        } catch (error) {
            switch (error) {
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function moveCardDown(user: User, documentId: string, cardIndex: number): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId)
            document.moveCardDown(user, cardIndex)
            return OKResponse(null)
        } catch (error) {
            switch (error) {
                case errors.LowerCardBound:
                    return BadRequestError(error)
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function moveCardUp(user: User, documentId: string, cardIndex: number): Promise<HTTPResponse>{
        try {
            let document = await Document.load(user, documentId)
            document.moveCardUp(user, cardIndex)
            return OKResponse(null)
        } catch (error) {
            switch (error) {
                case errors.LowerCardBound:
                    return BadRequestError(error)
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    // updateCard allows users with Author or Owner permission to replace the
    // text in a card
    // TODO: Imagine if the card was really large. Users should have the option to add
    // their incremental change only
    export async function updateCard(user: User, documentId: string, cardIndex: string, text: string): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId)
            await document.updateCard(user, Number(cardIndex), text)

            return OKResponse(null)
        } catch (error) {
            switch (error) {
                case errors.CardNotFound:
                    return BadRequestError(error)
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }

    export async function deleteCard(user: User, documentId: string, cardIndex: string): Promise<HTTPResponse> {
        try {
            let document = await Document.load(user, documentId)
            await document.deleteCard(user, Number(cardIndex))

            return OKResponse(null)
        } catch (error) {
            switch (error) {
                case errors.CardNotFound:
                    return BadRequestError(error)
                case errors.UserPermissionDenied:
                    return AuthorizationError()
                default:
                    console.error(error)
                    return InternalErrorResponse()
            }
        }
    }
}
